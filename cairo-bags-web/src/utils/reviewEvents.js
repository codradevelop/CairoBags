const REVIEW_CHANGE_EVENT = "cb-review-change";

export function publishReviewChange(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(REVIEW_CHANGE_EVENT, { detail }));
}

export function subscribeReviewChange(handler) {
  if (typeof window === "undefined") return () => {};
  const listener = (event) => handler(event.detail);
  window.addEventListener(REVIEW_CHANGE_EVENT, listener);
  return () => window.removeEventListener(REVIEW_CHANGE_EVENT, listener);
}
