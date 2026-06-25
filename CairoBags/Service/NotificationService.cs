using CairoBags.Dto.Notifications;
using CairoBags.Hubs;
using CairoBags.Data;
using CairoBags.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace CairoBags.Service;

/// <summary>
/// Persists per-user notifications, enforces de-duplication, and delivers via SignalR groups.
/// </summary>
public class NotificationService
{
    private readonly CairoBagsContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(CairoBagsContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    public static string ToApiTypeString(NotificationType type) =>
        type switch
        {
            NotificationType.OrderPlaced => "order_placed",
            NotificationType.OrderConfirmed => "order_confirmed",
            NotificationType.PaymentSubmitted => "payment_submitted",
            NotificationType.PaymentConfirmed => "payment_confirmed",
            NotificationType.PaymentRejected => "payment_rejected",
            NotificationType.OrderProcessing => "order_processing",
            NotificationType.OrderShipped => "order_shipped",
            NotificationType.OrderDelivered => "order_delivered",
            NotificationType.ReviewApproved => "review_approved",
            NotificationType.CouponAssigned => "coupon_assigned",
            NotificationType.LowStockAlert => "low_stock_alert",
            NotificationType.SystemAnnouncement => "system_announcement",
            NotificationType.OrderCancelled => "order_cancelled",
            NotificationType.PaymentRefunded => "payment_refunded",
            NotificationType.NewProductReview => "new_product_review",
            _ => "system_announcement"
        };

    public static NotificationItemDto ToDto(Notification n)
    {
        var createdUtc = n.CreatedAtUtc.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(n.CreatedAtUtc, DateTimeKind.Utc)
            : n.CreatedAtUtc.ToUniversalTime();

        var targetType = string.IsNullOrWhiteSpace(n.TargetType)
            ? NotificationDeepLinks.DefaultTargetTypeFor(n.Type)
            : n.TargetType;

        return new NotificationItemDto
        {
            Id = n.Id,
            Type = ToApiTypeString(n.Type),
            TargetType = targetType,
            ReferenceId = n.TargetId,
            DeepLink = !string.IsNullOrWhiteSpace(n.DeepLinkPath)
                ? n.DeepLinkPath
                : NotificationDeepLinks.Build(targetType, n.TargetId),
            Title = n.Title,
            Message = n.Message,
            CreatedAt = createdUtc,
            IsRead = n.IsRead
        };
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        for (Exception? e = ex; e != null; e = e.InnerException)
        {
            if (e is SqlException sql && (sql.Number == 2601 || sql.Number == 2627))
                return true;
        }
        return false;
    }

    private Task SendToUserGroupAsync(string userId, NotificationItemDto dto, CancellationToken cancellationToken) =>
        _hubContext.Clients
            .Group(NotificationGroupNames.ForUser(userId))
            .SendAsync("ReceiveNotification", dto, cancellationToken);

    /// <summary>
    /// Pushes current unread count to the user's notification hub group (realtime badge).
    /// </summary>
    public async Task BroadcastUnreadCountAsync(string userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(userId)) return;

        var unread = await _context.Notifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsRead, cancellationToken);

        try
        {
            await _hubContext.Clients
                .Group(NotificationGroupNames.ForUser(userId))
                .SendAsync("UnreadCountUpdated", unread, cancellationToken);
        }
        catch
        {
            /* hub delivery must not break callers */
        }
    }

    /// <summary>
    /// Create a notification if no duplicate exists; then push on ReceiveNotification.
    /// </summary>
    public async Task<NotificationItemDto?> TryCreateAndNotifyAsync(
        string userId,
        string title,
        string message,
        NotificationType type,
        string? targetType = null,
        int? targetId = null,
        string? referenceKey = null,
        CancellationToken cancellationToken = default,
        string? deepLinkPath = null)
    {
        if (string.IsNullOrWhiteSpace(userId)) return null;

        var resolvedTargetType = string.IsNullOrWhiteSpace(targetType)
            ? NotificationDeepLinks.DefaultTargetTypeFor(type)
            : targetType;

        if (await DuplicateExistsAsync(userId, type, targetId, title, resolvedTargetType, cancellationToken))
            return null;

        var entity = new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            CreatedAtUtc = DateTime.UtcNow,
            IsRead = false,
            TargetType = resolvedTargetType,
            TargetId = targetId,
            DeepLinkPath = deepLinkPath
        };

        _context.Notifications.Add(entity);

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            _context.Entry(entity).State = EntityState.Detached;
            return null;
        }

        var dto = ToDto(entity);
        if (!string.IsNullOrWhiteSpace(referenceKey))
            dto.ReferenceKey = referenceKey;

        try
        {
            await SendToUserGroupAsync(userId, dto, cancellationToken);
        }
        catch
        {
            /* delivery failure should not roll back DB row; client can poll */
        }

        try
        {
            await BroadcastUnreadCountAsync(userId, cancellationToken);
        }
        catch
        {
            /* unread badge is best-effort realtime */
        }

        return dto;
    }

    /// <summary>
    /// One persisted row + realtime push per target user (de-dupe + race-safe unique index).
    /// </summary>
    public async Task BroadcastToUsersAsync(
        IEnumerable<string> userIds,
        string title,
        string message,
        NotificationType type,
        string? targetType = null,
        int? targetId = null,
        string? referenceKey = null,
        CancellationToken cancellationToken = default,
        string? deepLinkPath = null)
    {
        var distinctIds = userIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct()
            .ToList();

        if (distinctIds.Count == 0) return;

        var resolvedTargetType = string.IsNullOrWhiteSpace(targetType)
            ? NotificationDeepLinks.DefaultTargetTypeFor(type)
            : targetType;

        var users = await _context.Users
            .Where(u => distinctIds.Contains(u.Id))
            .ToListAsync(cancellationToken);

        var duplicateUserIds = await _context.Notifications
            .AsNoTracking()
            .Where(n =>
                distinctIds.Contains(n.UserId) &&
                n.Type == type &&
                n.Title == title &&
                (targetId == null ? n.TargetId == null : n.TargetId == targetId) &&
                (resolvedTargetType == null
                    ? n.TargetType == null
                    : n.TargetType == resolvedTargetType))
            .Select(n => n.UserId)
            .ToListAsync(cancellationToken);
        var duplicateSet = duplicateUserIds.ToHashSet(StringComparer.Ordinal);

        foreach (var user in users)
        {
            if (duplicateSet.Contains(user.Id)) continue;
            await TryCreateAndNotifyAsync(
                user.Id,
                title,
                message,
                type,
                resolvedTargetType,
                targetId,
                referenceKey,
                cancellationToken,
                deepLinkPath);
        }
    }

    private async Task<bool> DuplicateExistsAsync(
        string userId,
        NotificationType type,
        int? targetId,
        string title,
        string? targetType,
        CancellationToken cancellationToken)
    {
        return await _context.Notifications.AnyAsync(
            n =>
                n.UserId == userId &&
                n.Type == type &&
                n.Title == title &&
                (targetId == null ? n.TargetId == null : n.TargetId == targetId) &&
                (targetType == null
                    ? n.TargetType == null
                    : n.TargetType == targetType),
            cancellationToken);
    }
}
