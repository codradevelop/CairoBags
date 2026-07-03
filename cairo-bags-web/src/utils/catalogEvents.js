const CATALOG_CHANGE_EVENT = "cb-catalog-change";

/** @typedef {{ entityType: string, action: string, id: number, categoryId?: number | null }} CatalogChangeDetail */

/**
 * @param {CatalogChangeDetail} detail
 */
export function publishCatalogChange(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CATALOG_CHANGE_EVENT, { detail }));
}

/**
 * @param {(detail: CatalogChangeDetail) => void} handler
 * @returns {() => void}
 */
export function subscribeCatalogChange(handler) {
  if (typeof window === "undefined") return () => {};
  const listener = (event) => handler(event.detail);
  window.addEventListener(CATALOG_CHANGE_EVENT, listener);
  return () => window.removeEventListener(CATALOG_CHANGE_EVENT, listener);
}

export function normalizeCatalogChangeDetail(payload) {
  if (!payload || typeof payload !== "object") return null;
  const entityType = payload.entityType ?? payload.EntityType;
  const action = payload.action ?? payload.Action;
  const rawId = payload.id ?? payload.Id;
  if (!entityType || !action || rawId == null) return null;

  const id = Number(rawId);
  if (Number.isNaN(id)) return null;

  const rawCategoryId = payload.categoryId ?? payload.CategoryId;
  let categoryId = null;
  if (rawCategoryId != null) {
    const parsed = Number(rawCategoryId);
    categoryId = Number.isNaN(parsed) ? null : parsed;
  }

  return {
    entityType: String(entityType).toLowerCase(),
    action: String(action).toLowerCase(),
    id,
    categoryId,
  };
}
