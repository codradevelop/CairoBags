using CairoBags.Data;
using CairoBags.Dto.Recommendations;
using CairoBags.Helpers;
using CairoBags.Models.Catalog;
using CairoBags.Models.Orders;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class RecommendationService : IRecommendationService
{
    private const int DefaultLimit = 12;

    private static readonly OrderStatus[] CompletedOrderStatuses =
    {
        OrderStatus.Delivered,
        OrderStatus.Completed
    };

    private readonly CairoBagsContext _context;

    public RecommendationService(CairoBagsContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<RecommendationProductDto>> GetTrendingAsync(
        CancellationToken cancellationToken = default)
    {
        var trendingProductIds = await _context.TrendingProducts
            .AsNoTracking()
            .OrderByDescending(t => t.Score)
            .ThenByDescending(t => t.LastCalculatedAt)
            .Select(t => t.ProductId)
            .Take(DefaultLimit)
            .ToListAsync(cancellationToken);

        if (trendingProductIds.Count == 0)
            return Array.Empty<RecommendationProductDto>();

        return await LoadRecommendationsByIdsAsync(trendingProductIds, cancellationToken);
    }

    public async Task<IReadOnlyList<RecommendationProductDto>> GetRecentlyViewedAsync(
        string? userId,
        string? sessionId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId) && string.IsNullOrWhiteSpace(sessionId))
            return Array.Empty<RecommendationProductDto>();

        var viewsQuery = _context.UserProductViews.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(userId))
            viewsQuery = viewsQuery.Where(v => v.UserId == userId);
        else
            viewsQuery = viewsQuery.Where(v => v.SessionId == sessionId);

        var viewedProductIds = await viewsQuery
            .OrderByDescending(v => v.ViewedAt)
            .ThenByDescending(v => v.Id)
            .Select(v => v.ProductId)
            .ToListAsync(cancellationToken);

        var distinctProductIds = viewedProductIds
            .Distinct()
            .Take(DefaultLimit)
            .ToList();

        if (distinctProductIds.Count == 0)
            return Array.Empty<RecommendationProductDto>();

        return await LoadRecommendationsByIdsAsync(distinctProductIds, cancellationToken);
    }

    public async Task<ServiceResult<IReadOnlyList<RecommendationProductDto>>> GetSimilarAsync(
        int productId,
        CancellationToken cancellationToken = default)
    {
        var sourceProduct = await ActiveProductsQuery()
            .Where(p => p.Id == productId)
            .Select(p => new { p.Id, p.CategoryId })
            .FirstOrDefaultAsync(cancellationToken);

        if (sourceProduct == null)
        {
            return ServiceResult<IReadOnlyList<RecommendationProductDto>>.Fail(
                "product_not_found",
                "Product not found.",
                StatusCodes.Status404NotFound);
        }

        var similarProductIds = await ActiveProductsQuery()
            .Where(p => p.CategoryId == sourceProduct.CategoryId && p.Id != productId)
            .OrderByDescending(p => p.TotalSold)
            .ThenByDescending(p => p.CreatedAt)
            .Select(p => p.Id)
            .Take(DefaultLimit)
            .ToListAsync(cancellationToken);

        var recommendations = await LoadRecommendationsByIdsAsync(similarProductIds, cancellationToken);
        return ServiceResult<IReadOnlyList<RecommendationProductDto>>.Ok(recommendations);
    }

    public async Task<ServiceResult<IReadOnlyList<RecommendationProductDto>>> GetFrequentlyBoughtTogetherAsync(
        int productId,
        CancellationToken cancellationToken = default)
    {
        var productExists = await ActiveProductsQuery()
            .AnyAsync(p => p.Id == productId, cancellationToken);

        if (!productExists)
        {
            return ServiceResult<IReadOnlyList<RecommendationProductDto>>.Fail(
                "product_not_found",
                "Product not found.",
                StatusCodes.Status404NotFound);
        }

        var orderIds = await _context.OrderItems
            .AsNoTracking()
            .Where(oi => oi.ProductId == productId)
            .Where(oi => CompletedOrderStatuses.Contains(oi.Order.Status))
            .Select(oi => oi.OrderId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (orderIds.Count == 0)
            return ServiceResult<IReadOnlyList<RecommendationProductDto>>.Ok(Array.Empty<RecommendationProductDto>());

        var coPurchasedProductIds = await _context.OrderItems
            .AsNoTracking()
            .Where(oi => orderIds.Contains(oi.OrderId))
            .Where(oi => oi.ProductId != productId)
            .GroupBy(oi => oi.ProductId)
            .Select(g => new { ProductId = g.Key, PurchaseCount = g.Count() })
            .OrderByDescending(x => x.PurchaseCount)
            .ThenBy(x => x.ProductId)
            .Take(DefaultLimit)
            .Select(x => x.ProductId)
            .ToListAsync(cancellationToken);

        var recommendations = await LoadRecommendationsByIdsAsync(coPurchasedProductIds, cancellationToken);
        return ServiceResult<IReadOnlyList<RecommendationProductDto>>.Ok(recommendations);
    }

    private async Task<IReadOnlyList<RecommendationProductDto>> LoadRecommendationsByIdsAsync(
        IReadOnlyList<int> productIds,
        CancellationToken cancellationToken)
    {
        if (productIds.Count == 0)
            return Array.Empty<RecommendationProductDto>();

        var products = await ActiveProductsQuery()
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync(cancellationToken);

        var productMap = products.ToDictionary(p => p.Id);

        return productIds
            .Where(productMap.ContainsKey)
            .Select(id => MapToRecommendation(productMap[id]))
            .ToList();
    }

    private IQueryable<Product> ActiveProductsQuery() =>
        _context.Products
            .AsNoTracking()
            .Include(p => p.Translations)
            .Include(p => p.Variants.Where(v => v.Status == VariantStatus.Active))
                .ThenInclude(v => v.Inventory)
            .Include(p => p.Images)
            .Where(p => !p.IsDeleted && p.Status == ProductStatus.Active);

    private static RecommendationProductDto MapToRecommendation(Product product)
    {
        var nameAr = product.Translations.FirstOrDefault(t => t.LanguageCode == "ar")?.Name ?? string.Empty;
        var nameEn = product.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name ?? string.Empty;

        var primaryImage = product.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .FirstOrDefault();

        var activeVariants = product.Variants
            .Where(v => v.Status == VariantStatus.Active)
            .ToList();

        var prices = activeVariants
            .Select(v => v.Price)
            .ToList();

        var isInStock = activeVariants.Any(v =>
            v.Inventory != null &&
            Math.Max(0, v.Inventory.QuantityOnHand - v.Inventory.QuantityReserved) > 0);

        return new RecommendationProductDto
        {
            ProductId = product.Id,
            ProductNameAr = nameAr,
            ProductNameEn = nameEn,
            PrimaryImage = ProductImageUrlHelper.ResolveListingUrl(
                primaryImage?.ImageUrl,
                primaryImage?.ThumbnailUrl),
            Price = prices.Count == 0 ? null : prices.Min(),
            IsInStock = isInStock
        };
    }
}
