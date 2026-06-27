using CairoBags.Data;
using CairoBags.Dto.Wishlist;
using CairoBags.Models.Catalog;
using CairoBags.Models.Commerce;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class WishlistService : IWishlistService
{
    private readonly CairoBagsContext _context;

    public WishlistService(CairoBagsContext context)
    {
        _context = context;
    }

    public async Task<ServiceResult<WishlistResponseDto>> GetWishlistAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var wishlist = await GetOrCreateWishlistAsync(userId, cancellationToken);
        var items = await LoadWishlistItemsAsync(wishlist.Id, cancellationToken);

        return ServiceResult<WishlistResponseDto>.Ok(new WishlistResponseDto
        {
            Items = items,
            Count = items.Count
        });
    }

    public async Task<ServiceResult<WishlistToggleResponseDto>> ToggleAsync(
        string userId,
        int productId,
        CancellationToken cancellationToken = default)
    {
        var productResult = await LoadAvailableProductAsync(productId, cancellationToken);
        if (productResult.Error != null)
        {
            return ServiceResult<WishlistToggleResponseDto>.Fail(
                productResult.Error.ErrorCode,
                productResult.Error.Message,
                productResult.Error.StatusCode);
        }

        var wishlist = await GetOrCreateWishlistAsync(userId, cancellationToken);
        var existing = await _context.WishlistItems
            .FirstOrDefaultAsync(
                item => item.WishlistId == wishlist.Id && item.ProductId == productId,
                cancellationToken);

        var now = DateTime.UtcNow;
        var isInWishlist = existing == null;

        if (existing != null)
        {
            _context.WishlistItems.Remove(existing);
            wishlist.UpdatedAt = now;
        }
        else
        {
            _context.WishlistItems.Add(new WishlistItem
            {
                WishlistId = wishlist.Id,
                ProductId = productId,
                CreatedAt = now
            });
            wishlist.UpdatedAt = now;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var count = await _context.WishlistItems.CountAsync(
            item => item.WishlistId == wishlist.Id,
            cancellationToken);

        return ServiceResult<WishlistToggleResponseDto>.Ok(new WishlistToggleResponseDto
        {
            IsInWishlist = isInWishlist,
            WishlistCount = count
        });
    }

    public async Task<ServiceResult<WishlistToggleResponseDto>> RemoveAsync(
        string userId,
        int productId,
        CancellationToken cancellationToken = default)
    {
        var wishlist = await _context.Wishlists
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);

        if (wishlist == null)
        {
            return ServiceResult<WishlistToggleResponseDto>.Ok(new WishlistToggleResponseDto
            {
                IsInWishlist = false,
                WishlistCount = 0
            });
        }

        var existing = await _context.WishlistItems
            .FirstOrDefaultAsync(
                item => item.WishlistId == wishlist.Id && item.ProductId == productId,
                cancellationToken);

        if (existing == null)
        {
            var currentCount = await _context.WishlistItems.CountAsync(
                item => item.WishlistId == wishlist.Id,
                cancellationToken);

            return ServiceResult<WishlistToggleResponseDto>.Ok(new WishlistToggleResponseDto
            {
                IsInWishlist = false,
                WishlistCount = currentCount
            });
        }

        _context.WishlistItems.Remove(existing);

        var trackedWishlist = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.Id == wishlist.Id, cancellationToken);
        if (trackedWishlist != null)
            trackedWishlist.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var count = await _context.WishlistItems.CountAsync(
            item => item.WishlistId == wishlist.Id,
            cancellationToken);

        return ServiceResult<WishlistToggleResponseDto>.Ok(new WishlistToggleResponseDto
        {
            IsInWishlist = false,
            WishlistCount = count
        });
    }

    public async Task<ServiceResult<WishlistCountDto>> GetCountAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        var count = await _context.WishlistItems
            .AsNoTracking()
            .Where(item => item.Wishlist.UserId == userId)
            .CountAsync(cancellationToken);

        return ServiceResult<WishlistCountDto>.Ok(new WishlistCountDto { Count = count });
    }

    private async Task<Wishlist> GetOrCreateWishlistAsync(string userId, CancellationToken cancellationToken)
    {
        var wishlist = await _context.Wishlists
            .FirstOrDefaultAsync(w => w.UserId == userId, cancellationToken);

        if (wishlist != null)
            return wishlist;

        var now = DateTime.UtcNow;
        wishlist = new Wishlist
        {
            UserId = userId,
            CreatedAt = now
        };

        _context.Wishlists.Add(wishlist);
        await _context.SaveChangesAsync(cancellationToken);
        return wishlist;
    }

    private async Task<List<WishlistItemDto>> LoadWishlistItemsAsync(
        int wishlistId,
        CancellationToken cancellationToken)
    {
        var items = await _context.WishlistItems
            .AsNoTracking()
            .Where(item => item.WishlistId == wishlistId)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync(cancellationToken);

        if (items.Count == 0)
            return new List<WishlistItemDto>();

        var productIds = items.Select(item => item.ProductId).Distinct().ToList();

        var products = await _context.Products
            .AsNoTracking()
            .Where(product => productIds.Contains(product.Id))
            .Include(product => product.Translations)
            .Include(product => product.Category)
                .ThenInclude(category => category.Translations)
            .Include(product => product.Images)
            .Include(product => product.Variants)
                .ThenInclude(variant => variant.Inventory)
            .ToListAsync(cancellationToken);

        var productMap = products.ToDictionary(product => product.Id);

        return items
            .Where(item => productMap.ContainsKey(item.ProductId))
            .Select(item => MapWishlistItem(productMap[item.ProductId], item.CreatedAt))
            .ToList();
    }

    private async Task<(Product? Product, ServiceError? Error)> LoadAvailableProductAsync(
        int productId,
        CancellationToken cancellationToken)
    {
        var product = await _context.Products
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == productId, cancellationToken);

        if (product == null || product.IsDeleted)
        {
            return (null, new ServiceError("product_not_found", "Product not found.", StatusCodes.Status404NotFound));
        }

        if (!IsProductAvailable(product))
        {
            return (null, new ServiceError("product_unavailable", "Product is not available.", StatusCodes.Status400BadRequest));
        }

        return (product, null);
    }

    private static bool IsProductAvailable(Product product) =>
        product.Status == ProductStatus.Active && !product.IsDeleted;

    private static WishlistItemDto MapWishlistItem(Product product, DateTime addedAt)
    {
        var arTranslation = product.Translations.FirstOrDefault(t => t.LanguageCode == "ar");
        var enTranslation = product.Translations.FirstOrDefault(t => t.LanguageCode == "en");
        var nameAr = arTranslation?.Name ?? string.Empty;
        var nameEn = enTranslation?.Name ?? string.Empty;
        var categoryEn = product.Category?.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name ?? string.Empty;

        var activeVariants = product.Variants
            .Where(variant => variant.Status == VariantStatus.Active)
            .ToList();

        var prices = activeVariants.Select(variant => variant.Price).ToList();
        var primaryImage = product.Images
            .OrderByDescending(image => image.IsPrimary)
            .ThenBy(image => image.SortOrder)
            .FirstOrDefault();

        var inStock = activeVariants.Any(variant =>
        {
            if (variant.Inventory == null)
                return false;

            return variant.Inventory.QuantityOnHand - variant.Inventory.QuantityReserved > 0;
        });

        return new WishlistItemDto
        {
            ProductId = product.Id,
            ProductNameAr = nameAr,
            ProductNameEn = nameEn,
            ProductSlugAr = arTranslation?.Slug ?? string.Empty,
            ProductSlugEn = enTranslation?.Slug ?? string.Empty,
            PrimaryImage = primaryImage?.ThumbnailUrl ?? primaryImage?.ImageUrl,
            Price = prices.Count == 0 ? null : prices.Min(),
            CompareAtPrice = product.CompareAtPrice,
            InStock = inStock,
            Category = categoryEn,
            AddedAt = addedAt
        };
    }

    private sealed record ServiceError(string ErrorCode, string Message, int StatusCode);
}
