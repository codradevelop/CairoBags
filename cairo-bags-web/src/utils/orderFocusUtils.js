const PAYMENT_FOCUS_KEY = "cb-highlight-payment";
const TIMELINE_FOCUS_KEY = "cb-highlight-timeline";

export function requestPaymentFocus() {
  try {
    sessionStorage.setItem(PAYMENT_FOCUS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function requestTimelineFocus() {
  try {
    sessionStorage.setItem(TIMELINE_FOCUS_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumePaymentFocus() {
  try {
    const value = sessionStorage.getItem(PAYMENT_FOCUS_KEY);
    if (value === "1") {
      sessionStorage.removeItem(PAYMENT_FOCUS_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function consumeTimelineFocus() {
  try {
    const value = sessionStorage.getItem(TIMELINE_FOCUS_KEY);
    if (value === "1") {
      sessionStorage.removeItem(TIMELINE_FOCUS_KEY);
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

export function scrollToTimelineSection() {
  document.getElementById("order-timeline-section")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function getFocusFromLocation(location) {
  const params = new URLSearchParams(location?.search ?? "");
  const focus = params.get("focus");
  if (focus === "payment" || focus === "timeline") return focus;
  if (location?.hash === "#payment") return "payment";
  if (location?.hash === "#timeline") return "timeline";
  return null;
}

export function shouldHighlightPayment(location) {
  return (
    getFocusFromLocation(location) === "payment" ||
    location?.state?.highlightPayment ||
    consumePaymentFocus()
  );
}

export function shouldHighlightTimeline(location) {
  return getFocusFromLocation(location) === "timeline" || consumeTimelineFocus();
}
