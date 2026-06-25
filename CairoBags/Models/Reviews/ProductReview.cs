using System.ComponentModel.DataAnnotations;
using CairoBags.Models.Catalog;
using CairoBags.Models.Common;
using CairoBags.Models.Identity;
using CairoBags.Models.Orders;

namespace CairoBags.Models.Reviews;

public class ProductReview : BaseEntity
{
    public int ProductId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public int? OrderId { get; set; }

    public byte Rating { get; set; }

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Comment { get; set; }

    public ReviewStatus Status { get; set; } = ReviewStatus.Approved;

    public bool IsVerifiedPurchase { get; set; }

    public bool IsVisible { get; set; } = true;

    [MaxLength(2000)]
    public string? AdminResponse { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual ApplicationUser User { get; set; } = null!;

    public virtual Order? Order { get; set; }

    public virtual ICollection<ReviewImage> Images { get; set; } = new List<ReviewImage>();

    public virtual ICollection<ReviewHelpful> HelpfulVotes { get; set; } = new List<ReviewHelpful>();
}
