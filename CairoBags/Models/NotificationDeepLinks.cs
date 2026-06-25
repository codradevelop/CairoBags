namespace CairoBags.Models;

/// <summary>
/// Builds storefront/admin deep links from persisted notification metadata.
/// </summary>
public static class NotificationDeepLinks
{
    public static string? Build(string? targetType, int? targetId)
    {
        if (string.IsNullOrWhiteSpace(targetType))
            return null;

        if (string.Equals(targetType, NotificationTargetTypes.System, StringComparison.Ordinal))
            return "/announcements";

        if (targetId == null)
            return null;

        return targetType switch
        {
            NotificationTargetTypes.Order => $"/orders/{targetId}",
            NotificationTargetTypes.OrderPayment => $"/orders/{targetId}/payment",
            NotificationTargetTypes.ProductReview => $"/products/{targetId}#reviews",
            NotificationTargetTypes.Coupon => $"/account/coupons/{targetId}",
            NotificationTargetTypes.ProductVariant => $"/admin/inventory/variants/{targetId}",
            NotificationTargetTypes.AdminPayments => "/admin/payments",
            _ => null
        };
    }

    public static string? DefaultTargetTypeFor(NotificationType type) =>
        type switch
        {
            NotificationType.OrderPlaced => NotificationTargetTypes.Order,
            NotificationType.OrderConfirmed => NotificationTargetTypes.Order,
            NotificationType.PaymentSubmitted => NotificationTargetTypes.OrderPayment,
            NotificationType.PaymentConfirmed => NotificationTargetTypes.OrderPayment,
            NotificationType.PaymentRejected => NotificationTargetTypes.OrderPayment,
            NotificationType.OrderProcessing => NotificationTargetTypes.Order,
            NotificationType.OrderShipped => NotificationTargetTypes.Order,
            NotificationType.OrderDelivered => NotificationTargetTypes.Order,
            NotificationType.OrderCancelled => NotificationTargetTypes.Order,
            NotificationType.PaymentRefunded => NotificationTargetTypes.OrderPayment,
            NotificationType.ReviewApproved => NotificationTargetTypes.ProductReview,
            NotificationType.NewProductReview => NotificationTargetTypes.ProductReview,
            NotificationType.CouponAssigned => NotificationTargetTypes.Coupon,
            NotificationType.LowStockAlert => NotificationTargetTypes.ProductVariant,
            NotificationType.SystemAnnouncement => NotificationTargetTypes.System,
            _ => null
        };
}
