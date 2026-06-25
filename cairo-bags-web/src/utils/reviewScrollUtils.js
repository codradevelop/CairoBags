const HIGHLIGHT_KEY = "cb-highlight-reviews";
const HIGHLIGHT_REVIEW_KEY = "cb-highlight-review-id";

export function requestReviewsHighlight() {
  try {
    sessionStorage.setItem(HIGHLIGHT_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeReviewsHighlight() {
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

export function scrollToReviewsSection() {
  document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function requestReviewHighlight(reviewId) {
  if (!reviewId) return;
  requestReviewsHighlight();
  try {
    sessionStorage.setItem(HIGHLIGHT_REVIEW_KEY, String(reviewId));
  } catch {
    /* ignore */
  }
}

export function consumeReviewHighlight() {
  try {
    const value = sessionStorage.getItem(HIGHLIGHT_REVIEW_KEY);
    if (value) {
      sessionStorage.removeItem(HIGHLIGHT_REVIEW_KEY);
      return Number(value);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function parseReviewHighlightFromNotification(notification) {
  const referenceKey = notification?.referenceKey ?? notification?.ReferenceKey;
  if (referenceKey?.startsWith("review-")) {
    const id = Number(referenceKey.slice(7));
    return Number.isFinite(id) ? id : null;
  }
  const reviewId = notification?.referenceId ?? notification?.ReferenceId;
  const type = notification?.type ?? notification?.Type;
  if (type === "new_product_review" && reviewId) return reviewId;
  return null;
}
