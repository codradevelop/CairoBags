import { Link } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import {
  formatNotificationDate,
  getNotificationId,
  getNotificationLink,
} from "../../utils/notificationHelpers.js";
import { handlePaymentNotificationNavigation } from "../../utils/paymentScrollUtils.js";
import { cn } from "../../utils/cn.js";

export function NotificationItem({ notification, onMarkRead, className }) {
  const { locale } = useLocale();
  const id = getNotificationId(notification);
  const isRead = notification?.isRead ?? notification?.IsRead;
  const title = notification?.title ?? notification?.Title ?? "";
  const message = notification?.message ?? notification?.Message ?? "";
  const createdAt = notification?.createdAt ?? notification?.CreatedAt;
  const link = getNotificationLink(notification);

  async function handleClick() {
    handlePaymentNotificationNavigation(notification);
    if (!isRead && onMarkRead) {
      await onMarkRead(id);
    }
  }

  const content = (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isRead
          ? "border-brand-border bg-brand-surface"
          : "border-brand-accent/30 bg-brand-accent/5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-brand-text">{title}</p>
          <p className="mt-1 text-sm text-brand-muted">{message}</p>
          <p className="mt-2 text-xs text-brand-muted">{formatNotificationDate(createdAt, locale)}</p>
        </div>
        {!isRead ? (
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden="true" />
        ) : null}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} onClick={handleClick} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className="block w-full text-start">
      {content}
    </button>
  );
}
