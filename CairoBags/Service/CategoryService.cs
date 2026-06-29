using CairoBags.Data;
using CairoBags.Dto.Catalog;
using CairoBags.Dto.Store;
using CairoBags.Hubs;
using CairoBags.Models.Catalog;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

public class CategoryService : ICategoryService
{
    private readonly CairoBagsContext _context;
    private readonly IStoreUpdateBroadcastService _storeBroadcast;

    public CategoryService(CairoBagsContext context, IStoreUpdateBroadcastService storeBroadcast)
    {
        _context = context;
        _storeBroadcast = storeBroadcast;
    }

    public async Task<IReadOnlyList<CategoryDto>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var categories = await QueryCategories(includeInactive: false)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Id)
            .ToListAsync(cancellationToken);

        return categories.Select(MapToDto).ToList();
    }

    public async Task<IReadOnlyList<CategoryDto>> GetAllCategoriesAsync(CancellationToken cancellationToken = default)
    {
        var categories = await QueryCategories(includeInactive: true)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Id)
            .ToListAsync(cancellationToken);

        return categories.Select(MapToDto).ToList();
    }

    public async Task<IReadOnlyList<CategoryTreeNodeDto>> GetActiveCategoryTreeAsync(CancellationToken cancellationToken = default)
    {
        var categories = await QueryCategories(includeInactive: false)
            .OrderBy(c => c.SortOrder)
            .ThenBy(c => c.Id)
            .ToListAsync(cancellationToken);

        return BuildTree(categories, parentId: null);
    }

    public async Task<CategoryDto?> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default)
    {
        var category = await QueryCategories(includeInactive)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        return category == null ? null : MapToDto(category);
    }

    public async Task<CategoryDto?> GetBySlugAsync(string slug, bool includeInactive, CancellationToken cancellationToken = default)
    {
        var normalized = NormalizeSlug(slug);
        if (string.IsNullOrEmpty(normalized))
            return null;

        var categoryId = await _context.CategoryTranslations
            .AsNoTracking()
            .Where(t => t.Slug == normalized)
            .Select(t => (int?)t.CategoryId)
            .FirstOrDefaultAsync(cancellationToken);

        if (categoryId == null)
            return null;

        return await GetByIdAsync(categoryId.Value, includeInactive, cancellationToken);
    }

    public async Task<ServiceResult<CategoryDto>> CreateAsync(
        CreateCategoryRequest request,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var validation = ValidateTranslations(request.NameAr, request.NameEn, request.SlugAr, request.SlugEn);
        if (validation != null)
            return validation;

        var slugValidation = await ValidateSlugUniquenessAsync(
            request.SlugAr,
            request.SlugEn,
            excludeCategoryId: null,
            cancellationToken);
        if (slugValidation != null)
            return slugValidation;

        var parentValidation = await ValidateParentCategoryAsync(
            request.ParentCategoryId,
            categoryId: null,
            cancellationToken);
        if (parentValidation != null)
            return parentValidation;

        var now = DateTime.UtcNow;
        var category = new Category
        {
            ParentCategoryId = request.ParentCategoryId,
            ImageUrl = NormalizeOptional(request.ImageUrl),
            SortOrder = request.SortOrder,
            IsActive = request.IsActive,
            IsDeleted = false,
            CreatedAt = now,
            CreatedBy = userId,
            Translations = new List<CategoryTranslation>
            {
                BuildTranslation("ar", request.NameAr, request.SlugAr, request.DescriptionAr, request.MetaTitleAr, request.MetaDescriptionAr, now, userId),
                BuildTranslation("en", request.NameEn, request.SlugEn, request.DescriptionEn, request.MetaTitleEn, request.MetaDescriptionEn, now, userId)
            }
        };

        _context.Categories.Add(category);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<CategoryDto>.Fail("slug_exists", "Slug must be unique per language.");
        }

        var created = await QueryCategories(includeInactive: true)
            .FirstAsync(c => c.Id == category.Id, cancellationToken);

        await _storeBroadcast.BroadcastStorefrontAsync(
            StoreUpdateEvents.CategoryCreated,
            new StoreUpdatePayloadDto
            {
                EntityId = created.Id,
                CategoryId = created.Id,
                IsActive = created.IsActive,
            },
            cancellationToken);

        return ServiceResult<CategoryDto>.Ok(MapToDto(created));
    }

    public async Task<ServiceResult<CategoryDto>> UpdateAsync(
        int id,
        UpdateCategoryRequest request,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories
            .Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, cancellationToken);

        if (category == null)
            return ServiceResult<CategoryDto>.Fail("not_found", "Category not found.", StatusCodes.Status404NotFound);

        var validation = ValidateTranslations(request.NameAr, request.NameEn, request.SlugAr, request.SlugEn);
        if (validation != null)
            return validation;

        var slugValidation = await ValidateSlugUniquenessAsync(
            request.SlugAr,
            request.SlugEn,
            excludeCategoryId: id,
            cancellationToken);
        if (slugValidation != null)
            return slugValidation;

        var parentValidation = await ValidateParentCategoryAsync(
            request.ParentCategoryId,
            categoryId: id,
            cancellationToken);
        if (parentValidation != null)
            return parentValidation;

        var now = DateTime.UtcNow;
        category.ParentCategoryId = request.ParentCategoryId;
        category.ImageUrl = NormalizeOptional(request.ImageUrl);
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
        category.UpdatedAt = now;
        category.UpdatedBy = userId;

        UpsertTranslation(category, "ar", request.NameAr, request.SlugAr, request.DescriptionAr, request.MetaTitleAr, request.MetaDescriptionAr, now, userId);
        UpsertTranslation(category, "en", request.NameEn, request.SlugEn, request.DescriptionEn, request.MetaTitleEn, request.MetaDescriptionEn, now, userId);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            return ServiceResult<CategoryDto>.Fail("slug_exists", "Slug must be unique per language.");
        }

        var updated = await QueryCategories(includeInactive: true)
            .FirstAsync(c => c.Id == id, cancellationToken);

        await _storeBroadcast.BroadcastStorefrontAsync(
            StoreUpdateEvents.CategoryUpdated,
            new StoreUpdatePayloadDto
            {
                EntityId = updated.Id,
                CategoryId = updated.Id,
                IsActive = updated.IsActive,
            },
            cancellationToken);

        return ServiceResult<CategoryDto>.Ok(MapToDto(updated));
    }

    public async Task<ServiceResult<bool>> DeleteAsync(int id, string? userId, CancellationToken cancellationToken = default)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, cancellationToken);

        if (category == null)
            return ServiceResult<bool>.Fail("not_found", "Category not found.", StatusCodes.Status404NotFound);

        var hasProducts = await _context.Products
            .AnyAsync(p => p.CategoryId == id && !p.IsDeleted, cancellationToken);

        if (hasProducts)
            return ServiceResult<bool>.Fail("has_products", "Cannot delete a category that has products.");

        var hasSubCategories = await _context.Categories
            .AnyAsync(c => c.ParentCategoryId == id && !c.IsDeleted, cancellationToken);

        if (hasSubCategories)
            return ServiceResult<bool>.Fail("has_subcategories", "Cannot delete a category that has subcategories.");

        category.IsDeleted = true;
        category.IsActive = false;
        category.UpdatedAt = DateTime.UtcNow;
        category.UpdatedBy = userId;

        await _context.SaveChangesAsync(cancellationToken);

        await _storeBroadcast.BroadcastStorefrontAsync(
            StoreUpdateEvents.CategoryDeleted,
            new StoreUpdatePayloadDto
            {
                EntityId = id,
                CategoryId = id,
            },
            cancellationToken);

        return ServiceResult<bool>.Ok(true);
    }

    private IQueryable<Category> QueryCategories(bool includeInactive)
    {
        var query = _context.Categories
            .AsNoTracking()
            .Include(c => c.Translations)
            .Where(c => !c.IsDeleted);

        if (!includeInactive)
            query = query.Where(c => c.IsActive);

        return query;
    }

    private static ServiceResult<CategoryDto>? ValidateTranslations(
        string nameAr,
        string nameEn,
        string slugAr,
        string slugEn)
    {
        if (string.IsNullOrWhiteSpace(nameAr))
            return ServiceResult<CategoryDto>.Fail("name_ar_required", "Arabic name is required.");

        if (string.IsNullOrWhiteSpace(nameEn))
            return ServiceResult<CategoryDto>.Fail("name_en_required", "English name is required.");

        if (string.IsNullOrWhiteSpace(slugAr))
            return ServiceResult<CategoryDto>.Fail("slug_ar_required", "Arabic slug is required.");

        if (string.IsNullOrWhiteSpace(slugEn))
            return ServiceResult<CategoryDto>.Fail("slug_en_required", "English slug is required.");

        return null;
    }

    /// <summary>
    /// Slugs must stay unique per language across all categories forever (including soft-deleted) for SEO.
    /// No IsDeleted filter — translation rows are retained on soft delete.
    /// </summary>
    private async Task<ServiceResult<CategoryDto>?> ValidateSlugUniquenessAsync(
        string slugAr,
        string slugEn,
        int? excludeCategoryId,
        CancellationToken cancellationToken)
    {
        var normalizedSlugAr = NormalizeSlug(slugAr);
        var normalizedSlugEn = NormalizeSlug(slugEn);

        var slugQuery = _context.CategoryTranslations.AsNoTracking().AsQueryable();

        if (excludeCategoryId.HasValue)
        {
            slugQuery = slugQuery.Where(t => t.CategoryId != excludeCategoryId.Value);
        }

        var slugExists = await slugQuery.AnyAsync(
            t => (t.LanguageCode == "ar" && t.Slug == normalizedSlugAr) ||
                 (t.LanguageCode == "en" && t.Slug == normalizedSlugEn),
            cancellationToken);

        if (slugExists)
            return ServiceResult<CategoryDto>.Fail("slug_exists", "Slug must be unique per language.");

        return null;
    }

    private async Task<ServiceResult<CategoryDto>?> ValidateParentCategoryAsync(
        int? parentCategoryId,
        int? categoryId,
        CancellationToken cancellationToken)
    {
        if (!parentCategoryId.HasValue)
            return null;

        if (categoryId.HasValue && parentCategoryId.Value == categoryId.Value)
            return ServiceResult<CategoryDto>.Fail("invalid_parent", "A category cannot be its own parent.");

        var parentExists = await _context.Categories
            .AnyAsync(c => c.Id == parentCategoryId.Value && !c.IsDeleted, cancellationToken);

        if (!parentExists)
            return ServiceResult<CategoryDto>.Fail("invalid_parent", "Parent category not found.");

        if (categoryId.HasValue)
        {
            var descendantIds = await GetDescendantIdsAsync(categoryId.Value, cancellationToken);
            if (descendantIds.Contains(parentCategoryId.Value))
                return ServiceResult<CategoryDto>.Fail("invalid_parent", "A category cannot be moved under one of its descendants.");
        }

        return null;
    }

    private async Task<HashSet<int>> GetDescendantIdsAsync(int categoryId, CancellationToken cancellationToken)
    {
        var allCategories = await _context.Categories
            .AsNoTracking()
            .Where(c => !c.IsDeleted)
            .Select(c => new { c.Id, c.ParentCategoryId })
            .ToListAsync(cancellationToken);

        var lookup = allCategories
            .Where(c => c.ParentCategoryId.HasValue)
            .GroupBy(c => c.ParentCategoryId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Id).ToList());

        var result = new HashSet<int>();
        var stack = new Stack<int>();

        if (lookup.TryGetValue(categoryId, out var children))
        {
            foreach (var childId in children)
                stack.Push(childId);
        }

        while (stack.Count > 0)
        {
            var current = stack.Pop();
            if (!result.Add(current))
                continue;

            if (lookup.TryGetValue(current, out var nextChildren))
            {
                foreach (var childId in nextChildren)
                    stack.Push(childId);
            }
        }

        return result;
    }

    private static CategoryTranslation BuildTranslation(
        string languageCode,
        string name,
        string slug,
        string? description,
        string? metaTitle,
        string? metaDescription,
        DateTime createdAt,
        string? userId)
    {
        return new CategoryTranslation
        {
            LanguageCode = languageCode,
            Name = name.Trim(),
            Slug = NormalizeSlug(slug),
            Description = NormalizeOptional(description),
            MetaTitle = NormalizeOptional(metaTitle),
            MetaDescription = NormalizeOptional(metaDescription),
            CreatedAt = createdAt,
            CreatedBy = userId
        };
    }

    private static void UpsertTranslation(
        Category category,
        string languageCode,
        string name,
        string slug,
        string? description,
        string? metaTitle,
        string? metaDescription,
        DateTime updatedAt,
        string? userId)
    {
        var translation = category.Translations.FirstOrDefault(t => t.LanguageCode == languageCode);
        if (translation == null)
        {
            category.Translations.Add(BuildTranslation(languageCode, name, slug, description, metaTitle, metaDescription, updatedAt, userId));
            return;
        }

        translation.Name = name.Trim();
        translation.Slug = NormalizeSlug(slug);
        translation.Description = NormalizeOptional(description);
        translation.MetaTitle = NormalizeOptional(metaTitle);
        translation.MetaDescription = NormalizeOptional(metaDescription);
        translation.UpdatedAt = updatedAt;
        translation.UpdatedBy = userId;
    }

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

    private static CategoryDto MapToDto(Category category)
    {
        var arabic = category.Translations.FirstOrDefault(t => t.LanguageCode == "ar");
        var english = category.Translations.FirstOrDefault(t => t.LanguageCode == "en");

        return new CategoryDto
        {
            Id = category.Id,
            ParentCategoryId = category.ParentCategoryId,
            ImageUrl = category.ImageUrl,
            SortOrder = category.SortOrder,
            IsActive = category.IsActive,
            IsDeleted = category.IsDeleted,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt,
            Arabic = arabic == null ? null : MapTranslation(arabic),
            English = english == null ? null : MapTranslation(english)
        };
    }

    private static CategoryTranslationDto MapTranslation(CategoryTranslation translation) =>
        new()
        {
            LanguageCode = translation.LanguageCode,
            Name = translation.Name,
            Description = translation.Description,
            Slug = translation.Slug,
            MetaTitle = translation.MetaTitle,
            MetaDescription = translation.MetaDescription
        };

    private static List<CategoryTreeNodeDto> BuildTree(IReadOnlyList<Category> categories, int? parentId)
    {
        return categories
            .Where(c => c.ParentCategoryId == parentId)
            .Select(c =>
            {
                var arabic = c.Translations.FirstOrDefault(t => t.LanguageCode == "ar");
                var english = c.Translations.FirstOrDefault(t => t.LanguageCode == "en");

                return new CategoryTreeNodeDto
                {
                    Id = c.Id,
                    ParentCategoryId = c.ParentCategoryId,
                    ImageUrl = c.ImageUrl,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive,
                    Arabic = arabic == null ? null : MapTranslation(arabic),
                    English = english == null ? null : MapTranslation(english),
                    Children = BuildTree(categories, c.Id)
                };
            })
            .ToList();
    }
}
