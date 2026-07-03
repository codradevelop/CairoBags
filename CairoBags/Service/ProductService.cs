using CairoBags.Data;
using CairoBags.Dto.Catalog;
using CairoBags.Models.Catalog;
using CairoBags.Models.Inventories;
using CairoBags.Models.Orders;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class ProductService : IProductService
{
    private static readonly OrderStatus[] InactiveOrderStatuses =
    {
        OrderStatus.Cancelled,
        OrderStatus.Refunded,
        OrderStatus.Completed
    };

    private readonly CairoBagsContext _context;
    private readonly ICatalogRealtimeService _catalogRealtime;

    public ProductService(CairoBagsContext context, ICatalogRealtimeService catalogRealtime)
    {
        _context = context;
        _catalogRealtime = catalogRealtime;
    }

    public Task<IReadOnlyList<ProductSummaryDto>> GetProductsAsync(
        ProductQueryFilters filters,
        bool storefront,
        CancellationToken cancellationToken = default) =>
        ListProductsAsync(filters, storefront, featuredOnly: false, newArrivalsOnly: false, cancellationToken);

    public async Task<ProductDetailsDto?> GetByIdAsync(int id, bool storefront, CancellationToken cancellationToken = default)
    {
        var product = await BuildDetailsQuery(storefront)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        return product == null ? null : MapToDetails(product, activeVariantsOnly: storefront);
    }

    public async Task<ProductDetailsDto?> GetBySlugAsync(string slug, bool storefront, CancellationToken cancellationToken = default)
    {
        var normalized = NormalizeSlug(slug);
        if (string.IsNullOrEmpty(normalized))
            return null;

        var productId = await _context.ProductTranslations
            .AsNoTracking()
            .Where(t => t.Slug == normalized)
            .Select(t => (int?)t.ProductId)
            .FirstOrDefaultAsync(cancellationToken);

        if (productId == null)
            return null;

        return await GetByIdAsync(productId.Value, storefront, cancellationToken);
    }

    public Task<IReadOnlyList<ProductSummaryDto>> GetFeaturedAsync(CancellationToken cancellationToken = default) =>
        ListProductsAsync(new ProductQueryFilters(), storefront: true, featuredOnly: true, newArrivalsOnly: false, cancellationToken);

    public Task<IReadOnlyList<ProductSummaryDto>> GetNewArrivalsAsync(CancellationToken cancellationToken = default) =>
        ListProductsAsync(new ProductQueryFilters(), storefront: true, featuredOnly: false, newArrivalsOnly: true, cancellationToken);

    public Task<IReadOnlyList<ProductSummaryDto>> SearchAsync(
        ProductQueryFilters filters,
        bool storefront,
        CancellationToken cancellationToken = default) =>
        ListProductsAsync(filters, storefront, featuredOnly: false, newArrivalsOnly: false, cancellationToken);

    public async Task<ServiceResult<ProductDetailsDto>> CreateAsync(
        CreateProductRequest request,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var validation = await ValidateWriteRequestAsync(
            request.CategoryId,
            request.NameAr,
            request.NameEn,
            request.SlugAr,
            request.SlugEn,
            request.Variants,
            excludeProductId: null,
            cancellationToken);
        if (validation != null)
            return validation;

        var now = DateTime.UtcNow;
        var product = new Product
        {
            CategoryId = request.CategoryId,
            Status = request.Status,
            CompareAtPrice = request.CompareAtPrice,
            IsFeatured = request.IsFeatured,
            IsNewArrival = request.IsNewArrival,
            PublishedAt = request.Status == ProductStatus.Active ? now : null,
            IsDeleted = false,
            CreatedAt = now,
            CreatedBy = userId,
            Translations = new List<ProductTranslation>
            {
                BuildTranslation("ar", request.NameAr, request.SlugAr, request.ShortDescriptionAr, request.DescriptionAr, request.MetaTitleAr, request.MetaDescriptionAr, now, userId),
                BuildTranslation("en", request.NameEn, request.SlugEn, request.ShortDescriptionEn, request.DescriptionEn, request.MetaTitleEn, request.MetaDescriptionEn, now, userId)
            }
        };

        ApplyDefaultVariantFlags(request.Variants);
        foreach (var variantInput in request.Variants)
        {
            product.Variants.Add(BuildVariant(variantInput, now, userId));
        }

        _context.Products.Add(product);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<ProductDetailsDto>.Fail("unique_constraint", "Slug or SKU must be unique.");
        }

        await SyncImagesAsync(product, request.Images, variantSkuMap: BuildVariantSkuMap(product.Variants), now, userId, cancellationToken);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<ProductDetailsDto>.Fail("unique_constraint", "Slug or SKU must be unique.");
        }

        var created = await BuildDetailsQuery(storefront: false)
            .FirstAsync(p => p.Id == product.Id, cancellationToken);

        await _catalogRealtime.NotifyProductChangedAsync("created", product.Id, product.CategoryId, cancellationToken);

        return ServiceResult<ProductDetailsDto>.Ok(MapToDetails(created, activeVariantsOnly: false));
    }

    public async Task<ServiceResult<ProductDetailsDto>> UpdateAsync(
        int id,
        UpdateProductRequest request,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .Include(p => p.Translations)
            .Include(p => p.Variants).ThenInclude(v => v.Inventory)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);

        if (product == null)
            return ServiceResult<ProductDetailsDto>.Fail("not_found", "Product not found.", StatusCodes.Status404NotFound);

        var validation = await ValidateWriteRequestAsync(
            request.CategoryId,
            request.NameAr,
            request.NameEn,
            request.SlugAr,
            request.SlugEn,
            request.Variants,
            excludeProductId: id,
            cancellationToken);
        if (validation != null)
            return validation;

        var now = DateTime.UtcNow;
        product.CategoryId = request.CategoryId;
        product.Status = request.Status;
        product.CompareAtPrice = request.CompareAtPrice;
        product.IsFeatured = request.IsFeatured;
        product.IsNewArrival = request.IsNewArrival;
        product.UpdatedAt = now;
        product.UpdatedBy = userId;

        if (request.Status == ProductStatus.Active && product.PublishedAt == null)
            product.PublishedAt = now;

        UpsertTranslation(product, "ar", request.NameAr, request.SlugAr, request.ShortDescriptionAr, request.DescriptionAr, request.MetaTitleAr, request.MetaDescriptionAr, now, userId);
        UpsertTranslation(product, "en", request.NameEn, request.SlugEn, request.ShortDescriptionEn, request.DescriptionEn, request.MetaTitleEn, request.MetaDescriptionEn, now, userId);

        ApplyDefaultVariantFlags(request.Variants);
        await SyncVariantsAsync(product, request.Variants, now, userId, cancellationToken);
        await SyncImagesAsync(product, request.Images, BuildVariantSkuMap(product.Variants), now, userId, cancellationToken);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<ProductDetailsDto>.Fail("unique_constraint", "Slug or SKU must be unique.");
        }

        var updated = await BuildDetailsQuery(storefront: false)
            .FirstAsync(p => p.Id == id, cancellationToken);

        await _catalogRealtime.NotifyProductChangedAsync("updated", id, product.CategoryId, cancellationToken);

        return ServiceResult<ProductDetailsDto>.Ok(MapToDetails(updated, activeVariantsOnly: false));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(int id, string? userId, CancellationToken cancellationToken = default)
    {
        var product = await _context.Products
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);

        if (product == null)
            return ServiceResult<bool>.Fail("not_found", "Product not found.", StatusCodes.Status404NotFound);

        var hasActiveOrders = await _context.OrderItems
            .Where(oi => oi.ProductId == id)
            .Join(
                _context.Orders,
                oi => oi.OrderId,
                o => o.Id,
                (oi, o) => o)
            .AnyAsync(o => !InactiveOrderStatuses.Contains(o.Status), cancellationToken);

        if (hasActiveOrders)
            return ServiceResult<bool>.Fail("has_active_orders", "Cannot delete a product that exists in active orders.");

        product.IsDeleted = true;
        product.Status = ProductStatus.Archived;
        product.UpdatedAt = DateTime.UtcNow;
        product.UpdatedBy = userId;

        await _context.SaveChangesAsync(cancellationToken);
        await _catalogRealtime.NotifyProductChangedAsync("deleted", id, product.CategoryId, cancellationToken);
        return ServiceResult<bool>.Ok(true);
    }

    private async Task<IReadOnlyList<ProductSummaryDto>> ListProductsAsync(
        ProductQueryFilters filters,
        bool storefront,
        bool featuredOnly,
        bool newArrivalsOnly,
        CancellationToken cancellationToken)
    {
        var query = BuildListQuery(storefront);
        query = ApplyFilters(query, filters);

        if (featuredOnly)
            query = query.Where(p => p.IsFeatured);

        if (newArrivalsOnly)
            query = query.Where(p => p.IsNewArrival);

        query = newArrivalsOnly
            ? query.OrderByDescending(p => p.CreatedAt)
            : query.OrderByDescending(p => p.PublishedAt ?? p.CreatedAt).ThenBy(p => p.Id);

        var products = await query.ToListAsync(cancellationToken);

        return products.Select(p => MapToSummary(p, activeVariantsOnly: storefront)).ToList();
    }

    private IQueryable<Product> BuildListQuery(bool storefront)
    {
        var query = _context.Products
            .AsNoTracking()
            .Include(p => p.Translations)
            .Include(p => p.Variants).ThenInclude(v => v.Inventory)
            .Include(p => p.Images)
            .Where(p => !p.IsDeleted);

        if (storefront)
            query = query.Where(p => p.Status == ProductStatus.Active);

        return query;
    }

    private IQueryable<Product> BuildDetailsQuery(bool storefront)
    {
        var query = _context.Products
            .AsNoTracking()
            .Include(p => p.Translations)
            .Include(p => p.Variants).ThenInclude(v => v.Inventory)
            .Include(p => p.Images)
            .Where(p => !p.IsDeleted);

        if (storefront)
            query = query.Where(p => p.Status == ProductStatus.Active);

        return query;
    }

    private static IQueryable<Product> ApplyFilters(IQueryable<Product> query, ProductQueryFilters filters)
    {
        if (filters.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filters.CategoryId.Value);

        if (filters.MinPrice.HasValue)
        {
            query = query.Where(p => p.Variants.Any(v =>
                v.Status == VariantStatus.Active && v.Price >= filters.MinPrice.Value));
        }

        if (filters.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Variants.Any(v =>
                v.Status == VariantStatus.Active && v.Price <= filters.MaxPrice.Value));
        }

        if (filters.InStock == true)
        {
            query = query.Where(p => p.Variants.Any(v =>
                v.Status == VariantStatus.Active &&
                v.Inventory != null &&
                v.Inventory.QuantityOnHand - v.Inventory.QuantityReserved > 0));
        }
        else if (filters.InStock == false)
        {
            query = query.Where(p => !p.Variants.Any(v =>
                v.Status == VariantStatus.Active &&
                v.Inventory != null &&
                v.Inventory.QuantityOnHand - v.Inventory.QuantityReserved > 0));
        }

        if (!string.IsNullOrWhiteSpace(filters.SearchTerm))
        {
            var term = filters.SearchTerm.Trim();
            query = query.Where(p => p.Translations.Any(t =>
                t.Name.Contains(term) ||
                (t.ShortDescription != null && t.ShortDescription.Contains(term)) ||
                (t.Description != null && t.Description.Contains(term))));
        }

        return query;
    }

    private async Task<ServiceResult<ProductDetailsDto>?> ValidateWriteRequestAsync(
        int categoryId,
        string nameAr,
        string nameEn,
        string slugAr,
        string slugEn,
        IReadOnlyList<ProductVariantInputDto> variants,
        int? excludeProductId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(nameAr))
            return ServiceResult<ProductDetailsDto>.Fail("name_ar_required", "Arabic name is required.");

        if (string.IsNullOrWhiteSpace(nameEn))
            return ServiceResult<ProductDetailsDto>.Fail("name_en_required", "English name is required.");

        if (string.IsNullOrWhiteSpace(slugAr))
            return ServiceResult<ProductDetailsDto>.Fail("slug_ar_required", "Arabic slug is required.");

        if (string.IsNullOrWhiteSpace(slugEn))
            return ServiceResult<ProductDetailsDto>.Fail("slug_en_required", "English slug is required.");

        if (variants == null || variants.Count == 0)
            return ServiceResult<ProductDetailsDto>.Fail("variants_required", "At least one variant is required.");

        var categoryExists = await _context.Categories
            .AnyAsync(c => c.Id == categoryId && !c.IsDeleted, cancellationToken);

        if (!categoryExists)
            return ServiceResult<ProductDetailsDto>.Fail("category_not_found", "Category not found.");

        var slugValidation = await ValidateSlugUniquenessAsync(slugAr, slugEn, excludeProductId, cancellationToken);
        if (slugValidation != null)
            return slugValidation;

        var skuValidation = await ValidateVariantInputsAsync(variants, cancellationToken);
        if (skuValidation != null)
            return skuValidation;

        return null;
    }

    /// <summary>
    /// Slugs must stay unique per language across all products forever (including soft-deleted) for SEO.
    /// </summary>
    private async Task<ServiceResult<ProductDetailsDto>?> ValidateSlugUniquenessAsync(
        string slugAr,
        string slugEn,
        int? excludeProductId,
        CancellationToken cancellationToken)
    {
        var normalizedSlugAr = NormalizeSlug(slugAr);
        var normalizedSlugEn = NormalizeSlug(slugEn);

        var slugQuery = _context.ProductTranslations.AsNoTracking().AsQueryable();
        if (excludeProductId.HasValue)
            slugQuery = slugQuery.Where(t => t.ProductId != excludeProductId.Value);

        var slugExists = await slugQuery.AnyAsync(
            t => (t.LanguageCode == "ar" && t.Slug == normalizedSlugAr) ||
                 (t.LanguageCode == "en" && t.Slug == normalizedSlugEn),
            cancellationToken);

        if (slugExists)
            return ServiceResult<ProductDetailsDto>.Fail("slug_exists", "Slug must be unique per language.");

        return null;
    }

    private async Task<ServiceResult<ProductDetailsDto>?> ValidateVariantInputsAsync(
        IReadOnlyList<ProductVariantInputDto> variants,
        CancellationToken cancellationToken)
    {
        var skuSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var variant in variants)
        {
            if (variant.Price <= 0)
                return ServiceResult<ProductDetailsDto>.Fail("invalid_price", "Variant price must be greater than zero.");

            if (variant.Quantity < 0)
                return ServiceResult<ProductDetailsDto>.Fail("invalid_quantity", "Variant quantity must be greater than or equal to zero.");

            var normalizedSku = variant.Sku.Trim();
            if (!skuSet.Add(normalizedSku))
                return ServiceResult<ProductDetailsDto>.Fail("duplicate_sku", "Duplicate SKU in request.");

            var skuExists = await _context.ProductVariants.AsNoTracking()
                .AnyAsync(v => v.Sku == normalizedSku && (!variant.Id.HasValue || v.Id != variant.Id.Value), cancellationToken);

            if (skuExists)
                return ServiceResult<ProductDetailsDto>.Fail("sku_exists", "SKU must be unique.");
        }

        return null;
    }

    private async Task SyncVariantsAsync(
        Product product,
        IReadOnlyList<ProductVariantInputDto> variantInputs,
        DateTime now,
        string? userId,
        CancellationToken cancellationToken)
    {
        var requestedIds = variantInputs.Where(v => v.Id.HasValue).Select(v => v.Id!.Value).ToHashSet();

        foreach (var existing in product.Variants.Where(v => !requestedIds.Contains(v.Id)).ToList())
        {
            existing.Status = VariantStatus.Inactive;
            existing.UpdatedAt = now;
            existing.UpdatedBy = userId;
        }

        foreach (var input in variantInputs)
        {
            if (input.Id.HasValue)
            {
                var variant = product.Variants.FirstOrDefault(v => v.Id == input.Id.Value);
                if (variant == null)
                    continue;

                variant.ColorNameAr = input.ColorNameAr.Trim();
                variant.ColorNameEn = input.ColorNameEn.Trim();
                variant.SizeNameAr = input.SizeNameAr?.Trim() ?? string.Empty;
                variant.SizeNameEn = input.SizeNameEn?.Trim() ?? string.Empty;
                variant.Sku = input.Sku.Trim();
                variant.Price = input.Price;
                variant.CompareAtPrice = input.CompareAtPrice;
                variant.Status = input.Status;
                variant.IsDefault = input.IsDefault;
                variant.UpdatedAt = now;
                variant.UpdatedBy = userId;

                if (variant.Inventory == null)
                {
                    variant.Inventory = new Inventory
                    {
                        QuantityOnHand = input.Quantity,
                        QuantityReserved = 0,
                        LowStockThreshold = input.LowStockThreshold,
                        CreatedAt = now,
                        CreatedBy = userId
                    };
                }
                else
                {
                    variant.Inventory.QuantityOnHand = input.Quantity;
                    variant.Inventory.LowStockThreshold = input.LowStockThreshold;
                    variant.Inventory.UpdatedAt = now;
                    variant.Inventory.UpdatedBy = userId;
                }
            }
            else
            {
                product.Variants.Add(BuildVariant(input, now, userId));
            }
        }

        await Task.CompletedTask;
    }

    private async Task SyncImagesAsync(
        Product product,
        IReadOnlyList<ProductImageInputDto> imageInputs,
        IReadOnlyDictionary<string, int> variantSkuMap,
        DateTime now,
        string? userId,
        CancellationToken cancellationToken)
    {
        var requestedIds = imageInputs.Where(i => i.Id.HasValue).Select(i => i.Id!.Value).ToHashSet();
        foreach (var image in product.Images.Where(i => !requestedIds.Contains(i.Id)).ToList())
        {
            _context.ProductImages.Remove(image);
        }

        foreach (var input in imageInputs)
        {
            var variantId = ResolveVariantId(input, variantSkuMap, product.Variants);

            if (input.Id.HasValue)
            {
                var image = product.Images.FirstOrDefault(i => i.Id == input.Id.Value);
                if (image == null)
                    continue;

                image.VariantId = variantId;
                image.ImageUrl = input.ImageUrl.Trim();
                image.ThumbnailUrl = NormalizeOptional(input.ThumbnailUrl);
                image.AltTextAr = NormalizeOptional(input.AltTextAr);
                image.AltTextEn = NormalizeOptional(input.AltTextEn);
                image.IsPrimary = input.IsPrimary;
                image.SortOrder = input.SortOrder;
                image.UpdatedAt = now;
                image.UpdatedBy = userId;
            }
            else
            {
                product.Images.Add(new ProductImage
                {
                    VariantId = variantId,
                    ImageUrl = input.ImageUrl.Trim(),
                    ThumbnailUrl = NormalizeOptional(input.ThumbnailUrl),
                    AltTextAr = NormalizeOptional(input.AltTextAr),
                    AltTextEn = NormalizeOptional(input.AltTextEn),
                    IsPrimary = input.IsPrimary,
                    SortOrder = input.SortOrder,
                    CreatedAt = now,
                    CreatedBy = userId
                });
            }
        }

        await Task.CompletedTask;
    }

    private static int? ResolveVariantId(
        ProductImageInputDto input,
        IReadOnlyDictionary<string, int> variantSkuMap,
        IEnumerable<ProductVariant> variants)
    {
        if (input.VariantId.HasValue)
            return input.VariantId;

        if (!string.IsNullOrWhiteSpace(input.VariantSku) &&
            variantSkuMap.TryGetValue(input.VariantSku.Trim(), out var variantId))
        {
            return variantId;
        }

        return null;
    }

    private static Dictionary<string, int> BuildVariantSkuMap(IEnumerable<ProductVariant> variants) =>
        variants.ToDictionary(v => v.Sku, v => v.Id, StringComparer.OrdinalIgnoreCase);

    private static ProductVariant BuildVariant(ProductVariantInputDto input, DateTime now, string? userId) =>
        new()
        {
            ColorNameAr = input.ColorNameAr.Trim(),
            ColorNameEn = input.ColorNameEn.Trim(),
            SizeNameAr = input.SizeNameAr?.Trim() ?? string.Empty,
            SizeNameEn = input.SizeNameEn?.Trim() ?? string.Empty,
            Sku = input.Sku.Trim(),
            Price = input.Price,
            CompareAtPrice = input.CompareAtPrice,
            Status = input.Status,
            IsDefault = input.IsDefault,
            CreatedAt = now,
            CreatedBy = userId,
            Inventory = new Inventory
            {
                QuantityOnHand = input.Quantity,
                QuantityReserved = 0,
                LowStockThreshold = input.LowStockThreshold,
                CreatedAt = now,
                CreatedBy = userId
            }
        };

    private static void ApplyDefaultVariantFlags(IList<ProductVariantInputDto> variants)
    {
        if (variants.Count == 0)
            return;

        var defaultIndex = -1;
        for (var i = 0; i < variants.Count; i++)
        {
            if (variants[i].IsDefault)
            {
                defaultIndex = i;
                break;
            }
        }

        if (defaultIndex < 0)
            defaultIndex = 0;

        for (var i = 0; i < variants.Count; i++)
            variants[i].IsDefault = i == defaultIndex;
    }

    private static ProductTranslation BuildTranslation(
        string languageCode,
        string name,
        string slug,
        string? shortDescription,
        string? description,
        string? metaTitle,
        string? metaDescription,
        DateTime createdAt,
        string? userId) =>
        new()
        {
            LanguageCode = languageCode,
            Name = name.Trim(),
            Slug = NormalizeSlug(slug),
            ShortDescription = NormalizeOptional(shortDescription),
            Description = NormalizeOptional(description),
            MetaTitle = NormalizeOptional(metaTitle),
            MetaDescription = NormalizeOptional(metaDescription),
            CreatedAt = createdAt,
            CreatedBy = userId
        };

    private static void UpsertTranslation(
        Product product,
        string languageCode,
        string name,
        string slug,
        string? shortDescription,
        string? description,
        string? metaTitle,
        string? metaDescription,
        DateTime updatedAt,
        string? userId)
    {
        var translation = product.Translations.FirstOrDefault(t => t.LanguageCode == languageCode);
        if (translation == null)
        {
            product.Translations.Add(BuildTranslation(languageCode, name, slug, shortDescription, description, metaTitle, metaDescription, updatedAt, userId));
            return;
        }

        translation.Name = name.Trim();
        translation.Slug = NormalizeSlug(slug);
        translation.ShortDescription = NormalizeOptional(shortDescription);
        translation.Description = NormalizeOptional(description);
        translation.MetaTitle = NormalizeOptional(metaTitle);
        translation.MetaDescription = NormalizeOptional(metaDescription);
        translation.UpdatedAt = updatedAt;
        translation.UpdatedBy = userId;
    }

    private static ProductSummaryDto MapToSummary(Product product, bool activeVariantsOnly)
    {
        var variants = GetVariantsForPricing(product, activeVariantsOnly);
        var stock = CalculateStock(variants);
        var prices = variants.Select(v => v.Price).ToList();
        var primaryImage = product.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .FirstOrDefault();

        return new ProductSummaryDto
        {
            Id = product.Id,
            CategoryId = product.CategoryId,
            Status = product.Status,
            CompareAtPrice = product.CompareAtPrice,
            IsFeatured = product.IsFeatured,
            IsNewArrival = product.IsNewArrival,
            AverageRating = product.AverageRating,
            ReviewCount = product.ReviewCount,
            VerifiedReviewCount = product.VerifiedReviewCount,
            PublishedAt = product.PublishedAt,
            Arabic = MapTranslation(product.Translations.FirstOrDefault(t => t.LanguageCode == "ar")),
            English = MapTranslation(product.Translations.FirstOrDefault(t => t.LanguageCode == "en")),
            PrimaryImageUrl = !string.IsNullOrWhiteSpace(primaryImage?.ThumbnailUrl)
                ? primaryImage!.ThumbnailUrl
                : primaryImage?.ImageUrl,
            LowestPrice = prices.Count == 0 ? null : prices.Min(),
            HighestPrice = prices.Count == 0 ? null : prices.Max(),
            TotalStock = stock.TotalStock,
            IsInStock = stock.IsInStock
        };
    }

    private static ProductDetailsDto MapToDetails(Product product, bool activeVariantsOnly)
    {
        var summary = MapToSummary(product, activeVariantsOnly);
        var variants = activeVariantsOnly
            ? product.Variants.Where(v => v.Status == VariantStatus.Active).ToList()
            : product.Variants.ToList();

        return new ProductDetailsDto
        {
            Id = summary.Id,
            CategoryId = summary.CategoryId,
            Status = summary.Status,
            CompareAtPrice = summary.CompareAtPrice,
            IsFeatured = summary.IsFeatured,
            IsNewArrival = summary.IsNewArrival,
            AverageRating = summary.AverageRating,
            ReviewCount = summary.ReviewCount,
            VerifiedReviewCount = summary.VerifiedReviewCount,
            PublishedAt = summary.PublishedAt,
            Arabic = summary.Arabic,
            English = summary.English,
            PrimaryImageUrl = summary.PrimaryImageUrl,
            LowestPrice = summary.LowestPrice,
            HighestPrice = summary.HighestPrice,
            TotalStock = summary.TotalStock,
            IsInStock = summary.IsInStock,
            IsDeleted = product.IsDeleted,
            TotalSold = product.TotalSold,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            Images = product.Images
                .OrderByDescending(i => i.IsPrimary)
                .ThenBy(i => i.SortOrder)
                .Select(MapImage)
                .ToList(),
            Variants = variants
                .OrderByDescending(v => v.IsDefault)
                .ThenBy(v => v.Id)
                .Select(MapVariant)
                .ToList()
        };
    }

    private static List<ProductVariant> GetVariantsForPricing(Product product, bool activeVariantsOnly) =>
        activeVariantsOnly
            ? product.Variants.Where(v => v.Status == VariantStatus.Active).ToList()
            : product.Variants.ToList();

    private static (int TotalStock, bool IsInStock) CalculateStock(IEnumerable<ProductVariant> variants)
    {
        var total = variants.Sum(v =>
        {
            if (v.Inventory == null)
                return 0;

            return Math.Max(0, v.Inventory.QuantityOnHand - v.Inventory.QuantityReserved);
        });

        return (total, total > 0);
    }

    private static ProductTranslationDto? MapTranslation(ProductTranslation? translation) =>
        translation == null
            ? null
            : new ProductTranslationDto
            {
                LanguageCode = translation.LanguageCode,
                Name = translation.Name,
                ShortDescription = translation.ShortDescription,
                Description = translation.Description,
                Slug = translation.Slug,
                MetaTitle = translation.MetaTitle,
                MetaDescription = translation.MetaDescription
            };

    private static ProductVariantDto MapVariant(ProductVariant variant)
    {
        var available = variant.Inventory == null
            ? 0
            : Math.Max(0, variant.Inventory.QuantityOnHand - variant.Inventory.QuantityReserved);

        return new ProductVariantDto
        {
            Id = variant.Id,
            ColorNameAr = variant.ColorNameAr,
            ColorNameEn = variant.ColorNameEn,
            SizeNameAr = variant.SizeNameAr,
            SizeNameEn = variant.SizeNameEn,
            Sku = variant.Sku,
            Price = variant.Price,
            CompareAtPrice = variant.CompareAtPrice,
            Status = variant.Status,
            IsDefault = variant.IsDefault,
            QuantityOnHand = variant.Inventory?.QuantityOnHand ?? 0,
            QuantityReserved = variant.Inventory?.QuantityReserved ?? 0,
            AvailableStock = available,
            LowStockThreshold = variant.Inventory?.LowStockThreshold ?? 0,
            IsInStock = available > 0
        };
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

    private static string NormalizeSlug(string slug) => slug.Trim().ToLowerInvariant();

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        for (Exception? e = ex; e != null; e = e.InnerException)
        {
            if (e is SqlException sql && (sql.Number == 2601 || sql.Number == 2627))
                return true;
        }

        return false;
    }
}
