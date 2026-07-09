using System.ComponentModel.DataAnnotations;
using CairoBags.Models.Catalog;

namespace CairoBags.Dto.Catalog;

public class ProductTranslationDto
{
    public string LanguageCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? Description { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
}

public class ProductImageDto
{
    public int Id { get; set; }
    public int? VariantId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? AltTextAr { get; set; }
    public string? AltTextEn { get; set; }
    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }
}

public class ProductVariantDto
{
    public int Id { get; set; }
    public string ColorNameAr { get; set; } = string.Empty;
    public string ColorNameEn { get; set; } = string.Empty;
    public string SizeNameAr { get; set; } = string.Empty;
    public string SizeNameEn { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public VariantStatus Status { get; set; }
    public bool IsDefault { get; set; }
    public int QuantityOnHand { get; set; }
    public int QuantityReserved { get; set; }
    public int AvailableStock { get; set; }
    public int LowStockThreshold { get; set; }
    public bool IsInStock { get; set; }
}

public class ProductSummaryDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public ProductStatus Status { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsNewArrival { get; set; }
    public decimal AverageRating { get; set; }
    public int ReviewCount { get; set; }
    public int VerifiedReviewCount { get; set; }
    public DateTime? PublishedAt { get; set; }
    public ProductTranslationDto? Arabic { get; set; }
    public ProductTranslationDto? English { get; set; }
    public string? PrimaryImageUrl { get; set; }
    public decimal? LowestPrice { get; set; }
    public decimal? HighestPrice { get; set; }
    public int TotalStock { get; set; }
    public bool IsInStock { get; set; }
}

public class ProductDetailsDto : ProductSummaryDto
{
    public bool IsDeleted { get; set; }
    public int TotalSold { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ProductImageDto> Images { get; set; } = new();
    public List<ProductVariantDto> Variants { get; set; } = new();
}

public class ProductQueryFilters
{
    public int? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? InStock { get; set; }

    public string? SearchTerm { get; set; }

    public string? Color { get; set; }
}

public class ProductFilterColorOptionDto
{
    public string Name { get; set; } = string.Empty;

    public string? NameAr { get; set; }

    public string Hex { get; set; } = string.Empty;

    public int Count { get; set; }

    public int InStockCount { get; set; }
}

public class ProductFilterOptionsDto
{
    public List<ProductFilterColorOptionDto> Colors { get; set; } = new();
}

public class ProductVariantInputDto
{
    public int? Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string ColorNameAr { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ColorNameEn { get; set; } = string.Empty;

    [MaxLength(100)]
    public string SizeNameAr { get; set; } = string.Empty;

    [MaxLength(100)]
    public string SizeNameEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string Sku { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public decimal? CompareAtPrice { get; set; }

    public VariantStatus Status { get; set; } = VariantStatus.Active;

    public bool IsDefault { get; set; }

    public int Quantity { get; set; }

    public int LowStockThreshold { get; set; }
}

public class ProductImageInputDto
{
    public int? Id { get; set; }
    public int? VariantId { get; set; }

    [MaxLength(64)]
    public string? VariantSku { get; set; }

    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ThumbnailUrl { get; set; }

    [MaxLength(200)]
    public string? AltTextAr { get; set; }

    [MaxLength(200)]
    public string? AltTextEn { get; set; }

    public bool IsPrimary { get; set; }

    public int SortOrder { get; set; }
}

public class CreateProductRequest
{
    public int CategoryId { get; set; }

    public ProductStatus Status { get; set; } = ProductStatus.Draft;

    public decimal? CompareAtPrice { get; set; }

    public bool IsFeatured { get; set; }

    public bool IsNewArrival { get; set; }

    [Required]
    [MaxLength(300)]
    public string NameAr { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string SlugAr { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string SlugEn { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ShortDescriptionAr { get; set; }

    [MaxLength(500)]
    public string? ShortDescriptionEn { get; set; }

    public string? DescriptionAr { get; set; }

    public string? DescriptionEn { get; set; }

    [MaxLength(200)]
    public string? MetaTitleAr { get; set; }

    [MaxLength(200)]
    public string? MetaTitleEn { get; set; }

    [MaxLength(500)]
    public string? MetaDescriptionAr { get; set; }

    [MaxLength(500)]
    public string? MetaDescriptionEn { get; set; }

    [MinLength(1)]
    public List<ProductVariantInputDto> Variants { get; set; } = new();

    public List<ProductImageInputDto> Images { get; set; } = new();
}

public class UpdateProductRequest
{
    public int CategoryId { get; set; }

    public ProductStatus Status { get; set; } = ProductStatus.Draft;

    public decimal? CompareAtPrice { get; set; }

    public bool IsFeatured { get; set; }

    public bool IsNewArrival { get; set; }

    [Required]
    [MaxLength(300)]
    public string NameAr { get; set; } = string.Empty;

    [Required]
    [MaxLength(300)]
    public string NameEn { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string SlugAr { get; set; } = string.Empty;

    [Required]
    [MaxLength(250)]
    public string SlugEn { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? ShortDescriptionAr { get; set; }

    [MaxLength(500)]
    public string? ShortDescriptionEn { get; set; }

    public string? DescriptionAr { get; set; }

    public string? DescriptionEn { get; set; }

    [MaxLength(200)]
    public string? MetaTitleAr { get; set; }

    [MaxLength(200)]
    public string? MetaTitleEn { get; set; }

    [MaxLength(500)]
    public string? MetaDescriptionAr { get; set; }

    [MaxLength(500)]
    public string? MetaDescriptionEn { get; set; }

    [MinLength(1)]
    public List<ProductVariantInputDto> Variants { get; set; } = new();

    public List<ProductImageInputDto> Images { get; set; } = new();
}
