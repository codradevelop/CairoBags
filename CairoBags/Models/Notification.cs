using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CairoBags.Models.Identity;

namespace CairoBags.Models;

public enum NotificationType : byte
{
    OrderPlaced = 1,
    OrderConfirmed = 2,
    PaymentSubmitted = 3,
    PaymentConfirmed = 4,
    PaymentRejected = 5,
    OrderProcessing = 6,
    OrderShipped = 7,
    OrderDelivered = 8,
    ReviewApproved = 9,
    CouponAssigned = 10,
    LowStockAlert = 11,
    SystemAnnouncement = 12,
    OrderCancelled = 13,
    PaymentRefunded = 14,
    NewProductReview = 15
}

[Table("Notifications")]
public class Notification
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey(nameof(UserId))]
    public virtual ApplicationUser User { get; set; } = null!;

    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    [Required]
    public NotificationType Type { get; set; } = NotificationType.SystemAnnouncement;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public bool IsRead { get; set; }

    /// <summary>Archived notifications are hidden from the active list but kept for history.</summary>
    public bool IsArchived { get; set; }

    /// <summary>
    /// Deep-link target (e.g. Order, OrderPayment, ProductReview). See <see cref="NotificationTargetTypes"/>.
    /// </summary>
    [MaxLength(50)]
    public string? TargetType { get; set; }

    /// <summary>
    /// Primary key of the deep-link target entity (OrderId, OrderPaymentId, ...).
    /// </summary>
    public int? TargetId { get; set; }

    /// <summary>
    /// Optional explicit client route (e.g. /products/42#reviews).
    /// </summary>
    [MaxLength(300)]
    public string? DeepLinkPath { get; set; }
}
