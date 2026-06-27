/**
 * Map color names (EN / AR) to display hex for swatches.
 * Longer keyword entries are checked first for better matching.
 */

const COLOR_ENTRIES = [
  { keywords: ["off white", "off-white", "أبيض عاجي", "كريمي فاتح"], hex: "#f4f0e8" },
  { keywords: ["dark brown", "dark chocolate", "بني غامق", "بني داكن"], hex: "#3d2914" },
  { keywords: ["light brown", "بني فاتح"], hex: "#a67c52" },
  { keywords: ["burgundy", "maroon", "wine", "عنابي", "خمري"], hex: "#722f37" },
  { keywords: ["navy", "dark blue", "كحلي", "أزرق غامق"], hex: "#1e3a5f" },
  { keywords: ["olive", "زيتي", "أخضر زيتوني"], hex: "#556b2f" },
  { keywords: ["gold", "golden", "ذهبي", "ذهب"], hex: "#c9a962" },
  { keywords: ["silver", "فضي", "فضة"], hex: "#c0c0c0" },
  { keywords: ["rose", "blush", "وردي", "زهري"], hex: "#d4a5a5" },
  { keywords: ["pink", "pinkish"], hex: "#e8b4b8" },
  { keywords: ["red", "crimson", "أحمر"], hex: "#b91c1c" },
  { keywords: ["orange", "rust", "برتقالي", "صدأ"], hex: "#c45c26" },
  { keywords: ["yellow", "mustard", "أصفر"], hex: "#d4a017" },
  { keywords: ["green", "emerald", "أخضر"], hex: "#2d6a4f" },
  { keywords: ["blue", "sky", "أزرق"], hex: "#3b82c6" },
  { keywords: ["purple", "violet", "بنفسجي", "موف"], hex: "#6b4c9a" },
  { keywords: ["grey", "gray", "charcoal", "رمادي", "فحمي"], hex: "#6b7280" },
  { keywords: ["black", "أسود", "noir"], hex: "#1a1a1a" },
  { keywords: ["white", "ivory", "أبيض", "عاجي"], hex: "#f8f6f2" },
  { keywords: ["cream", "beige", "nude", "sand", "بيج", "كريم", "رملي", "لون البشرة"], hex: "#e8dcc8" },
  { keywords: ["tan", "camel", "caramel", "جملي", "قهوة بالحليب"], hex: "#c4a574" },
  { keywords: ["brown", "chocolate", "cognac", "coffee", "mocha", "بني", "شوكولاتة"], hex: "#6b4423" },
  { keywords: ["chestnut", "walnut", "كستنائي"], hex: "#5c4033" },
  { keywords: ["taupe", "taupey"], hex: "#8b7d6b" },
];

const NEUTRAL_FALLBACK = "#9ca3af";

function normalizeColorName(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[''`´]/g, "")
    .replace(/\s+/g, " ");
}

export function getColorFromName(colorName) {
  const normalized = normalizeColorName(colorName);
  if (!normalized) return NEUTRAL_FALLBACK;

  const sorted = [...COLOR_ENTRIES].sort((a, b) => {
    const maxA = Math.max(...a.keywords.map((k) => k.length));
    const maxB = Math.max(...b.keywords.map((k) => k.length));
    return maxB - maxA;
  });

  for (const entry of sorted) {
    for (const keyword of entry.keywords) {
      const nk = normalizeColorName(keyword);
      if (normalized === nk || normalized.includes(nk)) {
        return entry.hex;
      }
    }
  }

  return NEUTRAL_FALLBACK;
}

/** Light swatches need a visible border on white backgrounds. */
export function isLightSwatch(hex) {
  if (!hex || !hex.startsWith("#")) return false;
  const raw = hex.slice(1);
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (full.length !== 6) return false;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.72;
}
