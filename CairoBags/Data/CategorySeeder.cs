using CairoBags.Models.Catalog;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Data;

/// <summary>
/// Idempotent startup seeder for the five default storefront categories.
/// Inserts missing categories by English slug; never updates or deletes existing rows.
/// </summary>
public static class CategorySeeder
{
    private sealed record DefaultCategory(
        string Slug,
        int SortOrder,
        string NameEn,
        string NameAr,
        string DescriptionEn,
        string DescriptionAr,
        string ImageFileName);

    private static readonly DefaultCategory[] Defaults =
    {
        new(
            Slug: "backpacks",
            SortOrder: 1,
            NameEn: "Backpacks",
            NameAr: "حقائب الظهر",
            DescriptionEn: "Daily comfort",
            DescriptionAr: "راحة يومية",
            ImageFileName: "backpacks.png"),
        new(
            Slug: "hand-bags",
            SortOrder: 2,
            NameEn: "Hand Bags",
            NameAr: "حقائب يد",
            DescriptionEn: "Single-handle daily carry",
            DescriptionAr: "مقبض واحد للحمل اليومي",
            ImageFileName: "hand-bags.png"),
        new(
            Slug: "laptop-bags",
            SortOrder: 3,
            NameEn: "Laptop Bags",
            NameAr: "حقائب اللابتوب",
            DescriptionEn: "Smart elegance",
            DescriptionAr: "أناقة عملية",
            ImageFileName: "laptop-bags.png"),
        new(
            Slug: "crossbody",
            SortOrder: 4,
            NameEn: "Crossbody",
            NameAr: "حقائب كروس",
            DescriptionEn: "Light & chic",
            DescriptionAr: "خفيفة وأنيقة",
            ImageFileName: "crossbody.png"),
        new(
            Slug: "travel-sets",
            SortOrder: 5,
            NameEn: "Travel Sets",
            NameAr: "أطقم السفر",
            DescriptionEn: "Complete sets",
            DescriptionAr: "مجموعات كاملة",
            ImageFileName: "travel-sets.png"),
    };

    public static async Task SeedAsync(
        CairoBagsContext context,
        IWebHostEnvironment environment,
        IConfiguration configuration,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        var storageFolder = configuration["FileStorage:Path"] ?? "FileStorage";
        var storageRoot = Path.Combine(environment.ContentRootPath, storageFolder);
        var categoriesStorageDir = Path.Combine(storageRoot, "categories");
        Directory.CreateDirectory(categoriesStorageDir);

        var added = 0;

        foreach (var def in Defaults)
        {
            var slug = def.Slug.Trim().ToLowerInvariant();

            var alreadyExists = await context.Categories
                .AsNoTracking()
                .AnyAsync(
                    c => !c.IsDeleted && c.Translations.Any(t => t.Slug == slug),
                    cancellationToken);

            if (alreadyExists)
                continue;

            var imageUrl = EnsureCategoryImage(environment, categoriesStorageDir, storageFolder, def.ImageFileName, logger);

            var now = DateTime.UtcNow;
            var category = new Category
            {
                ParentCategoryId = null,
                ImageUrl = imageUrl,
                SortOrder = def.SortOrder,
                IsActive = true,
                IsDeleted = false,
                CreatedAt = now,
                CreatedBy = "system-seed",
                Translations = new List<CategoryTranslation>
                {
                    BuildTranslation("en", def.NameEn, slug, def.DescriptionEn, now),
                    BuildTranslation("ar", def.NameAr, slug, def.DescriptionAr, now),
                }
            };

            context.Categories.Add(category);
            added++;
            logger.LogInformation("Category seed: inserting default category '{Slug}' ({NameEn}).", slug, def.NameEn);
        }

        if (added == 0)
        {
            logger.LogInformation("Category seed: all default categories already present.");
            return;
        }

        await context.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Category seed: inserted {Count} default categor(y/ies).", added);
    }

    private static CategoryTranslation BuildTranslation(
        string languageCode,
        string name,
        string slug,
        string description,
        DateTime now) =>
        new()
        {
            LanguageCode = languageCode,
            Name = name,
            Slug = slug,
            Description = description,
            MetaTitle = name,
            MetaDescription = description,
            CreatedAt = now,
            CreatedBy = "system-seed",
        };

    /// <summary>
    /// Copy seed asset into FileStorage/categories if missing; return public path or null.
    /// </summary>
    private static string? EnsureCategoryImage(
        IWebHostEnvironment environment,
        string categoriesStorageDir,
        string storageFolder,
        string fileName,
        ILogger logger)
    {
        var destinationPath = Path.Combine(categoriesStorageDir, fileName);
        var publicPath = $"/{storageFolder.Trim('/')}/categories/{fileName}";

        if (File.Exists(destinationPath))
            return publicPath;

        var seedPath = Path.Combine(environment.ContentRootPath, "SeedAssets", "categories", fileName);
        if (!File.Exists(seedPath))
        {
            // Dev fallback: frontend collection cutouts
            var frontendFallback = Path.GetFullPath(Path.Combine(
                environment.ContentRootPath,
                "..",
                "cairo-bags-web",
                "src",
                "assets",
                "hero",
                "collections",
                MapFrontendFileName(fileName)));

            if (File.Exists(frontendFallback))
                seedPath = frontendFallback;
        }

        if (!File.Exists(seedPath))
        {
            logger.LogWarning("Category seed: image asset not found for {FileName}.", fileName);
            return null;
        }

        File.Copy(seedPath, destinationPath, overwrite: false);
        return publicPath;
    }

    private static string MapFrontendFileName(string seededFileName) =>
        seededFileName switch
        {
            "backpacks.png" => "backpack.png",
            "hand-bags.png" => "handbag.png",
            "laptop-bags.png" => "laptop-bag.png",
            "crossbody.png" => "crossbody.png",
            "travel-sets.png" => "travel-set.png",
            _ => seededFileName
        };
}
