using CairoBags.Models.Analytics;
using CairoBags.Models.Common;
using CairoBags.Models.Commerce;
using CairoBags.Models.Coupons;
using CairoBags.Models.Orders;
using CairoBags.Models.Reviews;

namespace CairoBags.Models.Catalog;

public class Product : BaseEntity
{
    public int CategoryId { get; set; }

    public ProductStatus Status { get; set; } = ProductStatus.Draft;

    public decimal? CompareAtPrice { get; set; }

    public bool IsFeatured { get; set; }

    public bool IsNewArrival { get; set; }

    public decimal AverageRating { get; set; }

    public int ReviewCount { get; set; }

    public int VerifiedReviewCount { get; set; }

    public int TotalSold { get; set; }

    public DateTime? PublishedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<ProductTranslation> Translations { get; set; } = new List<ProductTranslation>();

    public virtual ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();

    public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();

    public virtual ICollection<WishlistItem> WishlistItems { get; set; } = new List<WishlistItem>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();

    public virtual ICollection<Coupon> Coupons { get; set; } = new List<Coupon>();

    public virtual ICollection<UserProductView> ProductViews { get; set; } = new List<UserProductView>();

    public virtual TrendingProduct? TrendingProduct { get; set; }
}
