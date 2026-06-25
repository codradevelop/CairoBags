import { isAdmin } from "./authStorage.js";

/**
 * Storefront is read-only preview for Admin users (browse only, no shopping).
 */
export function isStoreReadOnly(user) {
  return isAdmin(user);
}

export function assertStoreShoppingAllowed(user) {
  if (isStoreReadOnly(user)) {
    const error = new Error("Shopping is disabled in admin preview mode");
    error.code = "STORE_READ_ONLY";
    throw error;
  }
}
