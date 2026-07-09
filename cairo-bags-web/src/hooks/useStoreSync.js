import { useEffect, useRef } from "react";
import { subscribeStoreEvent } from "../utils/storeEvents.js";

/**
 * Subscribe to storefront SignalR events (dispatched via StoreProvider).
 * @param {string|string[]} eventTypes
 * @param {(payload: object, eventType: string) => void} handler
 * @param {{ productId?: number, categoryId?: number, reviewId?: number, variantId?: number }} [filter]
 */
export function useStoreSync(eventTypes, handler, filter) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return subscribeStoreEvent(eventTypes, (payload, eventType) => {
      handlerRef.current(payload, eventType);
    }, filter);
  }, [
    JSON.stringify(Array.isArray(eventTypes) ? eventTypes : [eventTypes]),
    filter?.productId,
    filter?.categoryId,
    filter?.reviewId,
    filter?.variantId,
  ]);
}
