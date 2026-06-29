using System.Text.Json.Serialization;
using Newtonsoft.Json;

namespace CairoBags.Dto.Store;

/// <summary>
/// Public-safe storefront sync payload. Never include admin-only or customer PII.
/// </summary>
public class StoreUpdatePayloadDto
{
    [JsonProperty("entityId")]
    [JsonPropertyName("entityId")]
    public int EntityId { get; set; }

    [JsonProperty("productId")]
    [JsonPropertyName("productId")]
    public int? ProductId { get; set; }

    [JsonProperty("categoryId")]
    [JsonPropertyName("categoryId")]
    public int? CategoryId { get; set; }

    [JsonProperty("reviewId")]
    [JsonPropertyName("reviewId")]
    public int? ReviewId { get; set; }

    [JsonProperty("variantId")]
    [JsonPropertyName("variantId")]
    public int? VariantId { get; set; }

    [JsonProperty("isActive")]
    [JsonPropertyName("isActive")]
    public bool? IsActive { get; set; }

    [JsonProperty("averageRating")]
    [JsonPropertyName("averageRating")]
    public decimal? AverageRating { get; set; }

    [JsonProperty("reviewCount")]
    [JsonPropertyName("reviewCount")]
    public int? ReviewCount { get; set; }

    [JsonProperty("helpfulCount")]
    [JsonPropertyName("helpfulCount")]
    public int? HelpfulCount { get; set; }

    [JsonProperty("availableStock")]
    [JsonPropertyName("availableStock")]
    public int? AvailableStock { get; set; }

    [JsonProperty("isInStock")]
    [JsonPropertyName("isInStock")]
    public bool? IsInStock { get; set; }

    [JsonProperty("code")]
    [JsonPropertyName("code")]
    public string? Code { get; set; }

    [JsonProperty("occurredAt")]
    [JsonPropertyName("occurredAt")]
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}
