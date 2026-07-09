import { USER_ROLE } from "../constants/notificationTypes.js";
import { getNotificationNavigation } from "./notificationNavigation.js";

export function getNotificationId(notification) {
  return notification?.id ?? notification?.Id;
}

/** @deprecated Use getNotificationNavigation(notification, role) instead. */
export function getNotificationLink(notification, { adminContext = false } = {}) {
  const role = adminContext ? USER_ROLE.ADMIN : USER_ROLE.CUSTOMER;
  return getNotificationNavigation(notification, role);
}

export { getNotificationNavigation } from "./notificationNavigation.js";

export function formatNotificationDate(value, locale = "en") {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
