import { getCategoryId, getCategoryName, getCategorySlug } from "./productHelpers.js";

/**
 * Match landing collection cards to storefront categories by slug/name keywords.
 * IDs always come from the API response — never hardcoded here.
 */
const COLLECTION_MATCH_TERMS = {
  backpack: ["backpack", "backpacks"],
  luggage: ["luggage", "suitcase"],
  laptop: ["laptop", "laptop-bag", "laptop bag"],
  crossbody: ["crossbody", "cross-body", "cross body"],
  travel: ["travel set", "travel-set", "travel sets"],
};

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function categoryMatchesTerms(category, terms) {
  const nameEn = getCategoryName(category, "en").toLowerCase();
  const nameAr = getCategoryName(category, "ar").toLowerCase();
  const slugEn = normalize(getCategorySlug(category, "en"));
  const slugAr = normalize(getCategorySlug(category, "ar"));

  return terms.some((term) => {
    const normalizedTerm = normalize(term);
    return (
      nameEn.includes(term) ||
      nameAr.includes(term) ||
      slugEn.includes(normalizedTerm) ||
      slugAr.includes(normalizedTerm) ||
      nameEn.includes(normalizedTerm.replace(/-/g, " "))
    );
  });
}

export function findCategoryForCollection(categories, collectionKey) {
  if (!collectionKey || !Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  const terms = COLLECTION_MATCH_TERMS[collectionKey];
  if (!terms?.length) return null;

  return categories.find((category) => categoryMatchesTerms(category, terms)) ?? null;
}

export function buildShopCategoryHref(category) {
  const id = getCategoryId(category);
  if (id == null || id === "") return "/shop";
  return `/shop?categoryId=${encodeURIComponent(String(id))}`;
}

export function resolveCollectionShopHref(categories, collectionKey) {
  const category = findCategoryForCollection(categories, collectionKey);
  return category ? buildShopCategoryHref(category) : "/shop";
}

export function isValidShopCategoryId(categories, categoryId) {
  if (!categoryId) return true;
  if (!Array.isArray(categories) || categories.length === 0) return true;
  return categories.some((category) => String(getCategoryId(category)) === String(categoryId));
}
