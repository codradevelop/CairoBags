using CairoBags.Data;
using CairoBags.Dto.Reviews;
using CairoBags.Models;
using CairoBags.Models.Catalog;
using CairoBags.Models.Identity;
using CairoBags.Models.Orders;
using CairoBags.Models.Reviews;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class ReviewService : IReviewService
{
    private const int MaxCommentLength = 2000;
    private const int MaxTitleLength = 200;
    private const int MaxReviewImages = 5;

    private static readonly OrderStatus[] EligibleOrderStatuses =
    {
        OrderStatus.Delivered,
        OrderStatus.Completed,
    };

    private readonly CairoBagsContext _context;
    private readonly NotificationService _notificationService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IStatisticsRealtimeService _statisticsRealtime;

    public ReviewService(
        CairoBagsContext context,
        NotificationService notificationService,
        UserManager<ApplicationUser> userManager,
        IStatisticsRealtimeService statisticsRealtime)
    {
        _context = context;
        _notificationService = notificationService;
        _userManager = userManager;
        _statisticsRealtime = statisticsRealtime;
    }

    public async Task<PagedReviewsDto> GetProductReviewsAsync(
        int productId,
        ReviewListQuery query,
        string? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 10 : Math.Min(query.PageSize, 50);

        var reviewsQuery = _context.ProductReviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId && r.IsVisible && r.Status == ReviewStatus.Approved);

        if (query.Rating is >= 1 and <= 5)
            reviewsQuery = reviewsQuery.Where(r => r.Rating == query.Rating);

        if (query.VerifiedOnly)
            reviewsQuery = reviewsQuery.Where(r => r.IsVerifiedPurchase);

        if (query.ImagesOnly)
            reviewsQuery = reviewsQuery.Where(r => r.Images.Any());

        reviewsQuery = ApplySort(reviewsQuery, query.Sort);

        var total = await reviewsQuery.CountAsync(cancellationToken);

        var rows = await reviewsQuery
            .Select(r => new ReviewProjection
            {
                Id = r.Id,
                ProductId = r.ProductId,
                UserId = r.UserId,
                ReviewerName = r.User.CustomerProfile != null
                    ? (r.User.CustomerProfile.DisplayName
                       ?? ((r.User.CustomerProfile.FirstName ?? "") + " " + (r.User.CustomerProfile.LastName ?? "")).Trim())
                    : null,
                OrderId = r.OrderId,
                Rating = r.Rating,
                Title = r.Title,
                Comment = r.Comment,
                IsVerifiedPurchase = r.IsVerifiedPurchase,
                IsVisible = r.IsVisible,
                HelpfulCount = r.HelpfulVotes.Count,
                IsHelpfulByCurrentUser = currentUserId != null && r.HelpfulVotes.Any(h => h.UserId == currentUserId),
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                Images = r.Images
                    .OrderBy(i => i.SortOrder)
                    .ThenByDescending(i => i.IsPrimary)
                    .Select(i => new ReviewImageDto
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        SortOrder = i.SortOrder,
                        IsPrimary = i.IsPrimary,
                    })
                    .ToList(),
            })
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedReviewsDto
        {
            Total = total,
            Page = page,
            PageSize = pageSize,
            Items = rows.Select(MapProjection).ToList(),
        };
    }

    public async Task<ReviewSummaryDto?> GetProductReviewSummaryAsync(
        int productId,
        CancellationToken cancellationToken = default)
    {
        var productExists = await _context.Products
            .AsNoTracking()
            .AnyAsync(p => p.Id == productId && !p.IsDeleted, cancellationToken);

        if (!productExists)
            return null;

        var product = await _context.Products
            .AsNoTracking()
            .Where(p => p.Id == productId)
            .Select(p => new { p.AverageRating, p.ReviewCount, p.VerifiedReviewCount })
            .FirstAsync(cancellationToken);

        var ratingCounts = await _context.ProductReviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId && r.IsVisible && r.Status == ReviewStatus.Approved)
            .GroupBy(r => r.Rating)
            .Select(g => new { Rating = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        int CountFor(byte rating) =>
            ratingCounts.FirstOrDefault(x => x.Rating == rating)?.Count ?? 0;

        return new ReviewSummaryDto
        {
            AverageRating = product.ReviewCount > 0 ? product.AverageRating : 0,
            ReviewCount = product.ReviewCount,
            VerifiedReviewCount = product.VerifiedReviewCount,
            FiveStarCount = CountFor(5),
            FourStarCount = CountFor(4),
            ThreeStarCount = CountFor(3),
            TwoStarCount = CountFor(2),
            OneStarCount = CountFor(1),
        };
    }

    public async Task<ServiceResult<ReviewDto>> CreateReviewAsync(
        int productId,
        string userId,
        CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = ValidateReviewInput(request.Rating, request.Title, request.Comment, request.ImageUrls);
        if (validation != null)
            return validation;

        var productValidation = await ValidateReviewableProductAsync(productId, cancellationToken);
        if (productValidation != null)
            return productValidation;

        var duplicate = await _context.ProductReviews
            .AnyAsync(r => r.ProductId == productId && r.UserId == userId, cancellationToken);

        if (duplicate)
        {
            return ServiceResult<ReviewDto>.Fail(
                "review_exists",
                "You have already reviewed this product.",
                StatusCodes.Status409Conflict);
        }

        var purchase = await ResolveVerifiedPurchaseAsync(productId, userId, request.OrderId, cancellationToken);
        if (purchase == null)
        {
            return ServiceResult<ReviewDto>.Fail(
                "not_purchased",
                "You can only review products from delivered or completed orders.",
                StatusCodes.Status403Forbidden);
        }

        var now = DateTime.UtcNow;
        var review = new ProductReview
        {
            ProductId = productId,
            UserId = userId,
            OrderId = purchase.OrderId,
            Rating = request.Rating,
            Title = NormalizeOptional(request.Title, MaxTitleLength),
            Comment = NormalizeOptional(request.Comment, MaxCommentLength),
            Status = ReviewStatus.Approved,
            IsVerifiedPurchase = true,
            IsVisible = true,
            CreatedAt = now,
            CreatedBy = userId,
        };

        ApplyReviewImages(review, request.ImageUrls, userId, now);

        _context.ProductReviews.Add(review);
        await _context.SaveChangesAsync(cancellationToken);
        await RecalculateProductReviewStatsAsync(productId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = await GetReviewDtoByIdAsync(review.Id, userId, cancellationToken);
        await NotifyAdminsOfNewReviewAsync(review, userId, cancellationToken);
        await _statisticsRealtime.NotifyStatisticsUpdatedAsync(cancellationToken);
        return ServiceResult<ReviewDto>.Ok(dto!);
    }

    public async Task<IReadOnlyList<AdminLatestReviewDto>> GetLatestReviewsForAdminAsync(
        int limit = 5,
        CancellationToken cancellationToken = default)
    {
        var take = limit <= 0 ? 5 : Math.Min(limit, 20);

        var rows = await _context.ProductReviews
            .AsNoTracking()
            .Where(r => r.Status == ReviewStatus.Approved)
            .OrderByDescending(r => r.CreatedAt)
            .ThenByDescending(r => r.Id)
            .Take(take)
            .Select(r => new AdminLatestReviewDto
            {
                Id = r.Id,
                ProductId = r.ProductId,
                ProductName = r.Product.Translations
                    .Where(t => t.LanguageCode == "en")
                    .Select(t => t.Name)
                    .FirstOrDefault() ?? $"Product #{r.ProductId}",
                CustomerName = r.User.CustomerProfile != null
                    ? (r.User.CustomerProfile.DisplayName
                       ?? ((r.User.CustomerProfile.FirstName ?? "") + " " + (r.User.CustomerProfile.LastName ?? "")).Trim())
                    : "Customer",
                Rating = r.Rating,
                Title = r.Title,
                IsVerifiedPurchase = r.IsVerifiedPurchase,
                CreatedAt = r.CreatedAt,
            })
            .ToListAsync(cancellationToken);

        return rows
            .Select(r =>
            {
                if (string.IsNullOrWhiteSpace(r.CustomerName))
                    r.CustomerName = "Customer";
                if (string.IsNullOrWhiteSpace(r.ProductName))
                    r.ProductName = $"Product #{r.ProductId}";
                return r;
            })
            .ToList();
    }

    private async Task NotifyAdminsOfNewReviewAsync(
        ProductReview review,
        string customerUserId,
        CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Translations)
            .FirstOrDefaultAsync(p => p.Id == review.ProductId, cancellationToken);

        var customer = await _context.Users
            .AsNoTracking()
            .Include(u => u.CustomerProfile)
            .FirstOrDefaultAsync(u => u.Id == customerUserId, cancellationToken);

        var productName = product?.Translations
            .FirstOrDefault(t => t.LanguageCode == "en")?.Name
            ?? $"Product #{review.ProductId}";
        var customerName = customer?.CustomerProfile?.DisplayName
            ?? $"{customer?.CustomerProfile?.FirstName} {customer?.CustomerProfile?.LastName}".Trim();
        if (string.IsNullOrWhiteSpace(customerName))
            customerName = "A customer";

        var adminUsers = await _userManager.GetUsersInRoleAsync("Admin");
        if (adminUsers.Count == 0)
            return;

        var deepLink = $"/products/{review.ProductId}#reviews";
        var referenceKey = $"review-{review.Id}";

        await _notificationService.BroadcastToUsersAsync(
            adminUsers.Select(u => u.Id),
            "New Product Review",
            $"{customerName} reviewed \"{productName}\"",
            NotificationType.NewProductReview,
            NotificationTargetTypes.ProductReview,
            review.Id,
            referenceKey,
            cancellationToken,
            deepLink);
    }

    public async Task<ServiceResult<ReviewDto>> UpdateReviewAsync(
        int reviewId,
        string userId,
        UpdateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var validation = ValidateReviewInput(request.Rating, request.Title, request.Comment, request.ImageUrls);
        if (validation != null)
            return validation;

        var review = await _context.ProductReviews
            .Include(r => r.Images)
            .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

        if (review == null)
            return ServiceResult<ReviewDto>.Fail("not_found", "Review not found.", StatusCodes.Status404NotFound);

        if (review.UserId != userId)
            return ServiceResult<ReviewDto>.Fail("forbidden", "You can only edit your own reviews.", StatusCodes.Status403Forbidden);

        var productValidation = await ValidateReviewableProductAsync(review.ProductId, cancellationToken);
        if (productValidation != null)
            return productValidation;

        var now = DateTime.UtcNow;
        review.Rating = request.Rating;
        review.Title = NormalizeOptional(request.Title, MaxTitleLength);
        review.Comment = NormalizeOptional(request.Comment, MaxCommentLength);
        review.UpdatedAt = now;
        review.UpdatedBy = userId;

        _context.ReviewImages.RemoveRange(review.Images);
        review.Images.Clear();
        ApplyReviewImages(review, request.ImageUrls, userId, now);

        await _context.SaveChangesAsync(cancellationToken);
        await RecalculateProductReviewStatsAsync(review.ProductId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = await GetReviewDtoByIdAsync(review.Id, userId, cancellationToken);
        await _statisticsRealtime.NotifyStatisticsUpdatedAsync(cancellationToken);
        return ServiceResult<ReviewDto>.Ok(dto!);
    }

    public async Task<ServiceResult<bool>> DeleteReviewAsync(
        int reviewId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        var review = await _context.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

        if (review == null)
            return ServiceResult<bool>.Fail("not_found", "Review not found.", StatusCodes.Status404NotFound);

        if (review.UserId != userId)
            return ServiceResult<bool>.Fail("forbidden", "You can only delete your own reviews.", StatusCodes.Status403Forbidden);

        var productId = review.ProductId;
        _context.ProductReviews.Remove(review);
        await _context.SaveChangesAsync(cancellationToken);
        await RecalculateProductReviewStatsAsync(productId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _statisticsRealtime.NotifyStatisticsUpdatedAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<ReviewHelpfulDto>> MarkHelpfulAsync(
        int reviewId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        var review = await _context.ProductReviews
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == reviewId && r.IsVisible && r.Status == ReviewStatus.Approved, cancellationToken);

        if (review == null)
            return ServiceResult<ReviewHelpfulDto>.Fail("not_found", "Review not found.", StatusCodes.Status404NotFound);

        var exists = await _context.ReviewHelpfuls
            .AnyAsync(h => h.ProductReviewId == reviewId && h.UserId == userId, cancellationToken);

        if (!exists)
        {
            _context.ReviewHelpfuls.Add(new ReviewHelpful
            {
                ProductReviewId = reviewId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = userId,
            });
            await _context.SaveChangesAsync(cancellationToken);
        }

        return ServiceResult<ReviewHelpfulDto>.Ok(await BuildHelpfulDtoAsync(reviewId, userId, cancellationToken));
    }

    public async Task<ServiceResult<ReviewHelpfulDto>> RemoveHelpfulAsync(
        int reviewId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        var reviewExists = await _context.ProductReviews
            .AsNoTracking()
            .AnyAsync(r => r.Id == reviewId, cancellationToken);

        if (!reviewExists)
            return ServiceResult<ReviewHelpfulDto>.Fail("not_found", "Review not found.", StatusCodes.Status404NotFound);

        var helpful = await _context.ReviewHelpfuls
            .FirstOrDefaultAsync(h => h.ProductReviewId == reviewId && h.UserId == userId, cancellationToken);

        if (helpful != null)
        {
            _context.ReviewHelpfuls.Remove(helpful);
            await _context.SaveChangesAsync(cancellationToken);
        }

        return ServiceResult<ReviewHelpfulDto>.Ok(await BuildHelpfulDtoAsync(reviewId, userId, cancellationToken));
    }

    public async Task<ServiceResult<bool>> AdminDeleteReviewAsync(
        int reviewId,
        CancellationToken cancellationToken = default)
    {
        var review = await _context.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

        if (review == null)
            return ServiceResult<bool>.Fail("not_found", "Review not found.", StatusCodes.Status404NotFound);

        var productId = review.ProductId;
        _context.ProductReviews.Remove(review);
        await _context.SaveChangesAsync(cancellationToken);
        await RecalculateProductReviewStatsAsync(productId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _statisticsRealtime.NotifyStatisticsUpdatedAsync(cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<ReviewDto>> AdminSetVisibilityAsync(
        int reviewId,
        bool isVisible,
        CancellationToken cancellationToken = default)
    {
        var review = await _context.ProductReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId, cancellationToken);

        if (review == null)
            return ServiceResult<ReviewDto>.Fail("not_found", "Review not found.", StatusCodes.Status404NotFound);

        review.IsVisible = isVisible;
        review.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        await RecalculateProductReviewStatsAsync(review.ProductId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        var dto = await GetReviewDtoByIdAsync(review.Id, null, cancellationToken);
        await _statisticsRealtime.NotifyStatisticsUpdatedAsync(cancellationToken);
        return ServiceResult<ReviewDto>.Ok(dto!);
    }

    private static IQueryable<ProductReview> ApplySort(IQueryable<ProductReview> query, string? sort)
    {
        return (sort ?? "newest").Trim().ToLowerInvariant() switch
        {
            "oldest" => query.OrderBy(r => r.CreatedAt),
            "highest" or "highest_rating" => query.OrderByDescending(r => r.Rating).ThenByDescending(r => r.CreatedAt),
            "lowest" or "lowest_rating" => query.OrderBy(r => r.Rating).ThenByDescending(r => r.CreatedAt),
            "helpful" or "most_helpful" => query
                .OrderByDescending(r => r.HelpfulVotes.Count)
                .ThenByDescending(r => r.CreatedAt),
            _ => query.OrderByDescending(r => r.CreatedAt),
        };
    }

    private async Task RecalculateProductReviewStatsAsync(int productId, CancellationToken cancellationToken)
    {
        var visibleReviews = _context.ProductReviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId && r.IsVisible && r.Status == ReviewStatus.Approved);

        var count = await visibleReviews.CountAsync(cancellationToken);
        decimal average = 0;
        var verified = 0;

        if (count > 0)
        {
            average = await visibleReviews.AverageAsync(r => (decimal)r.Rating, cancellationToken);
            verified = await visibleReviews.CountAsync(r => r.IsVerifiedPurchase, cancellationToken);
        }

        var product = await _context.Products.FirstAsync(p => p.Id == productId, cancellationToken);
        product.ReviewCount = count;
        product.AverageRating = count > 0 ? Math.Round(average, 2) : 0;
        product.VerifiedReviewCount = verified;
        product.UpdatedAt = DateTime.UtcNow;
    }

    private async Task<VerifiedPurchaseInfo?> ResolveVerifiedPurchaseAsync(
        int productId,
        string userId,
        int? orderId,
        CancellationToken cancellationToken)
    {
        var query = _context.OrderItems
            .AsNoTracking()
            .Where(oi =>
                oi.ProductId == productId &&
                oi.Order.UserId == userId &&
                EligibleOrderStatuses.Contains(oi.Order.Status));

        if (orderId.HasValue)
            query = query.Where(oi => oi.OrderId == orderId.Value);

        var match = await query
            .OrderByDescending(oi => oi.Order.UpdatedAt ?? oi.Order.CreatedAt)
            .Select(oi => new VerifiedPurchaseInfo { OrderId = oi.OrderId })
            .FirstOrDefaultAsync(cancellationToken);

        return match;
    }

    private async Task<ServiceResult<ReviewDto>?> ValidateReviewableProductAsync(
        int productId,
        CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);

        if (product == null || product.IsDeleted)
        {
            return ServiceResult<ReviewDto>.Fail(
                "product_not_found",
                "Product not found.",
                StatusCodes.Status404NotFound);
        }

        if (product.Status != ProductStatus.Active)
        {
            return ServiceResult<ReviewDto>.Fail(
                "product_inactive",
                "You cannot review an inactive product.");
        }

        return null;
    }

    private ServiceResult<ReviewDto>? ValidateReviewInput(
        byte rating,
        string? title,
        string? comment,
        IReadOnlyList<string>? imageUrls)
    {
        if (rating is < 1 or > 5)
            return ServiceResult<ReviewDto>.Fail("invalid_rating", "Rating must be between 1 and 5.");

        if (!string.IsNullOrWhiteSpace(title) && title.Trim().Length > MaxTitleLength)
            return ServiceResult<ReviewDto>.Fail("title_too_long", $"Title cannot exceed {MaxTitleLength} characters.");

        if (!string.IsNullOrWhiteSpace(comment) && comment.Trim().Length > MaxCommentLength)
            return ServiceResult<ReviewDto>.Fail("comment_too_long", $"Comment cannot exceed {MaxCommentLength} characters.");

        if (imageUrls != null && imageUrls.Count > MaxReviewImages)
            return ServiceResult<ReviewDto>.Fail("too_many_images", $"A maximum of {MaxReviewImages} images is allowed.");

        if (imageUrls != null && imageUrls.Any(url => string.IsNullOrWhiteSpace(url)))
            return ServiceResult<ReviewDto>.Fail("invalid_image_url", "Image URLs cannot be empty.");

        return null;
    }

    private static void ApplyReviewImages(
        ProductReview review,
        IReadOnlyList<string>? imageUrls,
        string userId,
        DateTime now)
    {
        if (imageUrls == null || imageUrls.Count == 0)
            return;

        var urls = imageUrls
            .Where(url => !string.IsNullOrWhiteSpace(url))
            .Select(url => url.Trim())
            .Take(MaxReviewImages)
            .ToList();

        for (var i = 0; i < urls.Count; i++)
        {
            review.Images.Add(new ReviewImage
            {
                ImageUrl = urls[i],
                SortOrder = i,
                IsPrimary = i == 0,
                CreatedAt = now,
                CreatedBy = userId,
            });
        }
    }

    private async Task<ReviewDto?> GetReviewDtoByIdAsync(
        int reviewId,
        string? currentUserId,
        CancellationToken cancellationToken)
    {
        var row = await _context.ProductReviews
            .AsNoTracking()
            .Where(r => r.Id == reviewId)
            .Select(r => new ReviewProjection
            {
                Id = r.Id,
                ProductId = r.ProductId,
                UserId = r.UserId,
                ReviewerName = r.User.CustomerProfile != null
                    ? (r.User.CustomerProfile.DisplayName
                       ?? ((r.User.CustomerProfile.FirstName ?? "") + " " + (r.User.CustomerProfile.LastName ?? "")).Trim())
                    : null,
                OrderId = r.OrderId,
                Rating = r.Rating,
                Title = r.Title,
                Comment = r.Comment,
                IsVerifiedPurchase = r.IsVerifiedPurchase,
                IsVisible = r.IsVisible,
                HelpfulCount = r.HelpfulVotes.Count,
                IsHelpfulByCurrentUser = currentUserId != null && r.HelpfulVotes.Any(h => h.UserId == currentUserId),
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                Images = r.Images
                    .OrderBy(i => i.SortOrder)
                    .ThenByDescending(i => i.IsPrimary)
                    .Select(i => new ReviewImageDto
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        SortOrder = i.SortOrder,
                        IsPrimary = i.IsPrimary,
                    })
                    .ToList(),
            })
            .FirstOrDefaultAsync(cancellationToken);

        return row == null ? null : MapProjection(row);
    }

    private async Task<ReviewHelpfulDto> BuildHelpfulDtoAsync(
        int reviewId,
        string userId,
        CancellationToken cancellationToken)
    {
        var helpfulCount = await _context.ReviewHelpfuls
            .AsNoTracking()
            .CountAsync(h => h.ProductReviewId == reviewId, cancellationToken);

        return new ReviewHelpfulDto
        {
            ReviewId = reviewId,
            HelpfulCount = helpfulCount,
            IsHelpfulByCurrentUser = await _context.ReviewHelpfuls
                .AsNoTracking()
                .AnyAsync(h => h.ProductReviewId == reviewId && h.UserId == userId, cancellationToken),
        };
    }

    private static string? NormalizeOptional(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private static ReviewDto MapProjection(ReviewProjection row) =>
        new()
        {
            Id = row.Id,
            ProductId = row.ProductId,
            UserId = row.UserId,
            ReviewerName = string.IsNullOrWhiteSpace(row.ReviewerName) ? "Customer" : row.ReviewerName,
            OrderId = row.OrderId,
            Rating = row.Rating,
            Title = row.Title,
            Comment = row.Comment,
            IsVerifiedPurchase = row.IsVerifiedPurchase,
            IsVisible = row.IsVisible,
            HelpfulCount = row.HelpfulCount,
            IsHelpfulByCurrentUser = row.IsHelpfulByCurrentUser,
            CreatedAt = row.CreatedAt,
            UpdatedAt = row.UpdatedAt,
            Images = row.Images,
        };

    private sealed class ReviewProjection
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

    private sealed class VerifiedPurchaseInfo
    {
        public int OrderId { get; set; }
    }
}
