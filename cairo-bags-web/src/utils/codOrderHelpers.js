import { ORDER_STATUS } from "../constants/orderStatus.js";
import { normalizeCodStatus } from "../constants/codOrderStatus.js";

const CASH_ON_DELIVERY = "CashOnDelivery";

const CANCELLABLE_COD_STATUSES = new Set([
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.HANDED_TO_SHIPPING,
  ORDER_STATUS.PAYMENT_CONFIRMED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.AT_LOCAL_HUB,
]);

const COD_NEXT_STATUS = {
  [ORDER_STATUS.PENDING]: ORDER_STATUS.CONFIRMED,
  [ORDER_STATUS.CONFIRMED]: ORDER_STATUS.PREPARING,
  [ORDER_STATUS.PREPARING]: ORDER_STATUS.HANDED_TO_SHIPPING,
  [ORDER_STATUS.HANDED_TO_SHIPPING]: ORDER_STATUS.OUT_FOR_DELIVERY,
  [ORDER_STATUS.OUT_FOR_DELIVERY]: ORDER_STATUS.DELIVERED,
  [ORDER_STATUS.AT_LOCAL_HUB]: ORDER_STATUS.OUT_FOR_DELIVERY,
};

export function getOrderPaymentMethod(order) {
  return (
    order?.paymentMethod ??
    order?.PaymentMethod ??
    order?.payment?.paymentMethod ??
    order?.payment?.PaymentMethod ??
    order?.Payment?.PaymentMethod ??
    ""
  );
}

export function isCashOnDeliveryOrder(order) {
  return getOrderPaymentMethod(order) === CASH_ON_DELIVERY;
}

export function isCodOrderTerminal(status) {
  const normalized = normalizeCodStatus(status);
  return normalized === ORDER_STATUS.DELIVERED || status === ORDER_STATUS.CANCELLED;
}

export function getAvailableCodTargetStatuses(currentStatus) {
  const normalized = normalizeCodStatus(currentStatus);
  if (isCodOrderTerminal(currentStatus)) return [];

  const targets = [];
  const nextStatus = COD_NEXT_STATUS[normalized];
  if (nextStatus) targets.push(nextStatus);

  if (currentStatus === ORDER_STATUS.SHIPPED && !targets.includes(ORDER_STATUS.DELIVERED)) {
    targets.push(ORDER_STATUS.DELIVERED);
  }

  if (CANCELLABLE_COD_STATUSES.has(currentStatus) || CANCELLABLE_COD_STATUSES.has(normalized)) {
    targets.push(ORDER_STATUS.CANCELLED);
  }

  return targets;
}

export function canTransitionCodStatus(fromStatus, toStatus) {
  if (!fromStatus || !toStatus || fromStatus === toStatus) return false;
  return getAvailableCodTargetStatuses(fromStatus).includes(toStatus);
}

export function getCodHistoryChangedBy(entry) {
  return entry?.changedByName ?? entry?.ChangedByName ?? null;
}

export function getCodHistoryOldStatus(entry) {
  return entry?.oldStatus ?? entry?.OldStatus ?? null;
}

export function getCodHistoryNewStatus(entry) {
  return entry?.newStatus ?? entry?.NewStatus ?? "";
}
