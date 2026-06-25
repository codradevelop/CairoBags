using System.ComponentModel.DataAnnotations;
using CairoBags.Models.Commerce;
using CairoBags.Models.Common;
using CairoBags.Models.Inventories;
using CairoBags.Models.Orders;

namespace CairoBags.Models.Catalog;

public class ProductVariant : BaseEntity
{
    public int ProductId { get; set; }

    [MaxLength(100)]
    public string ColorNameAr { get; set; } = string.Empty;

    [MaxLength(100)]
    public string ColorNameEn { get; set; } = string.Empty;

    [MaxLength(100)]
    public string SizeNameAr { get; set; } = string.Empty;

    [MaxLength(100)]
    public string SizeNameEn { get; set; } = string.Empty;

    [MaxLength(64)]
    public string Sku { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public decimal? CompareAtPrice { get; set; }

    public VariantStatus Status { get; set; } = VariantStatus.Active;

    public bool IsDefault { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual Inventory? Inventory { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}
