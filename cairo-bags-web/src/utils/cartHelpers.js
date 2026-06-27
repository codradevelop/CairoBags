import { resolveMediaUrl } from "./mediaUrl.js";
import { buildProductPathFromRefs } from "./productHelpers.js";

export function getCartItems(cart) {
  return cart?.items ?? cart?.Items ?? [];
}

export function getCartItemVariantId(item) {
  return item?.variantId ?? item?.VariantId;
}

export function getCartItemProductId(item) {
  return item?.productId ?? item?.ProductId;
}

export function getCartItemName(item, locale = "en") {
  if (!item) return "";
  return locale === "ar"
    ? item.productNameAr ?? item.ProductNameAr ?? item.productNameEn ?? item.ProductNameEn
    : item.productNameEn ?? item.ProductNameEn ?? item.productNameAr ?? item.ProductNameAr;
}

export function getCartItemColor(item, locale = "en") {
  if (!item) return "";
  return locale === "ar"
    ? item.colorNameAr ?? item.ColorNameAr ?? item.colorNameEn ?? item.ColorNameEn
    : item.colorNameEn ?? item.ColorNameEn ?? item.colorNameAr ?? item.ColorNameAr;
}

export function getCartItemImage(item) {
  const path = item?.imageUrl ?? item?.ImageUrl ?? null;
  return path ? resolveMediaUrl(path) : null;
}

export function getCartItemUnitPrice(item) {
  return item?.unitPrice ?? item?.UnitPrice ?? 0;
}

export function getCartItemLineTotal(item) {
  return item?.lineTotal ?? item?.LineTotal ?? 0;
}

export function getCartItemQuantity(item) {
  return item?.quantity ?? item?.Quantity ?? 0;
}

export function getCartItemAvailableStock(item) {
  return item?.availableStock ?? item?.AvailableStock ?? 0;
}

export function getCartItemMaxQuantity(item) {
  return item?.maxAllowedQuantity ?? item?.MaxAllowedQuantity ?? getCartItemAvailableStock(item);
}

export function getCartItemProductPath(item, locale = "en") {
  return buildProductPathFromRefs(
    {
      productId: getCartItemProductId(item),
      productSlugAr: item?.productSlugAr ?? item?.ProductSlugAr,
      productSlugEn: item?.productSlugEn ?? item?.ProductSlugEn,
    },
    locale
  );
}

export function hasStockWarning(item) {
  return (
    (item?.stockChanged ?? item?.StockChanged) === true ||
    getCartItemQuantity(item) > getCartItemAvailableStock(item)
  );
}

export function formatCheckoutResponse(data) {
  return {
    orderId: data?.orderId ?? data?.OrderId,
    orderNumber: data?.orderNumber ?? data?.OrderNumber,
    subTotal: data?.subTotal ?? data?.SubTotal ?? 0,
    discountAmount: data?.discountAmount ?? data?.DiscountAmount ?? 0,
    shippingFee: data?.shippingFee ?? data?.ShippingFee ?? 0,
    totalAmount: data?.totalAmount ?? data?.TotalAmount ?? 0,
    paymentMethod: data?.paymentMethod ?? data?.PaymentMethod ?? "",
    paymentStatus: data?.paymentStatus ?? data?.PaymentStatus ?? "",
    orderStatus: data?.orderStatus ?? data?.OrderStatus ?? "",
    nextStepMessage: data?.nextStepMessage ?? data?.NextStepMessage ?? "",
  };
}
