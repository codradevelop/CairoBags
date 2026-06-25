using CairoBags.Dto.Wishlist;

namespace CairoBags.Service;

public interface IWishlistService
{
    Task<ServiceResult<WishlistResponseDto>> GetWishlistAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<WishlistToggleResponseDto>> ToggleAsync(
        string userId,
        int productId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<WishlistToggleResponseDto>> RemoveAsync(
        string userId,
        int productId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<WishlistCountDto>> GetCountAsync(
        string userId,
        CancellationToken cancellationToken = default);
}
