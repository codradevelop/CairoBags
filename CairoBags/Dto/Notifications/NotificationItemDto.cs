using System.Text.Json.Serialization;
using Newtonsoft.Json;

namespace CairoBags.Dto.Notifications;

/// <summary>
/// API and SignalR shape for in-app notifications (camelCase on the wire).
/// </summary>
public class NotificationItemDto
{
    [JsonProperty("id")]
    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>
    /// Lowercase snake_case e.g. order_placed, payment_confirmed, system_announcement.
    /// </summary>
    [JsonProperty("type")]
    [JsonPropertyName("type")]
    public string Type { get; set; } = "system_announcement";

    /// <summary>
    /// Deep-link entity type e.g. Order, OrderPayment, ProductReview.
    /// </summary>
    [JsonProperty("targetType")]
    [JsonPropertyName("targetType")]
    public string? TargetType { get; set; }

    [JsonProperty("referenceId")]
    [JsonPropertyName("referenceId")]
    public int? ReferenceId { get; set; }

    /// <summary>
    /// Optional secondary reference (e.g. order number) when not represented by <see cref="ReferenceId"/>.
    /// </summary>
    [JsonProperty("referenceKey")]
    [JsonPropertyName("referenceKey")]
    public string? ReferenceKey { get; set; }

    /// <summary>
    /// Client route path for navigation e.g. /orders/42.
    /// </summary>
    [JsonProperty("deepLink")]
    [JsonPropertyName("deepLink")]
    public string? DeepLink { get; set; }

    [JsonProperty("title")]
    [JsonPropertyName("title")]
    public string Title { get; set; } = "";

    [JsonProperty("message")]
    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonProperty("createdAt")]
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; }

    [JsonProperty("isRead")]
    [JsonPropertyName("isRead")]
    public bool IsRead { get; set; }

    [JsonProperty("priority")]
    [JsonPropertyName("priority")]
    public string Priority { get; set; } = "info";
}
