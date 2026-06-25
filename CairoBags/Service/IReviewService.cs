using CairoBags.Dto.Reviews;

namespace CairoBags.Service;

public interface IReviewService
{
    Task<PagedReviewsDto> GetProductReviewsAsync(
        int productId,
        ReviewListQuery query,
        string? currentUserId = null,
        CancellationToken cancellationToken = default);

    Task<ReviewSummaryDto?> GetProductReviewSummaryAsync(
        int productId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<ReviewDto>> CreateReviewAsync(
        int productId,
        string userId,
        CreateReviewRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<ReviewDto>> UpdateReviewAsync(
        int reviewId,
        string userId,
        UpdateReviewRequest request,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteReviewAsync(
        int reviewId,
        string userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<ReviewHelpfulDto>> MarkHelpfulAsync(
        int reviewId,
        string userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<ReviewHelpfulDto>> RemoveHelpfulAsync(
        int reviewId,
        string userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> AdminDeleteReviewAsync(
        int reviewId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<ReviewDto>> AdminSetVisibilityAsync(
        int reviewId,
        bool isVisible,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminLatestReviewDto>> GetLatestReviewsForAdminAsync(
        int limit = 5,
        CancellationToken cancellationToken = default);
}
