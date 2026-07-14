import { getCategoryId, getCategoryName, getCategorySlug } from "./productHelpers.js";

/**
 * Match landing collection cards to storefront categories by slug/name keywords.
 * IDs always come from the API response — never hardcoded here.
 */
const COLLECTION_MATCH_TERMS = {
  backpack: ["backpack", "backpacks", "back-pack", "حقائب الظهر", "حقيبة ظهر"],
  handbag: ["hand bag", "hand bags", "handbag", "handbags", "hand-bags", "حقائب يد", "حقيبة يد"],
  laptop: ["laptop", "laptop-bag", "laptop-bags", "laptop bag", "laptop bags", "حقائب اللابتوب", "لابتوب"],
  crossbody: ["crossbody", "cross-body", "cross body", "حقائب كروس", "كروس"],
  travel: ["travel set", "travel-set", "travel-sets", "travel sets", "complete sets", "أطقم السفر", "مجموعات سفر"],
};

function normalize(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function flattenCategories(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return [];

  const flat = [];
  const walk = (items) => {
    for (const item of items) {
      if (!item) continue;
      flat.push(item);
      const children = item.children ?? item.Children;
      if (Array.isArray(children) && children.length > 0) walk(children);
    }
  };

  walk(categories);
  return flat.length > 0 ? flat : categories;
}

function categoryMatchesTerms(category, terms, labels = []) {
  const nameEn = getCategoryName(category, "en").toLowerCase();
  const nameAr = getCategoryName(category, "ar").toLowerCase();
  const slugEn = normalize(getCategorySlug(category, "en"));
  const slugAr = normalize(getCategorySlug(category, "ar"));

  const allTerms = [...(terms ?? [])];
  for (const label of labels) {
    if (!label) continue;
    allTerms.push(String(label).toLowerCase(), normalize(label));
  }

  return allTerms.some((term) => {
    const normalizedTerm = normalize(term);
    const spacedTerm = normalizedTerm.replace(/-/g, " ");
    return (
      nameEn.includes(term) ||
      nameAr.includes(term) ||
      term.includes(nameEn) ||
      term.includes(nameAr) ||
      slugEn.includes(normalizedTerm) ||
      slugAr.includes(normalizedTerm) ||
      normalizedTerm.includes(slugEn) ||
      normalizedTerm.includes(slugAr) ||
      nameEn.includes(spacedTerm) ||
      nameAr.includes(spacedTerm)
    );
  });
}

export function findCategoryForCollection(categories, collectionKey, labels = {}) {
  if (!collectionKey) return null;

  const flat = flattenCategories(categories);
  if (flat.length === 0) return null;

  const terms = COLLECTION_MATCH_TERMS[collectionKey] ?? [];
  const labelList = [labels.titleEn, labels.titleAr].filter(Boolean);

  return flat.find((category) => categoryMatchesTerms(category, terms, labelList)) ?? null;
}

export function buildShopCategoryHref(category) {
  const id = getCategoryId(category);
  if (id == null || id === "") return "/shop";
  return `/shop?categoryId=${encodeURIComponent(String(id))}`;
}

export function resolveCollectionShopHref(categories, collectionKey, labels = {}) {
  const category = findCategoryForCollection(categories, collectionKey, labels);
  return category ? buildShopCategoryHref(category) : "/shop";
}

export function isValidShopCategoryId(categories, categoryId) {
  if (!categoryId) return true;

  const flat = flattenCategories(categories);
  if (flat.length === 0) return true;

  return flat.some((category) => String(getCategoryId(category)) === String(categoryId));
}
