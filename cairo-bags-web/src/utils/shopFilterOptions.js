import * as productService from "../services/productService.js";

let cachedColors = null;
let inflightRequest = null;

function normalizeFilterColors(data) {
  const raw = data?.colors ?? data?.Colors ?? [];
  if (!Array.isArray(raw)) return [];

  return raw
    .map((color) => {
      const name = (color?.name ?? color?.Name ?? "").trim();
      const nameAr = (color?.nameAr ?? color?.NameAr ?? "").trim();
      const hex = color?.hex ?? color?.Hex ?? "#9ca3af";
      const count = color?.count ?? color?.Count ?? 0;
      const inStockCount = color?.inStockCount ?? color?.InStockCount ?? 0;
      const key = name.toLowerCase() || nameAr.toLowerCase();

      return { name, nameAr, hex, count, inStockCount, key };
    })
    .filter((color) => color.key && color.count > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

export function invalidateShopFilterOptionsCache() {
  cachedColors = null;
  inflightRequest = null;
}

export async function fetchShopFilterOptions(force = false) {
  if (!force && cachedColors) {
    return cachedColors;
  }

  if (!force && inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = productService
    .getProductFilterOptions()
    .then((data) => {
      const colors = normalizeFilterColors(data);
      cachedColors = colors;
      inflightRequest = null;
      return colors;
    })
    .catch((error) => {
      inflightRequest = null;
      throw error;
    });

  return inflightRequest;
}
