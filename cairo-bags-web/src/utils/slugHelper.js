/**
 * Normalize an existing slug: lowercase, hyphen-separated, no duplicate or edge hyphens.
 */
export function normalizeSlug(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[''`´]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate an SEO-friendly slug from arbitrary text (e.g. translated product name).
 */
export function generateSlug(value = "") {
  return normalizeSlug(value);
}
