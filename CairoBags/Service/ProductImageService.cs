using CairoBags.Data;
using CairoBags.Dto.Catalog;
using CairoBags.Helpers;
using CairoBags.Models.Catalog;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class ProductImageService : IProductImageService
{
    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    private readonly CairoBagsContext _context;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<ProductImageService> _logger;
    private readonly ICatalogRealtimeService _catalogRealtime;

    public ProductImageService(
        CairoBagsContext context,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<ProductImageService> logger,
        ICatalogRealtimeService catalogRealtime)
    {
        _context = context;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
        _catalogRealtime = catalogRealtime;
    }

    public async Task<IReadOnlyList<ProductImageDto>> GetProductImagesAsync(
        int productId,
        bool storefront,
        CancellationToken cancellationToken = default)
    {
        if (!await ProductExistsInternalAsync(productId, storefront, cancellationToken))
            return Array.Empty<ProductImageDto>();

        var images = await _context.ProductImages
            .AsNoTracking()
            .Where(i => i.ProductId == productId)
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .ToListAsync(cancellationToken);

        return images.Select(MapImage).ToList();
    }

    public Task<bool> ProductExistsAsync(int productId, bool storefront, CancellationToken cancellationToken = default) =>
        ProductExistsInternalAsync(productId, storefront, cancellationToken);

    public Task<ServiceResult<ProductImageDto>> UploadProductImageAsync(
        int productId,
        IFormFile file,
        UploadProductImageRequest request,
        string? userId,
        CancellationToken cancellationToken = default) =>
        UploadImageAsync(productId, variantId: null, file, request, userId, cancellationToken);

    public Task<ServiceResult<ProductImageDto>> UploadVariantImageAsync(
        int productId,
        int variantId,
        IFormFile file,
        UploadProductImageRequest request,
        string? userId,
        CancellationToken cancellationToken = default) =>
        UploadImageAsync(productId, variantId, file, request, userId, cancellationToken);

    public async Task<ServiceResult<ProductImageDto>> SetPrimaryAsync(
        int productId,
        int imageId,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var product = await GetAdminProductAsync(productId, cancellationToken);
        if (product == null)
            return ServiceResult<ProductImageDto>.Fail("not_found", "Product not found.", StatusCodes.Status404NotFound);

        var image = product.Images.FirstOrDefault(i => i.Id == imageId);
        if (image == null)
            return ServiceResult<ProductImageDto>.Fail("image_not_found", "Image not found.", StatusCodes.Status404NotFound);

        var now = DateTime.UtcNow;
        foreach (var existing in product.Images)
        {
            existing.IsPrimary = existing.Id == imageId;
            if (existing.IsPrimary)
            {
                existing.UpdatedAt = now;
                existing.UpdatedBy = userId;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        await NotifyProductUpdatedAsync(productId, cancellationToken);
        return ServiceResult<ProductImageDto>.Ok(MapImage(image));
    }

    public async Task<ServiceResult<IReadOnlyList<ProductImageDto>>> ReorderAsync(
        int productId,
        ReorderProductImagesRequest request,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        if (request.Items == null || request.Items.Count == 0)
            return ServiceResult<IReadOnlyList<ProductImageDto>>.Fail("invalid_request", "At least one image order item is required.");

        var product = await GetAdminProductAsync(productId, cancellationToken);
        if (product == null)
            return ServiceResult<IReadOnlyList<ProductImageDto>>.Fail("not_found", "Product not found.", StatusCodes.Status404NotFound);

        var imageIds = product.Images.Select(i => i.Id).ToHashSet();
        if (request.Items.Any(i => !imageIds.Contains(i.ImageId)))
            return ServiceResult<IReadOnlyList<ProductImageDto>>.Fail("image_not_found", "One or more images do not belong to this product.");

        var now = DateTime.UtcNow;
        foreach (var item in request.Items)
        {
            var image = product.Images.First(i => i.Id == item.ImageId);
            image.SortOrder = item.SortOrder;
            image.UpdatedAt = now;
            image.UpdatedBy = userId;
        }

        await _context.SaveChangesAsync(cancellationToken);

        var ordered = product.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .Select(MapImage)
            .ToList();

        await NotifyProductUpdatedAsync(productId, cancellationToken);
        return ServiceResult<IReadOnlyList<ProductImageDto>>.Ok(ordered);
    }

    public async Task<ServiceResult<bool>> DeleteImageAsync(
        int productId,
        int imageId,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var product = await GetAdminProductAsync(productId, cancellationToken);
        if (product == null)
            return ServiceResult<bool>.Fail("not_found", "Product not found.", StatusCodes.Status404NotFound);

        var image = product.Images.FirstOrDefault(i => i.Id == imageId);
        if (image == null)
            return ServiceResult<bool>.Fail("image_not_found", "Image not found.", StatusCodes.Status404NotFound);

        if (product.Status == ProductStatus.Active && product.Images.Count <= 1)
            return ServiceResult<bool>.Fail("last_image", "Cannot delete the last image of an active product.");

        var imageUrl = image.ImageUrl;
        var wasPrimary = image.IsPrimary;

        _context.ProductImages.Remove(image);
        await _context.SaveChangesAsync(cancellationToken);

        if (wasPrimary)
        {
            var nextPrimary = await _context.ProductImages
                .Where(i => i.ProductId == productId)
                .OrderBy(i => i.SortOrder)
                .ThenBy(i => i.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (nextPrimary != null)
            {
                nextPrimary.IsPrimary = true;
                nextPrimary.UpdatedAt = DateTime.UtcNow;
                nextPrimary.UpdatedBy = userId;
                await _context.SaveChangesAsync(cancellationToken);
            }
            else if (product.Status == ProductStatus.Active)
            {
                return ServiceResult<bool>.Fail("primary_required", "Active products must have a primary image.");
            }
        }

        TryDeletePhysicalFile(imageUrl);
        await NotifyProductUpdatedAsync(productId, cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }

    private async Task<ServiceResult<ProductImageDto>> UploadImageAsync(
        int productId,
        int? variantId,
        IFormFile file,
        UploadProductImageRequest request,
        string? userId,
        CancellationToken cancellationToken)
    {
        var product = await GetAdminProductAsync(productId, cancellationToken);
        if (product == null)
            return ServiceResult<ProductImageDto>.Fail("not_found", "Product not found.", StatusCodes.Status404NotFound);

        if (variantId.HasValue)
        {
            var variantExists = product.Variants.Any(v => v.Id == variantId.Value);
            if (!variantExists)
                return ServiceResult<ProductImageDto>.Fail("variant_not_found", "Variant not found for this product.", StatusCodes.Status404NotFound);
        }

        var saveResult = await SaveImageFileAsync(productId, variantId, product, file, cancellationToken);
        if (!saveResult.Succeeded || saveResult.Data == null)
            return ServiceResult<ProductImageDto>.Fail(saveResult.ErrorCode!, saveResult.Message!, saveResult.StatusCode ?? 400);

        var now = DateTime.UtcNow;
        var nextSortOrder = request.SortOrder ?? await GetNextSortOrderAsync(productId, cancellationToken);
        var shouldBePrimary = request.IsPrimary || !product.Images.Any(i => i.IsPrimary);

        if (shouldBePrimary)
        {
            foreach (var existing in product.Images)
                existing.IsPrimary = false;
        }

        if (product.Status == ProductStatus.Active && product.Images.Count == 0)
            shouldBePrimary = true;

        var image = new ProductImage
        {
            ProductId = productId,
            VariantId = variantId,
            ImageUrl = saveResult.Data,
            ThumbnailUrl = saveResult.Data,
            AltTextAr = NormalizeOptional(request.AltTextAr),
            AltTextEn = NormalizeOptional(request.AltTextEn),
            IsPrimary = shouldBePrimary,
            SortOrder = nextSortOrder,
            CreatedAt = now,
            CreatedBy = userId
        };

        _context.ProductImages.Add(image);
        await _context.SaveChangesAsync(cancellationToken);

        await NotifyProductUpdatedAsync(productId, cancellationToken);
        return ServiceResult<ProductImageDto>.Ok(MapImage(image));
    }

    private async Task<ServiceResult<string>> SaveImageFileAsync(
        int productId,
        int? variantId,
        Product product,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file == null || file.Length == 0)
            return ServiceResult<string>.Fail("file_required", "No file uploaded.");

        if (file.Length > MaxFileSizeBytes)
            return ServiceResult<string>.Fail("file_too_large", "Image must be 10 MB or smaller.");

        if (!ImageValidationHelper.IsAllowedContentType(file.ContentType))
            return ServiceResult<string>.Fail("invalid_file_type", "Invalid image type. Allowed types: JPEG, PNG, WebP.");

        await using var validationStream = file.OpenReadStream();
        if (!ImageValidationHelper.HasValidImageSignature(validationStream, out var normalizedContentType))
            return ServiceResult<string>.Fail("invalid_file_signature", "File content is not a valid image.");

        var extension = ExtensionForContentType(normalizedContentType);
        var fileName = await BuildFileNameAsync(product, variantId, extension, cancellationToken);

        var storageFolder = _configuration["FileStorage:Path"] ?? "FileStorage";
        var rootPath = _environment.ContentRootPath ?? Directory.GetCurrentDirectory();
        var productDir = Path.Combine(rootPath, storageFolder, "products", productId.ToString());

        Directory.CreateDirectory(productDir);

        var fullPath = Path.Combine(productDir, fileName);
        await using (var output = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(output, cancellationToken);
        }

        var relativePath = $"/{storageFolder}/products/{productId}/{fileName}";
        return ServiceResult<string>.Ok(relativePath);
    }

    private async Task<string> BuildFileNameAsync(
        Product product,
        int? variantId,
        string extension,
        CancellationToken cancellationToken)
    {
        if (variantId.HasValue)
        {
            var variant = product.Variants.First(v => v.Id == variantId.Value);
            var skuSlug = SanitizeFileToken(variant.Sku);
            var variantImageCount = await _context.ProductImages
                .CountAsync(i => i.ProductId == product.Id && i.VariantId == variantId.Value, cancellationToken);

            return $"{skuSlug}-{variantImageCount + 1}{extension}";
        }

        var productImageCount = product.Images.Count(i => i.VariantId == null);
        if (productImageCount == 0 || !product.Images.Any(i => i.IsPrimary))
            return $"main{extension}";

        return $"image-{productImageCount + 1}{extension}";
    }

    private async Task<int> GetNextSortOrderAsync(int productId, CancellationToken cancellationToken)
    {
        var maxSort = await _context.ProductImages
            .Where(i => i.ProductId == productId)
            .Select(i => (int?)i.SortOrder)
            .MaxAsync(cancellationToken);

        return (maxSort ?? 0) + 1;
    }

    private async Task<bool> ProductExistsInternalAsync(int productId, bool storefront, CancellationToken cancellationToken)
    {
        var query = _context.Products.AsNoTracking().Where(p => p.Id == productId && !p.IsDeleted);

        if (storefront)
            query = query.Where(p => p.Status == ProductStatus.Active);

        return await query.AnyAsync(cancellationToken);
    }

    private async Task<Product?> GetAdminProductAsync(int productId, CancellationToken cancellationToken) =>
        await _context.Products
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == productId && !p.IsDeleted, cancellationToken);

    private void TryDeletePhysicalFile(string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl))
            return;

        try
        {
            var storageFolder = _configuration["FileStorage:Path"] ?? "FileStorage";
            var prefix = $"/{storageFolder}/";
            if (!imageUrl.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return;

            var relative = imageUrl[prefix.Length..].Replace('/', Path.DirectorySeparatorChar);
            var rootPath = _environment.ContentRootPath ?? Directory.GetCurrentDirectory();
            var fullPath = Path.Combine(rootPath, storageFolder, relative);

            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete product image file {ImageUrl}", imageUrl);
        }
    }

    private static ProductImageDto MapImage(ProductImage image) =>
        new()
        {
            Id = image.Id,
            VariantId = image.VariantId,
            ImageUrl = image.ImageUrl,
            ThumbnailUrl = image.ThumbnailUrl,
            AltTextAr = image.AltTextAr,
            AltTextEn = image.AltTextEn,
            IsPrimary = image.IsPrimary,
            SortOrder = image.SortOrder
        };

    private static string ExtensionForContentType(string contentType) =>
        contentType switch
        {
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => ".jpg"
        };

    private static string SanitizeFileToken(string value)
    {
        var chars = value.Trim().ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray();

        var sanitized = new string(chars).Trim('-');
        while (sanitized.Contains("--", StringComparison.Ordinal))
            sanitized = sanitized.Replace("--", "-", StringComparison.Ordinal);

        return string.IsNullOrWhiteSpace(sanitized) ? "variant" : sanitized;
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private async Task NotifyProductUpdatedAsync(int productId, CancellationToken cancellationToken)
    {
        var categoryId = await _context.Products
            .AsNoTracking()
            .Where(p => p.Id == productId)
            .Select(p => (int?)p.CategoryId)
            .FirstOrDefaultAsync(cancellationToken);

        await _catalogRealtime.NotifyProductChangedAsync("updated", productId, categoryId, cancellationToken);
    }
}
