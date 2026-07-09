import {
  NOTIFICATION_TARGET,
  NOTIFICATION_TYPE,
  USER_ROLE,
} from "../constants/notificationTypes.js";
import { requestPaymentFocus, requestTimelineFocus } from "./orderFocusUtils.js";
import {
  parseReviewHighlightFromNotification,
  requestReviewHighlight,
} from "./reviewScrollUtils.js";

const CUSTOMER_ORDER_TYPES = new Set([
  NOTIFICATION_TYPE.ORDER_PLACED,
  NOTIFICATION_TYPE.ORDER_CONFIRMED,
  NOTIFICATION_TYPE.PAYMENT_SUBMITTED,
  NOTIFICATION_TYPE.PAYMENT_CONFIRMED,
  NOTIFICATION_TYPE.PAYMENT_REJECTED,
  NOTIFICATION_TYPE.ORDER_PROCESSING,
  NOTIFICATION_TYPE.ORDER_SHIPPED,
  NOTIFICATION_TYPE.ORDER_DELIVERED,
  NOTIFICATION_TYPE.ORDER_CANCELLED,
  NOTIFICATION_TYPE.PAYMENT_REFUNDED,
]);

const ADMIN_ONLY_TYPES = new Set([
  NOTIFICATION_TYPE.NEW_PRODUCT_REVIEW,
  NOTIFICATION_TYPE.LOW_STOCK_ALERT,
]);

function getNotificationType(notification) {
  return String(notification?.type ?? notification?.Type ?? "").toLowerCase();
}

function getTargetType(notification) {
  return notification?.targetType ?? notification?.TargetType ?? "";
}

function getReferenceId(notification) {
  const id = notification?.referenceId ?? notification?.ReferenceId;
  return id != null && id !== "" ? String(id) : null;
}

function getDeepLink(notification) {
  return notification?.deepLink ?? notification?.DeepLink ?? "";
}

function extractOrderId(notification) {
  const targetType = getTargetType(notification);
  const referenceId = getReferenceId(notification);

  if (
    (targetType === NOTIFICATION_TARGET.ORDER ||
      targetType === NOTIFICATION_TARGET.ORDER_PAYMENT ||
      targetType === NOTIFICATION_TARGET.ADMIN_PAYMENTS) &&
    referenceId
  ) {
    return referenceId;
  }

  const deepLink = getDeepLink(notification);
  const match =
    deepLink.match(/\/account\/orders\/(\d+)/) ??
    deepLink.match(/\/admin\/orders\/(\d+)/) ??
    deepLink.match(/\/orders\/(\d+)/);
  return match?.[1] ?? null;
}

function extractProductId(notification) {
  const deepLink = getDeepLink(notification);
  const match = deepLink.match(/\/products\/(\d+)/);
  return match?.[1] ?? null;
}

function resolveOrderRoute(orderId, role) {
  if (!orderId) return null;
  return role === USER_ROLE.ADMIN
    ? `/admin/orders/${orderId}`
    : `/account/orders/${orderId}`;
}

const PAYMENT_FOCUS_TYPES = new Set([
  NOTIFICATION_TYPE.PAYMENT_REJECTED,
  NOTIFICATION_TYPE.PAYMENT_SUBMITTED,
  NOTIFICATION_TYPE.PAYMENT_CONFIRMED,
  NOTIFICATION_TYPE.PAYMENT_REFUNDED,
]);

const TIMELINE_FOCUS_TYPES = new Set([
  NOTIFICATION_TYPE.ORDER_PLACED,
  NOTIFICATION_TYPE.ORDER_CONFIRMED,
  NOTIFICATION_TYPE.ORDER_PROCESSING,
  NOTIFICATION_TYPE.ORDER_SHIPPED,
  NOTIFICATION_TYPE.ORDER_DELIVERED,
  NOTIFICATION_TYPE.ORDER_CANCELLED,
]);

function appendOrderFocus(path, type) {
  if (!path?.includes("/orders/")) return path;
  if (PAYMENT_FOCUS_TYPES.has(type)) return `${path}?focus=payment`;
  if (TIMELINE_FOCUS_TYPES.has(type)) return `${path}?focus=timeline`;
  return path;
}

function resolveCustomerRoute(notification, type) {
  const orderId = extractOrderId(notification);

  if (CUSTOMER_ORDER_TYPES.has(type)) {
    const base = resolveOrderRoute(orderId, USER_ROLE.CUSTOMER) ?? "/account";
    return appendOrderFocus(base, type);
  }

  if (type === NOTIFICATION_TYPE.COUPON_ASSIGNED) {
    const couponId = getReferenceId(notification);
    return couponId ? `/shop?coupon=${couponId}` : "/shop";
  }

  if (type === NOTIFICATION_TYPE.REVIEW_APPROVED) {
    const productId = extractProductId(notification);
    return productId ? `/products/${productId}#reviews` : "/account";
  }

  const targetType = getTargetType(notification);
  if (targetType === NOTIFICATION_TARGET.PRODUCT_REVIEW) {
    const productId = extractProductId(notification);
    if (productId) return `/products/${productId}#reviews`;
  }

  if (targetType === NOTIFICATION_TARGET.COUPON) {
    return "/shop";
  }

  const deepLink = getDeepLink(notification);
  if (deepLink.startsWith("/wishlist")) return "/wishlist";
  if (deepLink.startsWith("/products/")) return deepLink;
  if (deepLink.startsWith("/shop")) return deepLink;

  return "/account";
}

function resolveAdminRoute(notification, type) {
  const targetType = getTargetType(notification);
  const orderId = extractOrderId(notification);

  if (
    type === NOTIFICATION_TYPE.PAYMENT_SUBMITTED &&
    targetType === NOTIFICATION_TARGET.ADMIN_PAYMENTS
  ) {
    return orderId ? `/admin/payments?orderId=${orderId}` : "/admin/payments";
  }

  if (type === NOTIFICATION_TYPE.ORDER_PLACED || CUSTOMER_ORDER_TYPES.has(type)) {
    const base = resolveOrderRoute(orderId, USER_ROLE.ADMIN) ?? "/admin";
    return appendOrderFocus(base, type);
  }

  if (
    type === NOTIFICATION_TYPE.LOW_STOCK_ALERT ||
    targetType === NOTIFICATION_TARGET.PRODUCT_VARIANT
  ) {
    return "/admin/inventory";
  }

  if (type === NOTIFICATION_TYPE.COUPON_ASSIGNED || targetType === NOTIFICATION_TARGET.COUPON) {
    const couponId = getReferenceId(notification);
    return couponId ? `/admin/coupons/${couponId}` : "/admin/coupons";
  }

  if (
    type === NOTIFICATION_TYPE.NEW_PRODUCT_REVIEW ||
    targetType === NOTIFICATION_TARGET.PRODUCT_REVIEW
  ) {
    const productId = extractProductId(notification);
    return productId ? `/products/${productId}#reviews` : "/admin";
  }

  if (type === NOTIFICATION_TYPE.SYSTEM_ANNOUNCEMENT || targetType === NOTIFICATION_TARGET.SYSTEM) {
    return "/admin";
  }

  const deepLink = getDeepLink(notification);
  if (deepLink.startsWith("/admin/")) return deepLink;

  return "/admin";
}

function enforceRoleAccess(path, role) {
  if (!path) {
    return role === USER_ROLE.ADMIN ? "/admin" : "/account";
  }

  if (role === USER_ROLE.CUSTOMER && path.startsWith("/admin")) {
    return "/account";
  }

  if (role === USER_ROLE.ADMIN && path.startsWith("/account")) {
    return path.replace(/^\/account\/orders\/(\d+)/, "/admin/orders/$1") || "/admin";
  }

  return path;
}

/**
 * Central notification routing — resolves destination from type, target, and role.
 */
export function getNotificationNavigation(notification, currentUserRole = USER_ROLE.CUSTOMER) {
  if (!notification) {
    return currentUserRole === USER_ROLE.ADMIN ? "/admin" : "/account";
  }

  const role =
    currentUserRole === USER_ROLE.ADMIN ? USER_ROLE.ADMIN : USER_ROLE.CUSTOMER;
  const type = getNotificationType(notification);
  const targetType = getTargetType(notification);

  let path;

  if (role === USER_ROLE.ADMIN) {
    if (
      ADMIN_ONLY_TYPES.has(type) ||
      targetType === NOTIFICATION_TARGET.ADMIN_PAYMENTS ||
      targetType === NOTIFICATION_TARGET.PRODUCT_VARIANT
    ) {
      path = resolveAdminRoute(notification, type);
    } else if (CUSTOMER_ORDER_TYPES.has(type)) {
      path = resolveAdminRoute(notification, type);
    } else {
      path = resolveAdminRoute(notification, type);
    }
  } else {
    if (ADMIN_ONLY_TYPES.has(type) || targetType === NOTIFICATION_TARGET.ADMIN_PAYMENTS) {
      path = "/account";
    } else {
      path = resolveCustomerRoute(notification, type);
    }
  }

  return enforceRoleAccess(path, role);
}

/**
 * Side effects before navigation (scroll/highlight flags).
 */
export function applyNotificationNavigationEffects(notification) {
  const type = getNotificationType(notification);

  if (PAYMENT_FOCUS_TYPES.has(type)) {
    requestPaymentFocus();
  }

  if (TIMELINE_FOCUS_TYPES.has(type)) {
    requestTimelineFocus();
  }

  const reviewId = parseReviewHighlightFromNotification(notification);
  if (reviewId) {
    requestReviewHighlight(reviewId);
  }

  if (type === NOTIFICATION_TYPE.REVIEW_APPROVED) {
    const productId = extractProductId(notification);
    if (productId) {
      try {
        sessionStorage.setItem("cb-highlight-reviews", "1");
      } catch {
        /* ignore */
      }
    }
  }
}

/**
 * Mark as read, then navigate. If mark-as-read fails, still navigates.
 */
export async function navigateFromNotification({
  notification,
  currentUserRole,
  markAsRead,
  navigate,
}) {
  const path = getNotificationNavigation(notification, currentUserRole);
  applyNotificationNavigationEffects(notification);

  const id = notification?.id ?? notification?.Id;
  const isRead = notification?.isRead ?? notification?.IsRead;

  if (!isRead && id && markAsRead) {
    try {
      await markAsRead(id);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[notifications] mark-as-read failed", error);
      }
    }
  }

  navigate(path);
}

export function resolveNotificationUserRole({ isAdmin = false, adminContext = false } = {}) {
  if (adminContext || isAdmin) {
    return USER_ROLE.ADMIN;
  }
  return USER_ROLE.CUSTOMER;
}
