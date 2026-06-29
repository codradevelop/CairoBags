const STORE_UPDATE_EVENT = "cb-store-update";

export function publishStoreEvent(eventType, payload = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(STORE_UPDATE_EVENT, {
      detail: { eventType, payload, at: Date.now() },
    })
  );
}

/**
 * Subscribe to one or more store sync events.
 * @param {string|string[]} eventTypes
 * @param {(payload: object, eventType: string) => void} handler
 * @param {{ productId?: number, categoryId?: number, reviewId?: number, variantId?: number }} [filter]
 */
export function subscribeStoreEvent(eventTypes, handler, filter) {
  if (typeof window === "undefined") return () => {};

  const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes];

  const listener = (event) => {
    const { eventType, payload } = event.detail ?? {};
    if (!types.includes(eventType)) return;

    if (filter?.productId != null) {
      const pid = payload?.productId ?? payload?.ProductId;
      if (pid != null && Number(pid) !== Number(filter.productId)) return;
    }
    if (filter?.categoryId != null) {
      const cid = payload?.categoryId ?? payload?.CategoryId ?? payload?.entityId ?? payload?.EntityId;
      if (cid != null && Number(cid) !== Number(filter.categoryId)) return;
    }
    if (filter?.reviewId != null) {
      const rid = payload?.reviewId ?? payload?.ReviewId;
      if (rid != null && Number(rid) !== Number(filter.reviewId)) return;
    }
    if (filter?.variantId != null) {
      const vid = payload?.variantId ?? payload?.VariantId;
      if (vid != null && Number(vid) !== Number(filter.variantId)) return;
    }

    handler(payload ?? {}, eventType);
  };

  window.addEventListener(STORE_UPDATE_EVENT, listener);
  return () => window.removeEventListener(STORE_UPDATE_EVENT, listener);
}
