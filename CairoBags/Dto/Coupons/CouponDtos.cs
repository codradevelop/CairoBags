using System.ComponentModel.DataAnnotations;
using CairoBags.Models.Coupons;

namespace CairoBags.Dto.Coupons;

public class AdminCouponFilterDto
{
    public string? Search { get; set; }

    public string? Status { get; set; }

    public string? Type { get; set; }

    public string? Sort { get; set; }
}

public class CreateCouponRequest
{
    [Required, MaxLength(32)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public CouponType Type { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal Value { get; set; }

    public decimal? MinimumOrderAmount { get; set; }

    public decimal? MaximumDiscountAmount { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Range(1, int.MaxValue)]
    public int? UsageLimit { get; set; }

    [Range(1, int.MaxValue)]
    public int PerCustomerUsageLimit { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Description { get; set; }
}

public class UpdateCouponRequest
{
    [Required, MaxLength(32)]
    public string Code { get; set; } = string.Empty;

    [Required]
    public CouponType Type { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal Value { get; set; }

    public decimal? MinimumOrderAmount { get; set; }

    public decimal? MaximumDiscountAmount { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    [Range(1, int.MaxValue)]
    public int? UsageLimit { get; set; }

    [Range(1, int.MaxValue)]
    public int PerCustomerUsageLimit { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Description { get; set; }
}

public class AdminCouponListItemDto
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public CouponType Type { get; set; }

    public decimal Value { get; set; }

    public string Status { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int UsageCount { get; set; }

    public int? UsageLimit { get; set; }

    public int? RemainingUses { get; set; }

    public int PerCustomerUsageLimit { get; set; }

    public decimal? MinimumOrderAmount { get; set; }

    public string DiscountLabel { get; set; } = string.Empty;
}

public class AdminCouponStatsDto
{
    public int TotalCoupons { get; set; }

    public int ActiveCoupons { get; set; }

    public int ExpiredCoupons { get; set; }

    public int UsedCoupons { get; set; }

    public decimal UsagePercent { get; set; }
}

public class AdminCouponDetailDto
{
    public int Id { get; set; }

    public string Code { get; set; } = string.Empty;

    public CouponType Type { get; set; }

    public decimal Value { get; set; }

    public decimal? MinimumOrderAmount { get; set; }

    public decimal? MaximumDiscountAmount { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int? UsageLimit { get; set; }

    public int UsageCount { get; set; }

    public int? RemainingUses { get; set; }

    public int PerCustomerUsageLimit { get; set; }

    public bool IsActive { get; set; }

    public string? Description { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string DiscountLabel { get; set; } = string.Empty;

    public decimal UsageProgressPercent { get; set; }

    public int SuccessfulUses { get; set; }

    public decimal TotalSavingsGenerated { get; set; }

    public decimal RevenueGenerated { get; set; }

    public IReadOnlyList<AdminCouponUsagePointDto> UsageOverTime { get; set; } = [];

    public IReadOnlyList<AdminCouponTopCustomerDto> TopCustomers { get; set; } = [];
}

public class AdminCouponUsagePointDto
{
    public string Label { get; set; } = string.Empty;

    public int Count { get; set; }
}

public class AdminCouponTopCustomerDto
{
    public string UserId { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerEmail { get; set; } = string.Empty;

    public int UsageCount { get; set; }
}

public class AdminCouponUsageFilterDto
{
    public string? Search { get; set; }

    public string? OrderStatus { get; set; }

    public string? Sort { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 10;
}

public class AdminCouponUsageHistoryDto
{
    public int TotalRedemptions { get; set; }

    public int UniqueCustomers { get; set; }

    public decimal AverageDiscount { get; set; }

    public decimal TotalSavings { get; set; }

    public decimal RevenueGenerated { get; set; }

    public int TotalItems { get; set; }

    public IReadOnlyList<AdminCouponUsageRowDto> Items { get; set; } = [];
}

public class AdminCouponUsageRowDto
{
    public int OrderId { get; set; }

    public string OrderNumber { get; set; } = string.Empty;

    public string CustomerName { get; set; } = string.Empty;

    public string CustomerEmail { get; set; } = string.Empty;

    public decimal OrderTotal { get; set; }

    public decimal DiscountApplied { get; set; }

    public decimal FinalPaidAmount { get; set; }

    public string OrderStatus { get; set; } = string.Empty;

    public DateTime RedeemedAt { get; set; }
}

public class ValidateCouponRequest
{
    [Required, MaxLength(32)]
    public string CouponCode { get; set; } = string.Empty;

    public int? ShippingAddressId { get; set; }
}

public class ValidateCouponResponseDto
{
    public bool Valid { get; set; }

    public string? Code { get; set; }

    public CouponType? Type { get; set; }

    public string? DiscountLabel { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal SubTotal { get; set; }

    public decimal ShippingFee { get; set; }

    public decimal TotalAmount { get; set; }

    public bool FreeShipping { get; set; }

    public string Message { get; set; } = string.Empty;
}

public class CouponValidationLineDto
{
    public int ProductId { get; set; }

    public int CategoryId { get; set; }

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }
}
