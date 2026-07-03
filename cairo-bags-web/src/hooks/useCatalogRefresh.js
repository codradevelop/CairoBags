import { useEffect, useRef } from "react";
import { subscribeCatalogChange } from "../utils/catalogEvents.js";

/**
 * @param {import("../utils/catalogEvents.js").CatalogChangeDetail} detail
 * @param {{ entity?: string, id?: number, categoryId?: number }} filters
 */
function matchesDetail(detail, { entity, id, categoryId }) {
  if (entity && detail.entityType !== entity) return false;
  if (id != null && detail.id !== id) return false;
  if (categoryId != null) {
    if (detail.entityType === "category") return detail.id === categoryId;
    if (detail.entityType === "product") return detail.categoryId === categoryId;
    return false;
  }
  return true;
}

/**
 * Refetch catalog data when a matching realtime change arrives.
 *
 * @param {(options?: { background?: boolean }) => void | Promise<void>} refetch
 * @param {{ entity?: 'product' | 'category', id?: number, categoryId?: number, enabled?: boolean }} [options]
 */
export function useCatalogRefresh(refetch, options = {}) {
  const { entity, id, categoryId, enabled = true } = options;
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled || typeof refetchRef.current !== "function") return undefined;

    return subscribeCatalogChange((detail) => {
      if (!matchesDetail(detail, { entity, id, categoryId })) return;
      refetchRef.current({ background: true });
      if (detail.action === "created") {
        window.setTimeout(() => refetchRef.current({ background: true }), 500);
        if (detail.entityType === "category") {
          window.setTimeout(() => refetchRef.current({ background: true }), 1200);
        }
      }
    });
  }, [entity, id, categoryId, enabled]);
}
