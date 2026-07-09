import { useNavigate } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatNotificationDate } from "../../utils/notificationHelpers.js";
import {
  navigateFromNotification,
  resolveNotificationUserRole,
} from "../../utils/notificationNavigation.js";
import { getNotificationPriorityStyles } from "../../utils/notificationPriority.js";
import { cn } from "../../utils/cn.js";

export function NotificationItem({
  notification,
  onMarkRead,
  userRole,
  className,
}) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const isRead = notification?.isRead ?? notification?.IsRead;
  const title = notification?.title ?? notification?.Title ?? "";
  const message = notification?.message ?? notification?.Message ?? "";
  const createdAt = notification?.createdAt ?? notification?.CreatedAt;
  const role = userRole ?? resolveNotificationUserRole({ isAdmin });
  const styles = getNotificationPriorityStyles(notification, isRead);

  async function handleClick() {
    await navigateFromNotification({
      notification,
      currentUserRole: role,
      markAsRead: onMarkRead,
      navigate,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("block w-full text-start", className)}
    >
      <div
        className={cn(
          "rounded-lg border p-4 transition-colors hover:border-brand-accent/40",
          isRead ? "border-brand-border bg-brand-surface" : `${styles.unreadBorder} ${styles.unreadBg}`
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={cn("font-medium", styles.accent)}>{title}</p>
            <p className="mt-1 text-sm text-brand-muted">{message}</p>
            <p className="mt-2 text-xs text-brand-muted">{formatNotificationDate(createdAt, locale)}</p>
          </div>
          {!isRead ? (
            <span
              className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", styles.dot)}
              aria-hidden="true"
            />
          ) : null}
        </div>
      </div>
    </button>
  );
}
