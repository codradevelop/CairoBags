import { useEffect } from "react";
import { AccountLayout } from "../../layouts/AccountLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useNotifications } from "../../context/NotificationContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import {
  NotificationList,
  EmptyNotifications,
} from "../../components/account/index.js";
import { USER_ROLE } from "../../constants/notificationTypes.js";
import { Button } from "../../components/ui/index.js";

export function NotificationsPage() {
  const { locale } = useLocale();
  const { info } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    latestPush,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const title = locale === "ar" ? "الإشعارات" : "Notifications";
  usePageTitle(title);

  useEffect(() => {
    if (latestPush?.title) {
      info(latestPush.title);
    }
  }, [latestPush, info]);

  async function handleMarkAll() {
    await markAllAsRead();
  }

  return (
    <AccountLayout activeKey="notifications" title={title}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brand-muted">
          {unreadCount > 0
            ? locale === "ar"
              ? `${unreadCount} غير مقروء`
              : `${unreadCount} unread`
            : locale === "ar"
              ? "كل الإشعارات مقروءة"
              : "All caught up"}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => loadNotifications()}>
            {locale === "ar" ? "تحديث" : "Refresh"}
          </Button>
          {unreadCount > 0 ? (
            <Button type="button" variant="accent" size="sm" onClick={handleMarkAll}>
              {locale === "ar" ? "تعليم الكل كمقروء" : "Mark all as read"}
            </Button>
          ) : null}
        </div>
      </div>

      {!loading && notifications.length === 0 ? (
        <EmptyNotifications onRefresh={() => loadNotifications()} />
      ) : (
        <NotificationList
          notifications={notifications}
          loading={loading}
          onMarkRead={markAsRead}
          userRole={USER_ROLE.CUSTOMER}
        />
      )}
    </AccountLayout>
  );
}
