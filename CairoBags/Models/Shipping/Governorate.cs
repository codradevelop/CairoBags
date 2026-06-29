using System.ComponentModel.DataAnnotations;
using CairoBags.Models.Common;

namespace CairoBags.Models.Shipping;

public class Governorate : BaseEntity
{
    public int ShippingZoneId { get; set; }

    [MaxLength(100)]
    public string NameAr { get; set; } = string.Empty;

    [MaxLength(100)]
    public string NameEn { get; set; } = string.Empty;

    public decimal ShippingFee { get; set; }

    public bool IsSelectable { get; set; } = true;

    public int DisplayOrder { get; set; }

    public virtual ShippingZone ShippingZone { get; set; } = null!;
}
