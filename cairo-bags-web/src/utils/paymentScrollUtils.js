const HIGHLIGHT_KEY = "cb-highlight-payment";

export function requestPaymentHighlight() {
  try {
    sessionStorage.setItem(HIGHLIGHT_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumePaymentHighlight() {
  try {
    const value = sessionStorage.getItem(HIGHLIGHT_KEY);
    if (value === "1") {
      sessionStorage.removeItem(HIGHLIGHT_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function scrollToPaymentSection() {
  document.getElementById("order-payment-section")?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

export function isPaymentRejectedNotification(notification) {
  const type = notification?.type ?? notification?.Type ?? "";
  return type === "payment_rejected";
}

export function parsePaymentOrderIdFromNotification(notification) {
  const deepLink = notification?.deepLink ?? notification?.DeepLink;
  const fromDeepLink = deepLink?.match(/\/orders\/(\d+)/)?.[1];
  if (fromDeepLink) return fromDeepLink;

  const referenceId = notification?.referenceId ?? notification?.ReferenceId;
  const targetType = notification?.targetType ?? notification?.TargetType;
  if ((targetType === "Order" || targetType === "OrderPayment") && referenceId) {
    return String(referenceId);
  }

  return null;
}

export function handlePaymentNotificationNavigation(notification) {
  if (!isPaymentRejectedNotification(notification)) return false;
  requestPaymentHighlight();
  return true;
}
