using CairoBags.Data;
using CairoBags.Dto.Orders;
using CairoBags.Models;
using CairoBags.Models.Inventories;
using CairoBags.Models.Orders;
using CairoBags.Models.Reviews;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class OrderService : IOrderService
{
    private static readonly OrderStatus[] CancellableOrderStatuses =
    {
        OrderStatus.Pending,
        OrderStatus.AwaitingPayment,
        OrderStatus.PaymentProofSubmitted
    };

    private static readonly OrderStatus[] ReviewEligibleOrderStatuses =
    {
        OrderStatus.Delivered,
        OrderStatus.Completed,
    };

    private readonly CairoBagsContext _context;
    private readonly NotificationService _notificationService;

    public OrderService(CairoBagsContext context, NotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<IReadOnlyList<OrderListItemDto>> GetMyOrdersAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var orders = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.Payment)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ThenByDescending(o => o.Id)
            .ToListAsync(cancellationToken);

        var productIds = orders
            .Where(o => ReviewEligibleOrderStatuses.Contains(o.Status))
            .SelectMany(o => o.Items)
            .Select(i => i.ProductId)
            .Distinct()
            .ToList();

        var reviewLookup = await GetUserReviewLookupAsync(userId, productIds, cancellationToken);

        return orders.Select(o => MapListItem(o, reviewLookup)).ToList();
    }

    public async Task<ServiceResult<OrderDetailDto>> GetOrderByIdAsync(
        string userId,
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.Payment!)
                .ThenInclude(p => p.PaymentMethod)
            .Include(o => o.StatusHistory)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId, cancellationToken);

        if (order == null)
        {
            return ServiceResult<OrderDetailDto>.Fail(
                "order_not_found",
                "Order not found.",
                StatusCodes.Status404NotFound);
        }

        return ServiceResult<OrderDetailDto>.Ok(await MapOrderDetailAsync(order, userId, cancellationToken));
    }

    public async Task<ServiceResult<CancelOrderResponseDto>> CancelOrderAsync(
        string userId,
        int orderId,
        CancellationToken cancellationToken = default)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId, cancellationToken);

            if (order == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<CancelOrderResponseDto>.Fail(
                    "order_not_found",
                    "Order not found.",
                    StatusCodes.Status404NotFound);
            }

            if (!CancellableOrderStatuses.Contains(order.Status))
            {
                await transaction.RollbackAsync(cancellationToken);
                return ServiceResult<CancelOrderResponseDto>.Fail(
                    "cancellation_not_allowed",
                    "This order cannot be cancelled in its current status.");
            }

            var variantIds = order.Items.Select(i => i.ProductVariantId).Distinct().ToList();
            var inventories = await _context.Inventories
                .Where(i => variantIds.Contains(i.ProductVariantId))
                .ToDictionaryAsync(i => i.ProductVariantId, cancellationToken);

            var now = DateTime.UtcNow;
            var oldStatus = order.Status;
            var releasedItems = new List<ReleasedInventoryItemDto>();

            foreach (var item in order.Items)
            {
                if (!inventories.TryGetValue(item.ProductVariantId, out var inventory))
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return ServiceResult<CancelOrderResponseDto>.Fail(
                        "inventory_not_found",
                        $"Inventory not found for variant {item.ProductVariantId}.");
                }

                if (item.Quantity > inventory.QuantityReserved)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    return ServiceResult<CancelOrderResponseDto>.Fail(
                        "invalid_release",
                        $"Cannot release more than reserved quantity for SKU {item.Sku}.");
                }

                inventory.QuantityReserved -= item.Quantity;
                inventory.UpdatedAt = now;
                inventory.UpdatedBy = userId;

                inventory.Movements.Add(new InventoryMovement
                {
                    Type = InventoryMovementType.ReleaseReservation,
                    Quantity = item.Quantity,
                    Notes = $"Released reservation for cancelled order {order.OrderNumber}",
                    ReferenceNumber = order.OrderNumber,
                    CreatedAt = now,
                    CreatedBy = userId
                });

                releasedItems.Add(new ReleasedInventoryItemDto
                {
                    ProductVariantId = item.ProductVariantId,
                    Sku = item.Sku,
                    QuantityReleased = item.Quantity
                });
            }

            order.Status = OrderStatus.Cancelled;
            order.UpdatedAt = now;
            order.UpdatedBy = userId;
            order.StatusHistory.Add(new OrderStatusHistory
            {
                OldStatus = oldStatus,
                NewStatus = OrderStatus.Cancelled,
                Notes = "Order cancelled by customer.",
                CreatedAt = now,
                CreatedBy = userId
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            await _notificationService.TryCreateAndNotifyAsync(
                userId,
                "Order cancelled",
                $"Your order {order.OrderNumber} has been cancelled successfully.",
                NotificationType.OrderCancelled,
                NotificationTargetTypes.Order,
                order.Id,
                order.OrderNumber,
                cancellationToken);

            return ServiceResult<CancelOrderResponseDto>.Ok(new CancelOrderResponseDto
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                OrderStatus = OrderStatus.Cancelled.ToString(),
                ReleasedInventory = releasedItems
            });
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ServiceResult<CancelOrderResponseDto>.Fail(
                "concurrency_conflict",
                "Inventory was updated during cancellation. Please try again.",
                StatusCodes.Status409Conflict);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static OrderListItemDto MapListItem(
        Order order,
        IReadOnlyDictionary<int, ProductReview> reviewLookup)
    {
        var primaryImage = order.Items
            .OrderBy(i => i.Id)
            .Select(i => i.ImageUrl)
            .FirstOrDefault(url => !string.IsNullOrWhiteSpace(url));

        return new OrderListItemDto
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            CreatedAt = order.CreatedAt,
            OrderStatus = order.Status.ToString(),
            PaymentStatus = order.Payment?.Status.ToString(),
            TotalAmount = order.TotalAmount,
            ItemsCount = order.Items.Count,
            PrimaryProductImage = primaryImage,
            ReviewableItems = ReviewEligibleOrderStatuses.Contains(order.Status)
                ? order.Items
                    .GroupBy(i => i.ProductId)
                    .Select(g =>
                    {
                        var item = g.First();
                        reviewLookup.TryGetValue(item.ProductId, out var review);
                        return MapReviewStatus(item, review);
                    })
                    .ToList()
                : Array.Empty<OrderItemReviewStatusDto>()
        };
    }

    private async Task<OrderDetailDto> MapOrderDetailAsync(
        Order order,
        string userId,
        CancellationToken cancellationToken)
    {
        IReadOnlyDictionary<int, ProductReview> reviewLookup = new Dictionary<int, ProductReview>();
        if (ReviewEligibleOrderStatuses.Contains(order.Status))
        {
            var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
            reviewLookup = await GetUserReviewLookupAsync(userId, productIds, cancellationToken);
        }

        return new OrderDetailDto
        {
            Order = new OrderInformationDto
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CreatedAt = order.CreatedAt,
                OrderStatus = order.Status.ToString(),
                SubTotal = order.SubTotal,
                ShippingFee = order.ShippingFee,
                DiscountAmount = order.DiscountAmount,
                TotalAmount = order.TotalAmount,
                CurrencyCode = order.CurrencyCode,
                Notes = order.Notes
            },
            ShippingAddress = new OrderShippingAddressDto
            {
                FullName = order.ShippingFullName,
                PhoneNumber = order.ShippingPhoneNumber,
                Governorate = order.ShippingGovernorate,
                City = order.ShippingCity,
                AddressLine1 = order.ShippingAddressLine1,
                AddressLine2 = order.ShippingAddressLine2,
                PostalCode = order.ShippingPostalCode
            },
            Payment = order.Payment == null
                ? null
                : new OrderPaymentInfoDto
                {
                    PaymentId = order.Payment.Id,
                    PaymentMethod = order.Payment.PaymentMethod.Type.ToString(),
                    PaymentStatus = order.Payment.Status.ToString(),
                    Amount = order.Payment.Amount,
                    SenderName = order.Payment.SenderName,
                    SenderPhone = order.Payment.SenderPhone,
                    TransactionReference = order.Payment.TransactionReference
                },
            Items = order.Items
                .OrderBy(i => i.Id)
                .Select(item =>
                {
                    reviewLookup.TryGetValue(item.ProductId, out var review);
                    return MapOrderItem(item, review);
                })
                .ToList(),
            Coupon = string.IsNullOrWhiteSpace(order.CouponCode)
                ? null
                : new OrderCouponInfoDto
                {
                    Code = order.CouponCode,
                    DiscountAmount = order.CouponDiscount ?? order.DiscountAmount
                },
            StatusHistory = order.StatusHistory
                .OrderBy(h => h.CreatedAt)
                .ThenBy(h => h.Id)
                .Select(MapStatusHistory)
                .ToList()
        };
    }

    private async Task<Dictionary<int, ProductReview>> GetUserReviewLookupAsync(
        string userId,
        IReadOnlyCollection<int> productIds,
        CancellationToken cancellationToken)
    {
        if (productIds.Count == 0)
            return new Dictionary<int, ProductReview>();

        var reviews = await _context.ProductReviews
            .AsNoTracking()
            .Where(r => r.UserId == userId && productIds.Contains(r.ProductId))
            .ToListAsync(cancellationToken);

        return reviews
            .GroupBy(r => r.ProductId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.CreatedAt).First());
    }

    private static OrderItemReviewStatusDto MapReviewStatus(OrderItem item, ProductReview? review) =>
        new()
        {
            ProductId = item.ProductId,
            ProductNameAr = item.ProductNameAr,
            ProductNameEn = item.ProductNameEn,
            HasReviewed = review != null,
            ReviewId = review?.Id,
            ReviewRating = review?.Rating,
            ReviewTitle = review?.Title,
            ReviewComment = review?.Comment,
        };

    private static OrderItemDto MapOrderItem(OrderItem item, ProductReview? review) =>
        new()
        {
            OrderItemId = item.Id,
            ProductId = item.ProductId,
            ProductVariantId = item.ProductVariantId,
            ProductNameAr = item.ProductNameAr,
            ProductNameEn = item.ProductNameEn,
            ColorNameAr = item.ColorNameAr,
            ColorNameEn = item.ColorNameEn,
            Sku = item.Sku,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            LineTotal = item.UnitPrice * item.Quantity,
            ImageUrl = item.ImageUrl,
            HasReviewed = review != null,
            ReviewId = review?.Id,
            ReviewRating = review?.Rating,
            ReviewTitle = review?.Title,
            ReviewComment = review?.Comment,
        };

    private static OrderStatusHistoryDto MapStatusHistory(OrderStatusHistory history) =>
        new()
        {
            OldStatus = history.OldStatus?.ToString(),
            NewStatus = history.NewStatus.ToString(),
            Notes = history.Notes,
            CreatedAt = history.CreatedAt
        };
}
