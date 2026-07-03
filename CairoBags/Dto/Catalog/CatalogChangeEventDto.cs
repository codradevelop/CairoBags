namespace CairoBags.Dto.Catalog;

/// <summary>Realtime catalog change payload (camelCase on the wire).</summary>
public class CatalogChangeEventDto
{
    public string EntityType { get; set; } = "";
    public string Action { get; set; } = "";
    public int Id { get; set; }
    public int? CategoryId { get; set; }
}
