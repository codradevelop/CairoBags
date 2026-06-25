using System.ComponentModel.DataAnnotations;

namespace CairoBags.Dto.Reviews;

public class ReviewImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }
}

public class ReviewDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string? ReviewerName { get; set; }
    public int? OrderId { get; set; }
    public byte Rating { get; set; }
    public string? Title { get; set; }
    public string? Comment { get; set; }
    public bool IsVerifiedPurchase { get; set; }
    public bool IsVisible { get; set; }
    public int HelpfulCount { get; set; }
    public bool IsHelpfulByCurrentUser { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ReviewImageDto> Images { get; set; } = new();
}

public class ReviewSummaryDto
{
    public decimal AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public int VerifiedReviewCount { get; set; }
    public int FiveStarCount { get; set; }
    public int FourStarCount { get; set; }
    public int ThreeStarCount { get; set; }
    public int TwoStarCount { get; set; }
    public int OneStarCount { get; set; }
}

public class PagedReviewsDto
{
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public IReadOnlyList<ReviewDto> Items { get; set; } = Array.Empty<ReviewDto>();
}

public class ReviewListQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Sort { get; set; }
    public byte? Rating { get; set; }
    public bool VerifiedOnly { get; set; }
    public bool ImagesOnly { get; set; }
}

public class CreateReviewRequest
{
    [Range(1, 5)]
    public byte Rating { get; set; }

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Comment { get; set; }

    public int? OrderId { get; set; }

    [MaxLength(5)]
    public List<string>? ImageUrls { get; set; }
}

public class UpdateReviewRequest
{
    [Range(1, 5)]
    public byte Rating { get; set; }

    [MaxLength(200)]
    public string? Title { get; set; }

    [MaxLength(2000)]
    public string? Comment { get; set; }

    [MaxLength(5)]
    public List<string>? ImageUrls { get; set; }
}

public class SetReviewVisibilityRequest
{
    public bool IsVisible { get; set; }
}

public class ReviewHelpfulDto
{
    public int ReviewId { get; set; }
    public int HelpfulCount { get; set; }
    public bool IsHelpfulByCurrentUser { get; set; }
}

public class AdminLatestReviewDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public byte Rating { get; set; }
    public string? Title { get; set; }
    public bool IsVerifiedPurchase { get; set; }
    public DateTime CreatedAt { get; set; }
}
