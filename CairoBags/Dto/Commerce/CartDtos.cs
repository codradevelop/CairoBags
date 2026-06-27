using System.ComponentModel.DataAnnotations;

namespace CairoBags.Dto.Commerce;

public class CartDto
{
    public int? CartId { get; set; }

    public string? SessionId { get; set; }

    public DateTime? LastActivityAt { get; set; }

    public int ItemsCount { get; set; }

    public decimal SubTotal { get; set; }

    public List<CartItemDto> Items { get; set; } = new();
}

public class CartItemDto
{
    public int ProductId { get; set; }

    public int VariantId { get; set; }

    public string ProductNameAr { get; set; } = string.Empty;

    public string ProductNameEn { get; set; } = string.Empty;

    public string ProductSlugAr { get; set; } = string.Empty;

    public string ProductSlugEn { get; set; } = string.Empty;

    public string ColorNameAr { get; set; } = string.Empty;

    public string ColorNameEn { get; set; } = string.Empty;

    public string? ImageUrl { get; set; }

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal LineTotal { get; set; }

    public int AvailableStock { get; set; }

    public bool StockChanged { get; set; }

    public int MaxAllowedQuantity { get; set; }
}

public class AddCartItemRequest
{
    [Required]
    public int ProductVariantId { get; set; }

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; } = 1;
}

public class UpdateCartItemRequest
{
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }
}

public class MergeCartRequest
{
    [Required]
    [MaxLength(128)]
    public string SessionId { get; set; } = string.Empty;
}
