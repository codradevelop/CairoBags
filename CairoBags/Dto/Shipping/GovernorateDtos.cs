namespace CairoBags.Dto.Shipping;

public class GovernorateListItemDto
{
    public int Id { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameAr { get; set; } = string.Empty;
    public decimal ShippingFee { get; set; }
}
