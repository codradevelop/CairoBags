import { NOTIFICATION_TYPE } from "../constants/notificationTypes.js";

export const NOTIFICATION_PRIORITY = {
  CRITICAL: "critical",
  WARNING: "warning",
  SUCCESS: "success",
  INFO: "info",
};

const TYPE_PRIORITY = {
  [NOTIFICATION_TYPE.PAYMENT_REJECTED]: NOTIFICATION_PRIORITY.CRITICAL,
  [NOTIFICATION_TYPE.ORDER_CANCELLED]: NOTIFICATION_PRIORITY.CRITICAL,
  [NOTIFICATION_TYPE.LOW_STOCK_ALERT]: NOTIFICATION_PRIORITY.WARNING,
  [NOTIFICATION_TYPE.COUPON_ASSIGNED]: NOTIFICATION_PRIORITY.WARNING,
  [NOTIFICATION_TYPE.ORDER_DELIVERED]: NOTIFICATION_PRIORITY.SUCCESS,
  [NOTIFICATION_TYPE.PAYMENT_CONFIRMED]: NOTIFICATION_PRIORITY.SUCCESS,
  [NOTIFICATION_TYPE.REVIEW_APPROVED]: NOTIFICATION_PRIORITY.SUCCESS,
  [NOTIFICATION_TYPE.NEW_PRODUCT_REVIEW]: NOTIFICATION_PRIORITY.INFO,
};

const PRIORITY_STYLES = {
  [NOTIFICATION_PRIORITY.CRITICAL]: {
    unreadBorder: "border-red-300/80",
    unreadBg: "bg-red-50/80",
    dot: "bg-red-500",
    accent: "text-red-700",
  },
  [NOTIFICATION_PRIORITY.WARNING]: {
    unreadBorder: "border-amber-300/80",
    unreadBg: "bg-amber-50/70",
    dot: "bg-amber-500",
    accent: "text-amber-800",
  },
  [NOTIFICATION_PRIORITY.SUCCESS]: {
    unreadBorder: "border-emerald-300/80",
    unreadBg: "bg-emerald-50/70",
    dot: "bg-emerald-500",
    accent: "text-emerald-800",
  },
  [NOTIFICATION_PRIORITY.INFO]: {
    unreadBorder: "border-brand-accent/30",
    unreadBg: "bg-brand-accent/5",
    dot: "bg-brand-accent",
    accent: "text-brand-text",
  },
};

const COUPON_STYLES = {
  unreadBorder: "border-yellow-400/70",
  unreadBg: "bg-yellow-50/80",
  dot: "bg-yellow-500",
  accent: "text-yellow-900",
};

export function getNotificationPriority(notification) {
  const apiPriority = notification?.priority ?? notification?.Priority;
  if (apiPriority && PRIORITY_STYLES[apiPriority]) return apiPriority;

  const type = String(notification?.type ?? notification?.Type ?? "").toLowerCase();
  return TYPE_PRIORITY[type] ?? NOTIFICATION_PRIORITY.INFO;
}

export function getNotificationPriorityStyles(notification, isRead = false) {
  if (isRead) {
    return {
      unreadBorder: "border-brand-border",
      unreadBg: "bg-brand-surface",
      dot: "bg-brand-muted",
      accent: "text-brand-text",
    };
  }

  const type = String(notification?.type ?? notification?.Type ?? "").toLowerCase();
  if (type === NOTIFICATION_TYPE.COUPON_ASSIGNED) {
    return COUPON_STYLES;
  }

  const priority = getNotificationPriority(notification);
  return PRIORITY_STYLES[priority] ?? PRIORITY_STYLES[NOTIFICATION_PRIORITY.INFO];
}
