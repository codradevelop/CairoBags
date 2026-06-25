using System.ComponentModel.DataAnnotations;
using CairoBags.Models.Common;

namespace CairoBags.Models.Reviews;

public class ReviewImage : BaseEntity
{
    public int ProductReviewId { get; set; }

    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    public bool IsPrimary { get; set; }

    public int SortOrder { get; set; }

    public virtual ProductReview ProductReview { get; set; } = null!;
}
