using CairoBags.Dto.Catalog;

namespace CairoBags.Service;

public interface IProductService
{
    Task<IReadOnlyList<ProductSummaryDto>> GetProductsAsync(
        ProductQueryFilters filters,
        bool storefront,
        CancellationToken cancellationToken = default);

    Task<ProductDetailsDto?> GetByIdAsync(int id, bool storefront, CancellationToken cancellationToken = default);

    Task<ProductDetailsDto?> GetBySlugAsync(string slug, bool storefront, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductSummaryDto>> GetFeaturedAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductSummaryDto>> GetNewArrivalsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ProductSummaryDto>> SearchAsync(
        ProductQueryFilters filters,
        bool storefront,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<ProductDetailsDto>> CreateAsync(
        CreateProductRequest request,
        string? userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<ProductDetailsDto>> UpdateAsync(
        int id,
        UpdateProductRequest request,
        string? userId,
        CancellationToken cancellationToken = default);

    Task<ServiceResult<bool>> DeleteAsync(int id, string? userId, CancellationToken cancellationToken = default);
}
