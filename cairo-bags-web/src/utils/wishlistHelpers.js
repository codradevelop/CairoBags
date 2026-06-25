import { resolveMediaUrl } from "./mediaUrl.js";

export function normalizeWishlistItem(item) {
  if (!item) return null;

  const primaryImagePath = item.primaryImage ?? item.PrimaryImage ?? null;

  return {
    productId: item.productId ?? item.ProductId,
    productNameAr: item.productNameAr ?? item.ProductNameAr ?? "",
    productNameEn: item.productNameEn ?? item.ProductNameEn ?? "",
    primaryImage: primaryImagePath ? resolveMediaUrl(primaryImagePath) : null,
    price: item.price ?? item.Price ?? null,
    compareAtPrice: item.compareAtPrice ?? item.CompareAtPrice ?? null,
    inStock: item.inStock ?? item.InStock ?? false,
    category: item.category ?? item.Category ?? "",
    addedAt: item.addedAt ?? item.AddedAt ?? null,
  };
}

export function normalizeWishlistResponse(data) {
  const items = Array.isArray(data?.items ?? data?.Items)
    ? (data.items ?? data.Items).map(normalizeWishlistItem).filter(Boolean)
    : [];

  return {
    items,
    count: data?.count ?? data?.Count ?? items.length,
  };
}

export function normalizeWishlistToggleResponse(data) {
  return {
    isInWishlist: data?.isInWishlist ?? data?.IsInWishlist ?? false,
    wishlistCount: data?.wishlistCount ?? data?.WishlistCount ?? 0,
  };
}

export function normalizeWishlistCountResponse(data) {
  return {
    count: data?.count ?? data?.Count ?? 0,
  };
}

export function getWishlistItemName(item, locale = "en") {
  if (!item) return "";
  return locale === "ar"
    ? item.productNameAr || item.productNameEn
    : item.productNameEn || item.productNameAr;
}
