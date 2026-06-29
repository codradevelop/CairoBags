using CairoBags.Data;
using CairoBags.Dto.Checkout;
using CairoBags.Dto.Coupons;
using CairoBags.Dto.Store;
using CairoBags.Hubs;
using CairoBags.Models.Catalog;
using CairoBags.Models.Commerce;
using CairoBags.Models.Coupons;
using CairoBags.Models.Inventories;
using CairoBags.Models.Orders;
using CairoBags.Models.Payments;
using CairoBags.Models.Shipping;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class CheckoutService : ICheckoutService
{
    private readonly CairoBagsContext _context;
    private readonly ICouponService _couponService;
    private readonly IShippingFeeService _shippingFeeService;
    private readonly IStoreUpdateBroadcastService _storeBroadcast;

    public CheckoutService(
        CairoBagsContext context,
        ICouponService couponService,
        IShippingFeeService shippingFeeService,
        IStoreUpdateBroadcastService storeBroadcast)
    {
        _context = context;
        _couponService = couponService;
        _shippingFeeService = shippingFeeService;
        _storeBroadcast = storeBroadcast;
    }

    public async Task<ServiceResult<CheckoutResponseDto>> CheckoutAsync(
        string userId,
        CheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var cart = await _context.Carts
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

            if (cart == null || cart.Items.Count == 0)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<CheckoutResponseDto>.Fail("cart_empty", "Cart is empty.");
            }

            var addressResult = await ValidateShippingAddressAsync(userId, request.ShippingAddressId, cancellationToken);
            if (addressResult.Error != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<CheckoutResponseDto>.Fail(
                    addressResult.Error.ErrorCode,
                    addressResult.Error.Message,
                    addressResult.Error.StatusCode);
            }

            var paymentMethod = await _context.PaymentMethods
                .FirstOrDefaultAsync(p => p.Type == request.PaymentMethod && p.IsActive, cancellationToken);

            if (paymentMethod == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<CheckoutResponseDto>.Fail("payment_method_invalid", "Payment method is not available.");
            }

            var lineItems = await BuildCheckoutLineItemsAsync(cart, cancellationToken);
            if (lineItems.Error != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<CheckoutResponseDto>.Fail(
                    lineItems.Error.ErrorCode,
                    lineItems.Error.Message,
                    lineItems.Error.StatusCode);
            }

            var subTotal = lineItems.Lines!.Sum(l => l.UnitPrice * l.Quantity);

            var couponResult = await ValidateCouponAsync(
                request.CouponCode,
                userId,
                lineItems.Lines!,
                cancellationToken);

            if (couponResult.Error != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<CheckoutResponseDto>.Fail(
                    couponResult.Error.ErrorCode,
                    couponResult.Error.Message);
            }

            var discountAmount = couponResult.DiscountAmount;
            var coupon = couponResult.Coupon;
            var subtotalAfterDiscount = Math.Max(0m, subTotal - discountAmount);

            if (!await _shippingFeeService.IsKnownGovernorateAsync(
                    addressResult.Address!.Governorate,
                    cancellationToken))
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<CheckoutResponseDto>.Fail(
                    "shipping_unavailable",
                    "Shipping is currently unavailable for the selected governorate. Please choose another governorate or contact support.");
            }

            var shippingFee = await _shippingFeeService.CalculateShippingFeeAsync(
                addressResult.Address.Governorate,
                coupon,
                cancellationToken);

            var totalAmount = subtotalAfterDiscount + shippingFee;
            var now = DateTime.UtcNow;
            // Shipping address and fee are snapshotted on the order and never recalculated later.
            var orderNumber = await GenerateOrderNumberAsync(cancellationToken);
            var orderStatus = request.PaymentMethod == PaymentMethodType.CashOnDelivery
                ? OrderStatus.Pending
                : OrderStatus.AwaitingPayment;

            var order = new Order
            {
                UserId = userId,
                OrderNumber = orderNumber,
                Status = orderStatus,
                SubTotal = subTotal,
                ShippingFee = shippingFee,
                DiscountAmount = discountAmount,
                CouponCode = coupon?.Code,
                CouponDiscount = coupon == null ? null : discountAmount,
                TotalAmount = totalAmount,
                CurrencyCode = await GetCurrencyCodeAsync(cancellationToken),
                ShippingFullName = addressResult.Address.FullName,
                ShippingPhoneNumber = addressResult.Address.PhoneNumber,
                ShippingGovernorate = addressResult.Address.Governorate,
                ShippingCity = addressResult.Address.City,
                ShippingAddressLine1 = addressResult.Address.AddressLine1,
                ShippingAddressLine2 = addressResult.Address.AddressLine2,
                ShippingPostalCode = addressResult.Address.PostalCode,
                Notes = NormalizeOptional(request.Notes),
                CreatedAt = now,
                CreatedBy = userId,
                Items = lineItems.Lines!.Select(l => new OrderItem
                {
                    ProductId = l.ProductId,
                    ProductVariantId = l.VariantId,
                    ProductNameAr = l.ProductNameAr,
                    ProductNameEn = l.ProductNameEn,
                    ColorNameAr = l.ColorNameAr,
                    ColorNameEn = l.ColorNameEn,
                    Sku = l.Sku,
                    UnitPrice = l.UnitPrice,
                    Quantity = l.Quantity,
                    ImageUrl = l.ImageUrl,
                    CreatedAt = now,
                    CreatedBy = userId
                }).ToList(),
                StatusHistory = new List<OrderStatusHistory>
                {
                    new()
                    {
                        OldStatus = null,
                        NewStatus = orderStatus,
                        Notes = "Order created at checkout.",
                        CreatedAt = now,
                        CreatedBy = userId
                    }
                },
                Payment = new OrderPayment
                {
                    PaymentMethodId = paymentMethod.Id,
                    Status = PaymentStatus.Pending,
                    Amount = totalAmount,
                    CreatedAt = now,
                    CreatedBy = userId
                }
            };

            _context.Orders.Add(order);

            if (coupon != null)
            {
                coupon.UsageCount += 1;
                coupon.UpdatedAt = now;
                order.CouponUsage = new CouponUsage
                {
                    CouponId = coupon.Id,
                    UserId = userId,
                    DiscountAmount = discountAmount,
                    CreatedAt = now,
                    CreatedBy = userId
                };
            }

            foreach (var line in lineItems.Lines!)
            {
                var inventory = line.Inventory;
                inventory.QuantityReserved += line.Quantity;
                inventory.UpdatedAt = now;
                inventory.UpdatedBy = userId;

                inventory.Movements.Add(new InventoryMovement
                {
                    Type = InventoryMovementType.Reservation,
                    Quantity = line.Quantity,
                    Notes = $"Reserved for order {orderNumber}",
                    ReferenceNumber = orderNumber,
                    CreatedAt = now,
                    CreatedBy = userId
                });
            }

            _context.CartItems.RemoveRange(cart.Items);
            cart.UpdatedAt = now;

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await BroadcastCheckoutInventoryAsync(lineItems.Lines!, cancellationToken);

            return ServiceResult<CheckoutResponseDto>.Ok(new CheckoutResponseDto
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                SubTotal = order.SubTotal,
                DiscountAmount = order.DiscountAmount,
                ShippingFee = order.ShippingFee,
                TotalAmount = order.TotalAmount,
                PaymentMethod = request.PaymentMethod.ToString(),
                PaymentStatus = PaymentStatus.Pending.ToString(),
                OrderStatus = orderStatus.ToString(),
                NextStepMessage = BuildNextStepMessage(request.PaymentMethod)
            });
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ServiceResult<CheckoutResponseDto>.Fail(
                "concurrency_conflict",
                "Inventory was updated during checkout. Please review your cart and try again.",
                StatusCodes.Status409Conflict);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private async Task<(ShippingAddress? Address, ServiceError? Error)> ValidateShippingAddressAsync(
        string userId,
        int shippingAddressId,
        CancellationToken cancellationToken)
    {
        var address = await _context.ShippingAddresses
            .FirstOrDefaultAsync(a => a.Id == shippingAddressId && a.UserId == userId, cancellationToken);

        if (address == null)
            return (null, new ServiceError("shipping_address_not_found", "Shipping address not found.", StatusCodes.Status404NotFound));

        if (string.IsNullOrWhiteSpace(address.FullName) ||
            string.IsNullOrWhiteSpace(address.PhoneNumber) ||
            string.IsNullOrWhiteSpace(address.Governorate) ||
            string.IsNullOrWhiteSpace(address.City) ||
            string.IsNullOrWhiteSpace(address.AddressLine1))
        {
            return (null, new ServiceError("shipping_address_invalid", "Shipping address is incomplete."));
        }

        return (address, null);
    }

    private async Task<(List<CheckoutLine>? Lines, ServiceError? Error)> BuildCheckoutLineItemsAsync(
        Cart cart,
        CancellationToken cancellationToken)
    {
        var variantIds = cart.Items.Select(i => i.ProductVariantId).Distinct().ToList();
        var variants = await _context.ProductVariants
            .Include(v => v.Inventory)
            .Include(v => v.Product).ThenInclude(p => p.Translations)
            .Include(v => v.Product).ThenInclude(p => p.Images)
            .Include(v => v.Images)
            .Where(v => variantIds.Contains(v.Id))
            .ToDictionaryAsync(v => v.Id, cancellationToken);

        var lines = new List<CheckoutLine>();

        foreach (var cartItem in cart.Items)
        {
            if (!variants.TryGetValue(cartItem.ProductVariantId, out var variant) ||
                !IsVariantSellable(variant))
            {
                return (null, new ServiceError("product_unavailable", "One or more cart items are no longer available."));
            }

            if (variant.Inventory == null)
                return (null, new ServiceError("inventory_not_found", "Inventory record is missing for a cart item."));

            var available = GetAvailableStock(variant.Inventory);
            if (cartItem.Quantity > available)
            {
                return (null, new ServiceError(
                    "insufficient_stock",
                    $"Insufficient stock for SKU {variant.Sku}. Only {available} available."));
            }

            lines.Add(new CheckoutLine
            {
                ProductId = variant.ProductId,
                VariantId = variant.Id,
                ProductNameAr = variant.Product.Translations.FirstOrDefault(t => t.LanguageCode == "ar")?.Name ?? string.Empty,
                ProductNameEn = variant.Product.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name ?? string.Empty,
                ColorNameAr = variant.ColorNameAr,
                ColorNameEn = variant.ColorNameEn,
                Sku = variant.Sku,
                UnitPrice = variant.Price,
                Quantity = cartItem.Quantity,
                ImageUrl = ResolveImageUrl(variant),
                CategoryId = variant.Product.CategoryId,
                Inventory = variant.Inventory
            });
        }

        return (lines, null);
    }

    private async Task<(Coupon? Coupon, decimal DiscountAmount, ServiceError? Error)> ValidateCouponAsync(
        string? couponCode,
        string userId,
        IReadOnlyList<CheckoutLine> lines,
        CancellationToken cancellationToken)
    {
        var subTotal = lines.Sum(l => l.UnitPrice * l.Quantity);
        var validationLines = lines.Select(l => new CouponValidationLineDto
        {
            ProductId = l.ProductId,
            CategoryId = l.CategoryId,
            UnitPrice = l.UnitPrice,
            Quantity = l.Quantity
        }).ToList();

        var result = await _couponService.ValidateCouponForOrderAsync(
            couponCode,
            userId,
            subTotal,
            validationLines,
            cancellationToken);

        if (!result.IsValid)
        {
            return (null, 0m, new ServiceError(
                result.ErrorCode!,
                result.ErrorMessage!));
        }

        return (result.Coupon, result.DiscountAmount, null);
    }

    private async Task<string> GenerateOrderNumberAsync(CancellationToken cancellationToken)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"CB-{year}-";

        var lastOrderNumber = await _context.Orders
            .AsNoTracking()
            .Where(o => o.OrderNumber.StartsWith(prefix))
            .OrderByDescending(o => o.OrderNumber)
            .Select(o => o.OrderNumber)
            .FirstOrDefaultAsync(cancellationToken);

        var sequence = 1;
        if (!string.IsNullOrEmpty(lastOrderNumber) && lastOrderNumber.Length > prefix.Length)
        {
            var suffix = lastOrderNumber[prefix.Length..];
            if (int.TryParse(suffix, out var lastSequence))
                sequence = lastSequence + 1;
        }

        return $"{prefix}{sequence:D6}";
    }

    private async Task<string> GetCurrencyCodeAsync(CancellationToken cancellationToken)
    {
        var settings = await _context.SystemSettings.AsNoTracking().FirstOrDefaultAsync(s => s.Id == 1, cancellationToken);
        return string.IsNullOrWhiteSpace(settings?.DefaultCurrency) ? "EGP" : settings.DefaultCurrency;
    }

    private static bool IsVariantSellable(ProductVariant variant) =>
        variant.Status == VariantStatus.Active &&
        !variant.Product.IsDeleted &&
        variant.Product.Status == ProductStatus.Active;

    private static int GetAvailableStock(Inventory inventory) =>
        Math.Max(0, inventory.QuantityOnHand - inventory.QuantityReserved);

    private static string? ResolveImageUrl(ProductVariant variant)
    {
        var variantImage = variant.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .FirstOrDefault();

        if (variantImage != null)
            return variantImage.ThumbnailUrl ?? variantImage.ImageUrl;

        var productImage = variant.Product.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .FirstOrDefault();

        return productImage?.ThumbnailUrl ?? productImage?.ImageUrl;
    }

    private static string BuildNextStepMessage(PaymentMethodType paymentMethod) =>
        paymentMethod switch
        {
            PaymentMethodType.CashOnDelivery =>
                "Your order has been placed successfully. Please prepare payment on delivery.",
            PaymentMethodType.InstaPay =>
                "Your order has been created. Complete payment via InstaPay and upload your payment proof.",
            PaymentMethodType.VodafoneCash =>
                "Your order has been created. Send payment via Vodafone Cash and upload your payment proof.",
            PaymentMethodType.OrangeCash =>
                "Your order has been created. Send payment via Orange Cash and upload your payment proof.",
            PaymentMethodType.EtisalatCash =>
                "Your order has been created. Send payment via Etisalat Cash and upload your payment proof.",
            PaymentMethodType.WEPay =>
                "Your order has been created. Complete payment via WE Pay and upload your payment proof.",
            _ => "Your order has been created successfully."
        };

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private async Task BroadcastCheckoutInventoryAsync(
        IReadOnlyList<CheckoutLine> lines,
        CancellationToken cancellationToken)
    {
        var broadcastedProducts = new HashSet<int>();

        foreach (var line in lines)
        {
            var available = GetAvailableStock(line.Inventory);

            await _storeBroadcast.BroadcastStorefrontAsync(
                StoreUpdateEvents.InventoryUpdated,
                new StoreUpdatePayloadDto
                {
                    EntityId = line.VariantId,
                    VariantId = line.VariantId,
                    ProductId = line.ProductId,
                    AvailableStock = available,
                    IsInStock = available > 0,
                },
                cancellationToken);

            if (!broadcastedProducts.Add(line.ProductId))
                continue;

            await _storeBroadcast.BroadcastStorefrontAsync(
                StoreUpdateEvents.ProductUpdated,
                new StoreUpdatePayloadDto
                {
                    EntityId = line.ProductId,
                    ProductId = line.ProductId,
                    CategoryId = line.CategoryId,
                    IsActive = true,
                },
                cancellationToken);
        }
    }

    private sealed class CheckoutLine
    {
        public int ProductId { get; init; }
        public int VariantId { get; init; }
        public int CategoryId { get; init; }
        public string ProductNameAr { get; init; } = string.Empty;
        public string ProductNameEn { get; init; } = string.Empty;
        public string ColorNameAr { get; init; } = string.Empty;
        public string ColorNameEn { get; init; } = string.Empty;
        public string Sku { get; init; } = string.Empty;
        public decimal UnitPrice { get; init; }
        public int Quantity { get; init; }
        public string? ImageUrl { get; init; }
        public Inventory Inventory { get; init; } = null!;
    }

    private sealed record ServiceError(string ErrorCode, string Message, int StatusCode = 400);
}
