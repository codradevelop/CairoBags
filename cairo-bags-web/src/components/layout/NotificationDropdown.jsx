import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";
import { Spinner } from "../ui/Spinner.jsx";
import { useNotifications } from "../../context/NotificationContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLocale } from "./LanguageSwitcher.jsx";
import { useToast } from "../ui/Toast.jsx";
import {
  getNotificationId,
  getNotificationLink,
} from "../../utils/notificationHelpers.js";
import {
  parseReviewHighlightFromNotification,
  requestReviewHighlight,
} from "../../utils/reviewScrollUtils.js";
import { handlePaymentNotificationNavigation } from "../../utils/paymentScrollUtils.js";
import { cn } from "../../utils/cn.js";

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function NotificationDropdown({ className, adminContext = false, triggerClassName }) {
  const { isAuthenticated } = useAuth();
  const { locale } = useLocale();
  const { success } = useToast();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!isAuthenticated) return null;

  const title = locale === "ar" ? "الإشعارات" : "Notifications";
  const empty = locale === "ar" ? "لا توجد إشعارات" : "No notifications yet";

  async function handleMarkAllAsRead(event) {
    event.preventDefault();
    event.stopPropagation();
    if (unreadCount === 0 || markingAll) return;

    setMarkingAll(true);
    try {
      await markAllAsRead();
      success(
        locale === "ar" ? "تم تعليم جميع الإشعارات كمقروءة." : "All notifications marked as read."
      );
    } catch {
      /* badge sync is best-effort */
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleNotificationClick(notification) {
    setOpen(false);
    handlePaymentNotificationNavigation(notification);
    const reviewId = parseReviewHighlightFromNotification(notification);
    if (reviewId) requestReviewHighlight(reviewId);
    const id = getNotificationId(notification);
    const isRead = notification?.isRead ?? notification?.IsRead;
    if (!isRead && id) {
      try {
        await markAsRead(id);
      } catch {
        /* badge sync is best-effort */
      }
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {triggerClassName ? (
        <button
          type="button"
          className={cn("relative", triggerClassName)}
          aria-label={`${title}${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <span key={unreadCount} className="cb-header-cart-badge">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`${title}${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <Badge
              size="sm"
              variant="accent"
              className="absolute -end-1 -top-1 min-w-[1.25rem] justify-center px-1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      )}

      {open ? (
        <div
          className={cn(
            "absolute end-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border border-brand-border",
            "bg-brand-surface shadow-soft animate-slide-down"
          )}
          role="menu"
        >
          <div className="flex items-center justify-between gap-2 border-b border-brand-border px-4 py-3">
            <p className="font-display text-sm font-medium text-brand-text">{title}</p>
            {unreadCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={markingAll}
                className="h-8 gap-1.5 px-2 text-xs transition-transform duration-300 hover:scale-[1.02] hover:text-brand-accent"
                aria-label={locale === "ar" ? "تعليم الكل كمقروء" : "Mark all as read"}
                onClick={handleMarkAllAsRead}
              >
                <span aria-hidden="true">✓</span>
                {locale === "ar" ? "تعليم الكل كمقروء" : "Mark all as read"}
              </Button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto cb-scrollbar-thin">
            {loading ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-brand-muted">{empty}</p>
            ) : (
              <ul className="divide-y divide-brand-border">
                {notifications.slice(0, 8).map((item) => {
                  const link = getNotificationLink(item, { adminContext });
                  const itemClassName = cn(
                    "block px-4 py-3 transition-colors hover:bg-brand-secondary",
                    !(item.isRead ?? item.IsRead) && "bg-brand-secondary/50"
                  );

                  const content = (
                    <>
                      <p className="text-sm font-medium text-brand-text">
                        {item.title ?? item.Title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-brand-muted">
                        {item.message ?? item.Message}
                      </p>
                    </>
                  );

                  return (
                    <li key={item.id ?? item.Id}>
                      {link ? (
                        <Link
                          to={link}
                          className={itemClassName}
                          role="menuitem"
                          onClick={() => handleNotificationClick(item)}
                        >
                          {content}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={cn(itemClassName, "w-full text-start")}
                          role="menuitem"
                          onClick={() => handleNotificationClick(item)}
                        >
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
