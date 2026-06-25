import axiosInstance from "../api/axios.js";
import { ENDPOINTS } from "../constants/endpoints.js";

const sessionCache = new Map();
const inflight = new Map();

function buildCacheKey(text, from, to) {
  return `${from}|${to}|${text.trim()}`;
}

/**
 * Translate text via backend proxy (LibreTranslate / MyMemory).
 * @returns {Promise<string|null>} Translated text, or null if unavailable.
 */
export async function translateText(text, from = "ar", to = "en", config = {}) {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return "";

  const cacheKey = buildCacheKey(trimmed, from, to);
  if (sessionCache.has(cacheKey)) {
    return sessionCache.get(cacheKey);
  }

  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }

  const request = axiosInstance
    .post(ENDPOINTS.translate.text, { text: trimmed, from, to }, config)
    .then(({ data }) => data?.translatedText ?? data?.TranslatedText ?? "")
    .catch(() => null)
    .then((result) => {
      if (result != null && result !== "") {
        sessionCache.set(cacheKey, result);
      }
      return result;
    })
    .finally(() => {
      inflight.delete(cacheKey);
    });

  inflight.set(cacheKey, request);
  return request;
}

/**
 * Translate multiple unique strings with one request per distinct text (deduped + cached).
 * @returns {Promise<Map<string, string|null>>} Map of trimmed source text → translation.
 */
export async function translateTexts(texts, from = "ar", to = "en", config = {}) {
  const unique = [...new Set((texts ?? []).map((t) => t?.trim()).filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (text) => [text, await translateText(text, from, to, config)])
  );
  return new Map(entries);
}

export function clearTranslationSessionCache() {
  sessionCache.clear();
}

export function hasCachedTranslation(text, from = "ar", to = "en") {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return true;
  return sessionCache.has(buildCacheKey(trimmed, from, to));
}
