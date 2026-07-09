using CairoBags.Data;
using CairoBags.Dto.Coupons;
using CairoBags.Dto.Store;
using CairoBags.Hubs;
using CairoBags.Models.Catalog;
using CairoBags.Models.Commerce;
using CairoBags.Models.Coupons;
using CairoBags.Models.Orders;
using CairoBags.Models.Shipping;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class CouponService : ICouponService
{
    private readonly CairoBagsContext _context;
    private readonly IShippingFeeService _shippingFeeService;
    private readonly IStoreUpdateBroadcastService _storeBroadcast;

    public CouponService(
        CairoBagsContext context,
        IShippingFeeService shippingFeeService,
        IStoreUpdateBroadcastService storeBroadcast)
    {
        _context = context;
        _shippingFeeService = shippingFeeService;
        _storeBroadcast = storeBroadcast;
    }

    public async Task<AdminCouponStatsDto> GetStatsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var coupons = await _context.Coupons.AsNoTracking().ToListAsync(cancellationToken);
        var total = coupons.Count;
        var active = coupons.Count(c => c.IsActive && c.StartDate <= now && c.EndDate >= now);
        var expired = coupons.Count(c => c.EndDate < now);
        var used = coupons.Count(c => c.UsageCount > 0);
        var withLimit = coupons.Where(c => c.UsageLimit.HasValue && c.UsageLimit > 0).ToList();
        var usagePercent = withLimit.Count == 0
            ? 0m
            : Math.Round(withLimit.Average(c => (decimal)c.UsageCount / c.UsageLimit!.Value * 100m), 1);

        return new AdminCouponStatsDto
        {
            TotalCoupons = total,
            ActiveCoupons = active,
            ExpiredCoupons = expired,
            UsedCoupons = used,
            UsagePercent = usagePercent
        };
    }

    public async Task<IReadOnlyList<AdminCouponListItemDto>> GetCouponsAsync(
        AdminCouponFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var query = _context.Coupons.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToUpperInvariant();
            query = query.Where(c => c.Code.ToUpper().Contains(term));
        }

        if (string.Equals(filter.Type, "percentage", StringComparison.OrdinalIgnoreCase))
            query = query.Where(c => c.Type == CouponType.Percentage);
        else if (string.Equals(filter.Type, "fixed", StringComparison.OrdinalIgnoreCase))
            query = query.Where(c => c.Type == CouponType.FixedAmount);

        var coupons = await query.ToListAsync(cancellationToken);

        IEnumerable<Coupon> filtered = coupons;

        filtered = filter.Status?.ToLowerInvariant() switch
        {
            "active" => filtered.Where(c => c.IsActive && c.StartDate <= now && c.EndDate >= now),
            "inactive" => filtered.Where(c => !c.IsActive),
            "expired" => filtered.Where(c => c.EndDate < now),
            "scheduled" => filtered.Where(c => c.StartDate > now),
            _ => filtered
        };

        filtered = filter.Sort?.ToLowerInvariant() switch
        {
            "oldest" => filtered.OrderBy(c => c.CreatedAt),
            "most_used" => filtered.OrderByDescending(c => c.UsageCount),
            "expiring_soon" => filtered.OrderBy(c => c.EndDate),
            _ => filtered.OrderByDescending(c => c.CreatedAt)
        };

        return filtered.Select(MapListItem).ToList();
    }

    public async Task<ServiceResult<AdminCouponDetailDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var coupon = await _context.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (coupon == null)
            return ServiceResult<AdminCouponDetailDto>.Fail("coupon_not_found", "Coupon not found.", 404);

        var detail = await BuildDetailDtoAsync(coupon, cancellationToken);
        return ServiceResult<AdminCouponDetailDto>.Ok(detail);
    }

    public async Task<ServiceResult<AdminCouponUsageHistoryDto>> GetUsageHistoryAsync(
        int id,
        AdminCouponUsageFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var couponExists = await _context.Coupons.AsNoTracking().AnyAsync(c => c.Id == id, cancellationToken);
        if (!couponExists)
            return ServiceResult<AdminCouponUsageHistoryDto>.Fail("coupon_not_found", "Coupon not found.", 404);

        var query = _context.CouponUsages
            .AsNoTracking()
            .Include(u => u.User)
            .Include(u => u.Order)
            .Where(u => u.CouponId == id);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLowerInvariant();
            query = query.Where(u =>
                u.Order.OrderNumber.ToLower().Contains(term) ||
                (u.User.Email != null && u.User.Email.ToLower().Contains(term)) ||
                (u.User.UserName != null && u.User.UserName.ToLower().Contains(term)) ||
                u.Order.ShippingFullName.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(filter.OrderStatus) &&
            Enum.TryParse<OrderStatus>(filter.OrderStatus, true, out var statusFilter))
        {
            query = query.Where(u => u.Order.Status == statusFilter);
        }

        var usages = await query.ToListAsync(cancellationToken);

        IEnumerable<CouponUsage> sorted = filter.Sort?.ToLowerInvariant() switch
        {
            "oldest" => usages.OrderBy(u => u.CreatedAt),
            "highest_discount" => usages.OrderByDescending(u => u.DiscountAmount),
            "lowest_discount" => usages.OrderBy(u => u.DiscountAmount),
            _ => usages.OrderByDescending(u => u.CreatedAt)
        };

        var all = sorted.ToList();
        var successful = all.Where(u => u.Order.Status != OrderStatus.Cancelled && u.Order.Status != OrderStatus.Refunded).ToList();

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 50);
        var items = all.Skip((page - 1) * pageSize).Take(pageSize).Select(u => new AdminCouponUsageRowDto
        {
            OrderId = u.OrderId,
            OrderNumber = u.Order.OrderNumber,
            CustomerName = u.Order.ShippingFullName,
            CustomerEmail = u.User.Email ?? u.User.UserName ?? "—",
            OrderTotal = u.Order.SubTotal + u.Order.ShippingFee,
            DiscountApplied = u.DiscountAmount,
            FinalPaidAmount = u.Order.TotalAmount,
            OrderStatus = u.Order.Status.ToString(),
            RedeemedAt = u.CreatedAt
        }).ToList();

        return ServiceResult<AdminCouponUsageHistoryDto>.Ok(new AdminCouponUsageHistoryDto
        {
            TotalRedemptions = successful.Count,
            UniqueCustomers = successful.Select(u => u.UserId).Distinct().Count(),
            AverageDiscount = successful.Count == 0 ? 0m : Math.Round(successful.Average(u => u.DiscountAmount), 2),
            TotalSavings = successful.Sum(u => u.DiscountAmount),
            RevenueGenerated = successful.Sum(u => u.Order.TotalAmount),
            TotalItems = all.Count,
            Items = items
        });
    }

    public async Task<ServiceResult<AdminCouponDetailDto>> CreateAsync(
        CreateCouponRequest request,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        if (await _context.Coupons.AnyAsync(c => c.Code.ToUpper() == normalizedCode, cancellationToken))
            return ServiceResult<AdminCouponDetailDto>.Fail("coupon_code_exists", "Coupon code already exists.");

        if (request.EndDate <= request.StartDate)
            return ServiceResult<AdminCouponDetailDto>.Fail("coupon_invalid_dates", "Expiration must be after start date.");

        var now = DateTime.UtcNow;
        var coupon = new Coupon
        {
            Code = normalizedCode,
            Type = request.Type,
            Value = request.Value,
            MinimumOrderAmount = request.MinimumOrderAmount,
            MaximumDiscountAmount = request.MaximumDiscountAmount,
            StartDate = request.StartDate.ToUniversalTime(),
            EndDate = request.EndDate.ToUniversalTime(),
            UsageLimit = request.UsageLimit,
            PerCustomerUsageLimit = request.PerCustomerUsageLimit <= 0 ? 1 : request.PerCustomerUsageLimit,
            IsActive = request.IsActive,
            Description = NormalizeOptional(request.Description),
            CreatedAt = now,
            CreatedBy = userId
        };

        _context.Coupons.Add(coupon);
        await _context.SaveChangesAsync(cancellationToken);

        var detail = await BuildDetailDtoAsync(coupon, cancellationToken);
        await BroadcastCouponAsync(StoreUpdateEvents.CouponCreated, coupon.Id, coupon.Code, coupon.IsActive, cancellationToken);
        return ServiceResult<AdminCouponDetailDto>.Ok(detail);
    }

    public async Task<ServiceResult<AdminCouponDetailDto>> UpdateAsync(
        int id,
        UpdateCouponRequest request,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (coupon == null)
            return ServiceResult<AdminCouponDetailDto>.Fail("coupon_not_found", "Coupon not found.", 404);

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        if (await _context.Coupons.AnyAsync(c => c.Id != id && c.Code.ToUpper() == normalizedCode, cancellationToken))
            return ServiceResult<AdminCouponDetailDto>.Fail("coupon_code_exists", "Coupon code already exists.");

        if (request.EndDate <= request.StartDate)
            return ServiceResult<AdminCouponDetailDto>.Fail("coupon_invalid_dates", "Expiration must be after start date.");

        coupon.Code = normalizedCode;
        coupon.Type = request.Type;
        coupon.Value = request.Value;
        coupon.MinimumOrderAmount = request.MinimumOrderAmount;
        coupon.MaximumDiscountAmount = request.MaximumDiscountAmount;
        coupon.StartDate = request.StartDate.ToUniversalTime();
        coupon.EndDate = request.EndDate.ToUniversalTime();
        coupon.UsageLimit = request.UsageLimit;
        coupon.PerCustomerUsageLimit = request.PerCustomerUsageLimit <= 0 ? 1 : request.PerCustomerUsageLimit;
        coupon.IsActive = request.IsActive;
        coupon.Description = NormalizeOptional(request.Description);
        coupon.UpdatedAt = DateTime.UtcNow;
        coupon.UpdatedBy = userId;

        await _context.SaveChangesAsync(cancellationToken);

        var detail = await BuildDetailDtoAsync(coupon, cancellationToken);
        await BroadcastCouponAsync(StoreUpdateEvents.CouponUpdated, coupon.Id, coupon.Code, coupon.IsActive, cancellationToken);
        return ServiceResult<AdminCouponDetailDto>.Ok(detail);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var coupon = await _context.Coupons
            .Include(c => c.Usages)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (coupon == null)
            return ServiceResult<bool>.Fail("coupon_not_found", "Coupon not found.", 404);

        if (coupon.Usages.Count > 0)
            return ServiceResult<bool>.Fail("coupon_has_usage", "Cannot delete a coupon that has been redeemed.");

        _context.Coupons.Remove(coupon);
        await _context.SaveChangesAsync(cancellationToken);
        await BroadcastCouponAsync(StoreUpdateEvents.CouponDeleted, id, coupon.Code, false, cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<AdminCouponDetailDto>> SetActiveAsync(
        int id,
        bool isActive,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (coupon == null)
            return ServiceResult<AdminCouponDetailDto>.Fail("coupon_not_found", "Coupon not found.", 404);

        coupon.IsActive = isActive;
        coupon.UpdatedAt = DateTime.UtcNow;
        coupon.UpdatedBy = userId;
        await _context.SaveChangesAsync(cancellationToken);

        var detail = await BuildDetailDtoAsync(coupon, cancellationToken);
        await BroadcastCouponAsync(StoreUpdateEvents.CouponUpdated, coupon.Id, coupon.Code, coupon.IsActive, cancellationToken);
        return ServiceResult<AdminCouponDetailDto>.Ok(detail);
    }

    public async Task<ServiceResult<AdminCouponDetailDto>> DuplicateAsync(
        int id,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var source = await _context.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (source == null)
            return ServiceResult<AdminCouponDetailDto>.Fail("coupon_not_found", "Coupon not found.", 404);

        var baseCode = source.Code;
        var suffix = 1;
        string newCode;
        do
        {
            newCode = $"{baseCode}{suffix}";
            suffix++;
        } while (await _context.Coupons.AnyAsync(c => c.Code == newCode, cancellationToken));

        var now = DateTime.UtcNow;
        var duplicate = new Coupon
        {
            Code = newCode.Length > 32 ? newCode[..32] : newCode,
            Type = source.Type,
            Value = source.Value,
            MinimumOrderAmount = source.MinimumOrderAmount,
            MaximumDiscountAmount = source.MaximumDiscountAmount,
            StartDate = source.StartDate,
            EndDate = source.EndDate,
            UsageLimit = source.UsageLimit,
            PerCustomerUsageLimit = source.PerCustomerUsageLimit,
            IsActive = false,
            Description = source.Description,
            CreatedAt = now,
            CreatedBy = userId
        };

        _context.Coupons.Add(duplicate);
        await _context.SaveChangesAsync(cancellationToken);

        var detail = await BuildDetailDtoAsync(duplicate, cancellationToken);
        await BroadcastCouponAsync(StoreUpdateEvents.CouponCreated, duplicate.Id, duplicate.Code, duplicate.IsActive, cancellationToken);
        return ServiceResult<AdminCouponDetailDto>.Ok(detail);
    }

    public async Task<ServiceResult<ValidateCouponResponseDto>> ValidateForCheckoutAsync(
        string userId,
        ValidateCouponRequest request,
        CancellationToken cancellationToken = default)
    {
        var cart = await _context.Carts
            .Include(c => c.Items)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.UserId == userId, cancellationToken);

        if (cart == null || cart.Items.Count == 0)
            return ServiceResult<ValidateCouponResponseDto>.Fail("cart_empty", "Cart is empty.");

        var lines = await BuildCartLinesAsync(cart, cancellationToken);
        if (lines.Count == 0)
            return ServiceResult<ValidateCouponResponseDto>.Fail("cart_empty", "Cart is empty.");

        var subTotal = lines.Sum(l => l.UnitPrice * l.Quantity);
        var validation = await ValidateCouponForOrderAsync(request.CouponCode, userId, subTotal, lines, cancellationToken);

        if (!validation.IsValid)
        {
            return ServiceResult<ValidateCouponResponseDto>.Fail(
                validation.ErrorCode!,
                validation.ErrorMessage!);
        }

        var coupon = validation.Coupon;
        var discount = validation.DiscountAmount;
        // Product discount only; shipping is added after discount (coupon free-shipping zeroes shipping separately).
        var subtotalAfterDiscount = Math.Max(0m, subTotal - discount);

        ShippingAddress? address = null;
        if (request.ShippingAddressId.HasValue)
        {
            address = await _context.ShippingAddresses
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == request.ShippingAddressId && a.UserId == userId, cancellationToken);
        }

        var shippingFee = address == null
            ? 0m
            : await _shippingFeeService.CalculateShippingFeeAsync(address.Governorate, coupon, cancellationToken);

        return ServiceResult<ValidateCouponResponseDto>.Ok(new ValidateCouponResponseDto
        {
            Valid = true,
            Code = coupon!.Code,
            Type = coupon.Type,
            DiscountLabel = FormatDiscountLabel(coupon),
            DiscountAmount = discount,
            SubTotal = subTotal,
            ShippingFee = shippingFee,
            TotalAmount = subtotalAfterDiscount + shippingFee,
            FreeShipping = coupon.Type == CouponType.FreeShipping,
            Message = "Coupon applied successfully."
        });
    }

    public async Task<CouponValidationResult> ValidateCouponForOrderAsync(
        string? couponCode,
        string userId,
        decimal subTotal,
        IReadOnlyList<CouponValidationLineDto> lines,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(couponCode))
            return CouponValidationResult.Success(null, 0m);

        var normalizedCode = couponCode.Trim().ToUpperInvariant();
        var coupon = await _context.Coupons
            .FirstOrDefaultAsync(c => c.Code.ToUpper() == normalizedCode, cancellationToken);

        if (coupon == null)
            return CouponValidationResult.Fail("coupon_invalid", "Coupon does not exist.");

        if (!coupon.IsActive)
            return CouponValidationResult.Fail("coupon_inactive", "This coupon is currently unavailable.");

        var now = DateTime.UtcNow;
        if (now < coupon.StartDate)
            return CouponValidationResult.Fail("coupon_not_started", "This coupon is not active yet.");

        if (now > coupon.EndDate)
            return CouponValidationResult.Fail("coupon_expired", "This coupon has expired.");

        if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
            return CouponValidationResult.Fail("coupon_usage_limit", "This coupon has reached its maximum usage limit.");

        var userUsageCount = await _context.CouponUsages
            .CountAsync(u => u.CouponId == coupon.Id && u.UserId == userId, cancellationToken);

        if (userUsageCount >= coupon.PerCustomerUsageLimit)
            return CouponValidationResult.Fail("coupon_user_limit", "You have already used this coupon.");

        var applicableSubtotal = GetApplicableSubtotal(coupon, lines);
        if (applicableSubtotal <= 0m)
            return CouponValidationResult.Fail("coupon_scope_invalid", "Coupon is not valid for this order.");

        if (coupon.MinimumOrderAmount.HasValue && applicableSubtotal < coupon.MinimumOrderAmount.Value)
            return CouponValidationResult.Fail("coupon_minimum_not_met", "Minimum order amount not reached.");

        var discount = CalculateDiscount(coupon, applicableSubtotal);
        return CouponValidationResult.Success(coupon, discount);
    }

    private async Task<AdminCouponDetailDto> BuildDetailDtoAsync(Coupon coupon, CancellationToken cancellationToken)
    {
        var usages = await _context.CouponUsages
            .AsNoTracking()
            .Include(u => u.User)
            .Include(u => u.Order)
            .Where(u => u.CouponId == coupon.Id)
            .ToListAsync(cancellationToken);

        var successful = usages.Where(u => u.Order.Status != OrderStatus.Cancelled && u.Order.Status != OrderStatus.Refunded).ToList();
        var usageProgress = coupon.UsageLimit.HasValue && coupon.UsageLimit > 0
            ? Math.Round((decimal)coupon.UsageCount / coupon.UsageLimit.Value * 100m, 1)
            : 0m;

        var usageOverTime = successful
            .GroupBy(u => u.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Take(30)
            .Select(g => new AdminCouponUsagePointDto
            {
                Label = g.Key.ToString("MMM dd"),
                Count = g.Count()
            })
            .ToList();

        var topCustomers = successful
            .GroupBy(u => u.UserId)
            .Select(g =>
            {
                var first = g.First();
                return new AdminCouponTopCustomerDto
                {
                    UserId = g.Key,
                    CustomerName = first.Order.ShippingFullName,
                    CustomerEmail = first.User.Email ?? first.User.UserName ?? "—",
                    UsageCount = g.Count()
                };
            })
            .OrderByDescending(c => c.UsageCount)
            .Take(5)
            .ToList();

        return new AdminCouponDetailDto
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Type = coupon.Type,
            Value = coupon.Value,
            MinimumOrderAmount = coupon.MinimumOrderAmount,
            MaximumDiscountAmount = coupon.MaximumDiscountAmount,
            StartDate = coupon.StartDate,
            EndDate = coupon.EndDate,
            UsageLimit = coupon.UsageLimit,
            UsageCount = coupon.UsageCount,
            RemainingUses = coupon.UsageLimit.HasValue ? Math.Max(0, coupon.UsageLimit.Value - coupon.UsageCount) : null,
            PerCustomerUsageLimit = coupon.PerCustomerUsageLimit,
            IsActive = coupon.IsActive,
            Description = coupon.Description,
            Status = ResolveStatus(coupon),
            CreatedAt = coupon.CreatedAt,
            UpdatedAt = coupon.UpdatedAt,
            DiscountLabel = FormatDiscountLabel(coupon),
            UsageProgressPercent = usageProgress,
            SuccessfulUses = successful.Count,
            TotalSavingsGenerated = successful.Sum(u => u.DiscountAmount),
            RevenueGenerated = successful.Sum(u => u.Order.TotalAmount),
            UsageOverTime = usageOverTime,
            TopCustomers = topCustomers
        };
    }

    private async Task<List<CouponValidationLineDto>> BuildCartLinesAsync(Cart cart, CancellationToken cancellationToken)
    {
        var variantIds = cart.Items.Select(i => i.ProductVariantId).Distinct().ToList();
        var variants = await _context.ProductVariants
            .AsNoTracking()
            .Include(v => v.Product)
            .Where(v => variantIds.Contains(v.Id))
            .ToListAsync(cancellationToken);

        var lines = new List<CouponValidationLineDto>();
        foreach (var item in cart.Items)
        {
            var variant = variants.FirstOrDefault(v => v.Id == item.ProductVariantId);
            if (variant == null || variant.Product.IsDeleted || variant.Product.Status != ProductStatus.Active)
                continue;

            lines.Add(new CouponValidationLineDto
            {
                ProductId = variant.ProductId,
                CategoryId = variant.Product.CategoryId,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity
            });
        }

        return lines;
    }

    private static AdminCouponListItemDto MapListItem(Coupon coupon)
    {
        return new AdminCouponListItemDto
        {
            Id = coupon.Id,
            Code = coupon.Code,
            Type = coupon.Type,
            Value = coupon.Value,
            Status = ResolveStatus(coupon),
            IsActive = coupon.IsActive,
            CreatedAt = coupon.CreatedAt,
            StartDate = coupon.StartDate,
            EndDate = coupon.EndDate,
            UsageCount = coupon.UsageCount,
            UsageLimit = coupon.UsageLimit,
            RemainingUses = coupon.UsageLimit.HasValue ? Math.Max(0, coupon.UsageLimit.Value - coupon.UsageCount) : null,
            PerCustomerUsageLimit = coupon.PerCustomerUsageLimit,
            MinimumOrderAmount = coupon.MinimumOrderAmount,
            DiscountLabel = FormatDiscountLabel(coupon)
        };
    }

    private static string ResolveStatus(Coupon coupon)
    {
        var now = DateTime.UtcNow;
        if (!coupon.IsActive) return "Inactive";
        if (now < coupon.StartDate) return "Scheduled";
        if (now > coupon.EndDate) return "Expired";
        if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value) return "Maximum Uses Reached";
        return "Active";
    }

    private static string FormatDiscountLabel(Coupon coupon) =>
        coupon.Type switch
        {
            CouponType.Percentage => $"{coupon.Value:0.##}%",
            CouponType.FixedAmount => $"{coupon.Value:0.##} EGP",
            CouponType.FreeShipping => "Free Shipping",
            _ => coupon.Value.ToString("0.##")
        };

    private static decimal GetApplicableSubtotal(Coupon coupon, IReadOnlyList<CouponValidationLineDto> lines)
    {
        if (coupon.ProductId.HasValue)
        {
            return lines
                .Where(l => l.ProductId == coupon.ProductId.Value)
                .Sum(l => l.UnitPrice * l.Quantity);
        }

        if (coupon.CategoryId.HasValue)
        {
            return lines
                .Where(l => l.CategoryId == coupon.CategoryId.Value)
                .Sum(l => l.UnitPrice * l.Quantity);
        }

        return lines.Sum(l => l.UnitPrice * l.Quantity);
    }

    private static decimal CalculateDiscount(Coupon coupon, decimal applicableSubtotal) =>
        coupon.Type switch
        {
            CouponType.Percentage => ApplyMaxCap(applicableSubtotal * coupon.Value / 100m, coupon.MaximumDiscountAmount),
            CouponType.FixedAmount => Math.Min(coupon.Value, applicableSubtotal),
            CouponType.FreeShipping => 0m,
            _ => 0m
        };

    private static decimal ApplyMaxCap(decimal value, decimal? maxCap) =>
        maxCap.HasValue ? Math.Min(value, maxCap.Value) : value;

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private Task BroadcastCouponAsync(
        string eventName,
        int couponId,
        string code,
        bool isActive,
        CancellationToken cancellationToken) =>
        _storeBroadcast.BroadcastStorefrontAsync(
            eventName,
            new StoreUpdatePayloadDto
            {
                EntityId = couponId,
                Code = code,
                IsActive = isActive,
            },
            cancellationToken);
}
