const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Resolve relative FileStorage paths returned by the API.
 */
export function resolveMediaUrl(path) {
  if (!path) return "";
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  const base = API_BASE.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
