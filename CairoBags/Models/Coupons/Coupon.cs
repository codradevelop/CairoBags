using System.ComponentModel.DataAnnotations;
using CairoBags.Models.Catalog;
using CairoBags.Models.Common;

namespace CairoBags.Models.Coupons;

public class Coupon : BaseEntity
{
    [MaxLength(32)]
    public string Code { get; set; } = string.Empty;

    public CouponType Type { get; set; }

    public decimal Value { get; set; }

    public decimal? MinimumOrderAmount { get; set; }

    public decimal? MaximumDiscountAmount { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int? UsageLimit { get; set; }

    public int UsageCount { get; set; }

    public int PerCustomerUsageLimit { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int? ProductId { get; set; }

    public int? CategoryId { get; set; }

    public virtual Product? Product { get; set; }

    public virtual Category? Category { get; set; }

    public virtual ICollection<CouponUsage> Usages { get; set; } = new List<CouponUsage>();
}
