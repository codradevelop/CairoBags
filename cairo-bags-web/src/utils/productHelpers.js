import { resolveMediaUrl } from "./mediaUrl.js";

export function pickTranslation(entity, locale = "en") {
  if (!entity) return null;
  const ar = entity.arabic ?? entity.Arabic;
  const en = entity.english ?? entity.English;
  return locale === "ar" ? ar ?? en : en ?? ar;
}

export function getProductName(product, locale = "en") {
  const t = pickTranslation(product, locale);
  return t?.name ?? t?.Name ?? `Product #${product?.id ?? product?.Id ?? ""}`;
}

export function getProductSlug(product, locale = "en") {
  const t = pickTranslation(product, locale);
  return t?.slug ?? t?.Slug ?? String(product?.id ?? product?.Id ?? "");
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

export function buildProductPath(product) {
  const id = getProductId(product);
  return `/products/${id}`;
}

export function buildCategoryPath(category) {
  const id = getCategoryId(category);
  return `/categories/${id}`;
}
