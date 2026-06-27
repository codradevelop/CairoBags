namespace CairoBags.Dto.Wishlist;

public class WishlistItemDto
{
    public int ProductId { get; set; }

    public string ProductNameAr { get; set; } = string.Empty;

    public string ProductNameEn { get; set; } = string.Empty;

    public string ProductSlugAr { get; set; } = string.Empty;

    public string ProductSlugEn { get; set; } = string.Empty;

    public string? PrimaryImage { get; set; }

    public decimal? Price { get; set; }

    public decimal? CompareAtPrice { get; set; }

    public bool InStock { get; set; }

    public string Category { get; set; } = string.Empty;

    public DateTime AddedAt { get; set; }
}

public class WishlistResponseDto
{
    public List<WishlistItemDto> Items { get; set; } = new();

    public int Count { get; set; }
}

public class WishlistToggleResponseDto
{
    public bool IsInWishlist { get; set; }

    public int WishlistCount { get; set; }
}

public class WishlistCountDto
{
    public int Count { get; set; }
}
