import { resolveMediaUrl } from "./mediaUrl.js";
import { normalizeSlug } from "./slugHelper.js";

function getTranslationField(entity, locale, keys) {
  if (!entity) return "";
  const ar = entity.arabic ?? entity.Arabic;
  const en = entity.english ?? entity.English;
  const primary = locale === "ar" ? ar : en;
  const fallback = locale === "ar" ? en : ar;

  for (const key of keys) {
    const value = primary?.[key];
    if (value != null && String(value).trim()) return value;
  }

  for (const key of keys) {
    const value = fallback?.[key];
    if (value != null && String(value).trim()) return value;
  }

  return "";
}

export function pickTranslation(entity, locale = "en") {
  if (!entity) return null;
  const ar = entity.arabic ?? entity.Arabic;
  const en = entity.english ?? entity.English;
  const primary = locale === "ar" ? ar : en;
  const fallback = locale === "ar" ? en : ar;

  return {
    ...(fallback ?? {}),
    ...(primary ?? {}),
    name: getTranslationField(entity, locale, ["name", "Name"]),
    slug: getTranslationField(entity, locale, ["slug", "Slug"]),
    shortDescription: getTranslationField(entity, locale, ["shortDescription", "ShortDescription"]),
    description: getTranslationField(entity, locale, ["description", "Description"]),
    metaTitle: getTranslationField(entity, locale, ["metaTitle", "MetaTitle"]),
    metaDescription: getTranslationField(entity, locale, ["metaDescription", "MetaDescription"]),
  };
}

export function getProductName(product, locale = "en") {
  const t = pickTranslation(product, locale);
  return t?.name ?? t?.Name ?? `Product #${product?.id ?? product?.Id ?? ""}`;
}

export function getCategorySlug(category, locale = "en") {
  const t = pickTranslation(category, locale);
  const slug = t?.slug ?? t?.Slug;
  if (slug) return slug;
  const id = getCategoryId(category);
  return id != null ? String(id) : "";
}

export function getProductSlug(product, locale = "en") {
  const t = pickTranslation(product, locale);
  const slug = t?.slug ?? t?.Slug;
  if (slug) return slug;
  const id = getProductId(product);
  return id != null ? String(id) : "";
}

function encodePathSegment(value) {
  return encodeURIComponent(normalizeSlug(String(value ?? "")));
}

export function buildProductPath(product, locale = "en") {
  const slug = getProductSlug(product, locale);
  if (!slug) return "/shop";
  return `/products/${encodePathSegment(slug)}`;
}

export function buildCategoryPath(category, locale = "en") {
  const slug = getCategorySlug(category, locale);
  if (!slug) return "/shop";
  return `/categories/${encodePathSegment(slug)}`;
}

export function buildProductPathFromRefs(
  { productId, productSlugEn, productSlugAr, slugEn, slugAr, english, arabic },
  locale = "en"
) {
  const slug =
    locale === "ar"
      ? productSlugAr ?? slugAr ?? arabic?.slug ?? arabic?.Slug ?? productSlugEn ?? slugEn ?? english?.slug ?? english?.Slug
      : productSlugEn ?? slugEn ?? english?.slug ?? english?.Slug ?? productSlugAr ?? slugAr ?? arabic?.slug ?? arabic?.Slug;

  if (slug) return `/products/${encodePathSegment(slug)}`;
  if (productId != null) return `/products/${productId}`;
  return "/shop";
}

export function getProductShortDescription(product, locale = "en") {
  const t = pickTranslation(product, locale);
  return t?.shortDescription ?? t?.ShortDescription ?? "";
}

export function getProductDescription(product, locale = "en") {
  const t = pickTranslation(product, locale);
  return t?.description ?? t?.Description ?? "";
}

export function getCategoryName(category, locale = "en") {
  const t = pickTranslation(category, locale);
  return t?.name ?? t?.Name ?? `Category #${category?.id ?? category?.Id ?? ""}`;
}

export function getCategoryDescription(category, locale = "en") {
  const t = pickTranslation(category, locale);
  return t?.description ?? t?.Description ?? "";
}

export function getProductId(product) {
  return product?.id ?? product?.Id;
}

export function getCategoryId(category) {
  return category?.id ?? category?.Id;
}

export function getCategoryImageUrl(category) {
  const path = category?.imageUrl ?? category?.ImageUrl ?? null;
  return path ? resolveMediaUrl(path) : null;
}

/** Raw API path — use for form state / API payloads, not for <img src>. */
export function getPrimaryImagePath(product) {
  return product?.primaryImageUrl ?? product?.PrimaryImageUrl ?? null;
}

export function getPrimaryImageUrl(product) {
  const path = getPrimaryImagePath(product);
  return path ? resolveMediaUrl(path) : null;
}

export function getProductImageAssetUrl(image) {
  const path =
    image?.thumbnailUrl ??
    image?.ThumbnailUrl ??
    image?.imageUrl ??
    image?.ImageUrl ??
    null;
  return path ? resolveMediaUrl(path) : null;
}

export function getProductImageUrl(product) {
  const primary = getPrimaryImagePath(product);
  if (primary) return resolveMediaUrl(primary);

  const images = getProductImages(product);
  const image = images.find((item) => item.isPrimary ?? item.IsPrimary) ?? images[0];
  return getProductImageAssetUrl(image);
}

export function getProductPriceRange(product) {
  const low = product?.lowestPrice ?? product?.LowestPrice;
  const high = product?.highestPrice ?? product?.HighestPrice;
  return { low, high };
}

export function isProductInStock(product) {
  return product?.isInStock ?? product?.IsInStock ?? false;
}

export function isProductFeatured(product) {
  return product?.isFeatured ?? product?.IsFeatured ?? false;
}

export function isProductNewArrival(product) {
  return product?.isNewArrival ?? product?.IsNewArrival ?? false;
}

export function getProductComparePrice(product) {
  return product?.compareAtPrice ?? product?.CompareAtPrice ?? null;
}

export function getVariantId(variant) {
  return variant?.id ?? variant?.Id;
}

export function getVariantColorName(variant, locale = "en") {
  if (!variant) return "";
  return locale === "ar"
    ? variant.colorNameAr ?? variant.ColorNameAr ?? variant.colorNameEn ?? variant.ColorNameEn
    : variant.colorNameEn ?? variant.ColorNameEn ?? variant.colorNameAr ?? variant.ColorNameAr;
}

export function getVariantSizeName(variant, locale = "en") {
  if (!variant) return "";
  return locale === "ar"
    ? variant.sizeNameAr ?? variant.SizeNameAr ?? variant.sizeNameEn ?? variant.SizeNameEn ?? ""
    : variant.sizeNameEn ?? variant.SizeNameEn ?? variant.sizeNameAr ?? variant.SizeNameAr ?? "";
}

export function getVariantPrice(variant) {
  return variant?.price ?? variant?.Price ?? 0;
}

export function getVariantComparePrice(variant) {
  return variant?.compareAtPrice ?? variant?.CompareAtPrice ?? null;
}

export function isVariantInStock(variant) {
  return variant?.isInStock ?? variant?.IsInStock ?? false;
}

export function getVariantAvailableStock(variant) {
  const available = variant?.availableStock ?? variant?.AvailableStock;
  if (available != null) return Math.max(0, Number(available));
  return isVariantInStock(variant) ? 99 : 0;
}

export function getVariantImageForColor(variants, colorName, locale, images = []) {
  if (!colorName || !variants.length) return null;
  const variantIds = variants
    .filter((v) => getVariantColorName(v, locale) === colorName)
    .map((v) => getVariantId(v))
    .filter(Boolean);

  if (!variantIds.length) return null;

  const match = images.find((img) => variantIds.includes(img?.variantId ?? img?.VariantId));
  return match ? getProductImageAssetUrl(match) : null;
}

export function getProductImages(product) {
  return product?.images ?? product?.Images ?? [];
}

export function getProductVariants(product) {
  return product?.variants ?? product?.Variants ?? [];
}

export function formatPrice(amount, locale = "en") {
  if (amount == null || Number.isNaN(Number(amount))) return "";
  const value = Number(amount);
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(value);
}
