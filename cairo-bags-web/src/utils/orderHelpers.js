import { ORDER_STATUS } from "../constants/orderStatus.js";
import { resolveMediaUrl } from "./mediaUrl.js";

export function getOrderId(order) {
  return order?.orderId ?? order?.OrderId ?? order?.order?.orderId ?? order?.Order?.OrderId;
}

export function getOrderNumber(order) {
  return (
    order?.orderNumber ??
    order?.OrderNumber ??
    order?.order?.orderNumber ??
    order?.Order?.OrderNumber ??
    ""
  );
}

export function getOrderStatus(order) {
  return (
    order?.orderStatus ??
    order?.OrderStatus ??
    order?.order?.orderStatus ??
    order?.Order?.OrderStatus ??
    ""
  );
}

export function getPaymentStatus(order) {
  return order?.paymentStatus ?? order?.PaymentStatus ?? null;
}

export function getOrderTotal(order) {
  return (
    order?.totalAmount ??
    order?.TotalAmount ??
    order?.order?.totalAmount ??
    order?.Order?.TotalAmount ??
    0
  );
}

export function getOrderCreatedAt(order) {
  return (
    order?.createdAt ??
    order?.CreatedAt ??
    order?.order?.createdAt ??
    order?.Order?.CreatedAt ??
    null
  );
}

export function getOrderItemsCount(order) {
  return order?.itemsCount ?? order?.ItemsCount ?? order?.items?.length ?? 0;
}

export function getOrderPrimaryImage(order) {
  const path = order?.primaryProductImage ?? order?.PrimaryProductImage ?? null;
  return path ? resolveMediaUrl(path) : null;
}

export function getOrderItemImage(item) {
  const path = item?.imageUrl ?? item?.ImageUrl ?? null;
  return path ? resolveMediaUrl(path) : null;
}

export function getPaymentProofImageUrl(image) {
  const path = image?.imageUrl ?? image?.ImageUrl ?? null;
  return path ? resolveMediaUrl(path) : null;
}

export function getOrderDetailInfo(detail) {
  return detail?.order ?? detail?.Order ?? detail;
}

export function getOrderDetailItems(detail) {
  return detail?.items ?? detail?.Items ?? [];
}

export function getOrderDetailShipping(detail) {
  return detail?.shippingAddress ?? detail?.ShippingAddress ?? null;
}

export function getOrderDetailPayment(detail) {
  return detail?.payment ?? detail?.Payment ?? null;
}

export function getOrderDetailCoupon(detail) {
  return detail?.coupon ?? detail?.Coupon ?? null;
}

export function getOrderStatusHistory(detail) {
  return detail?.statusHistory ?? detail?.StatusHistory ?? [];
}

export function getOrderItemName(item, locale = "en") {
  return locale === "ar"
    ? item?.productNameAr ?? item?.ProductNameAr ?? item?.productNameEn ?? item?.ProductNameEn
    : item?.productNameEn ?? item?.ProductNameEn ?? item?.productNameAr ?? item?.ProductNameAr;
}

export function getOrderItemColor(item, locale = "en") {
  return locale === "ar"
    ? item?.colorNameAr ?? item?.ColorNameAr ?? item?.colorNameEn ?? item?.ColorNameEn
    : item?.colorNameEn ?? item?.ColorNameEn ?? item?.colorNameAr ?? item?.ColorNameAr;
}

export function canCancelOrder(status) {
  const normalized = status ?? "";
  return (
    normalized === ORDER_STATUS.PENDING ||
    normalized === ORDER_STATUS.AWAITING_PAYMENT ||
    normalized === ORDER_STATUS.PAYMENT_PROOF_SUBMITTED
  );
}

export function formatOrderDate(value, locale = "en") {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const EXCLUDED_SALE_STATUSES = new Set([
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
]);

export function isCountableSaleOrder(order) {
  const status = getOrderStatus(order);
  return status && !EXCLUDED_SALE_STATUSES.has(status);
}

export function getWeeklySalesData(orders = [], locale = "en") {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));

    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const dayOrders = orders.filter((order) => {
      if (!isCountableSaleOrder(order)) return false;
      const createdAt = getOrderCreatedAt(order);
      if (!createdAt) return false;
      const created = new Date(createdAt);
      return created >= day && created < nextDay;
    });

    const sales = dayOrders.reduce(
      (sum, order) => sum + Number(getOrderTotal(order) || 0),
      0
    );

    return {
      day: new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
        weekday: "short",
      }).format(day),
      sales,
      orders: dayOrders.length,
    };
  });
}

export function getWeeklySalesTotal(orders = []) {
  return getWeeklySalesData(orders).reduce((sum, item) => sum + item.sales, 0);
}
