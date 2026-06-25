using CairoBags.Models.Common;
using CairoBags.Models.Identity;

namespace CairoBags.Models.Reviews;

public class ReviewHelpful : BaseEntity
{
    public int ProductReviewId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public virtual ProductReview ProductReview { get; set; } = null!;

    public virtual ApplicationUser User { get; set; } = null!;
}
