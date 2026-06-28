import { PAYMENT_STATUS } from "../constants/paymentStatus.js";
import { ORDER_STATUS } from "../constants/orderStatus.js";

export const TIMELINE_EVENT = {
  PAYMENT_REJECTED: "payment_rejected",
  PROOF_SUBMITTED: "proof_submitted",
  PAYMENT_APPROVED: "payment_approved",
  ORDER_STATUS: "order_status",
};

const PAYMENT_REVIEW_STATUSES = new Set([
  ORDER_STATUS.PAYMENT_PROOF_SUBMITTED,
  ORDER_STATUS.PAYMENT_UNDER_REVIEW,
]);

const SYSTEM_PROOF_NOTE = "Customer submitted payment proof.";

function isRejectionHistoryEntry(entry) {
  const newStatus = entry.newStatus ?? entry.NewStatus;
  const oldStatus = entry.oldStatus ?? entry.OldStatus;
  const notes = entry.notes ?? entry.Notes;

  return (
    newStatus === ORDER_STATUS.AWAITING_PAYMENT &&
    PAYMENT_REVIEW_STATUSES.has(oldStatus) &&
    Boolean(notes?.trim()) &&
    notes.trim() !== SYSTEM_PROOF_NOTE
  );
}

export function getPaymentStatusValue(payment) {
  return payment?.paymentStatus ?? payment?.PaymentStatus ?? "";
}

export function getPaymentRejectionReason(payment) {
  return (
    payment?.rejectionReason ??
    payment?.RejectionReason ??
    payment?.reviewNotes ??
    payment?.ReviewNotes ??
    ""
  );
}

export function getPaymentRejectedAt(payment) {
  return (
    payment?.rejectedAt ??
    payment?.RejectedAt ??
    payment?.reviewedAt ??
    payment?.ReviewedAt ??
    null
  );
}

export function isPaymentRejected(payment) {
  return getPaymentStatusValue(payment) === PAYMENT_STATUS.REJECTED;
}

export function canResubmitPaymentProof(order, payment) {
  if (!payment || !order) return false;
  const orderStatus =
    order?.orderStatus ?? order?.OrderStatus ?? order?.status ?? order?.Status ?? "";
  if (orderStatus !== ORDER_STATUS.AWAITING_PAYMENT) return false;
  return getPaymentStatusValue(payment) === PAYMENT_STATUS.REJECTED;
}

export function buildPaymentResubmitState(order, payment) {
  const orderId = order?.orderId ?? order?.OrderId ?? order?.id ?? order?.Id;
  const orderNumber = order?.orderNumber ?? order?.OrderNumber ?? "";
  const totalAmount =
    order?.totalAmount ?? order?.TotalAmount ?? payment?.amount ?? payment?.Amount ?? 0;

  return {
    resubmit: true,
    returnTo: `/account/orders/${orderId}`,
    checkout: {
      orderId,
      orderNumber,
      totalAmount,
      paymentMethod: payment?.paymentMethod ?? payment?.PaymentMethod ?? "",
      paymentStatus: payment?.paymentStatus ?? payment?.PaymentStatus ?? "",
      nextStepMessage: "",
    },
  };
}

export function buildOrderTimelineEntries(history = [], payment = null) {
  const entries = [];

  for (const entry of history) {
    const newStatus = entry.newStatus ?? entry.NewStatus;
    const notes = entry.notes ?? entry.Notes;
    const createdAt = entry.createdAt ?? entry.CreatedAt;
    const keyBase = `${newStatus}-${createdAt}`;

    if (isRejectionHistoryEntry(entry)) {
      entries.push({
        kind: TIMELINE_EVENT.PAYMENT_REJECTED,
        createdAt,
        reason: notes?.trim() ?? "",
        rejectedAt: createdAt,
        key: `rejection-${keyBase}`,
      });
      continue;
    }

    if (newStatus === ORDER_STATUS.PAYMENT_PROOF_SUBMITTED) {
      entries.push({
        kind: TIMELINE_EVENT.PROOF_SUBMITTED,
        createdAt,
        key: `proof-${keyBase}`,
      });
      continue;
    }

    if (newStatus === ORDER_STATUS.PAYMENT_CONFIRMED) {
      entries.push({
        kind: TIMELINE_EVENT.PAYMENT_APPROVED,
        createdAt,
        key: `approved-${keyBase}`,
      });
      continue;
    }

    entries.push({
      kind: TIMELINE_EVENT.ORDER_STATUS,
      status: newStatus,
      notes: notes && notes !== SYSTEM_PROOF_NOTE ? notes : null,
      createdAt,
      key: `status-${keyBase}`,
    });
  }

  const hasRejectionEvent = entries.some((entry) => entry.kind === TIMELINE_EVENT.PAYMENT_REJECTED);
  if (!hasRejectionEvent && isPaymentRejected(payment)) {
    const rejectedAt = getPaymentRejectedAt(payment);
    const reason = getPaymentRejectionReason(payment);
    if (rejectedAt || reason) {
      entries.push({
        kind: TIMELINE_EVENT.PAYMENT_REJECTED,
        createdAt: rejectedAt || new Date().toISOString(),
        reason,
        rejectedAt: rejectedAt || new Date().toISOString(),
        key: `rejection-fallback-${rejectedAt ?? "current"}`,
      });
    }
  }

  return entries.sort(
    (a, b) => new Date(b.createdAt ?? b.rejectedAt) - new Date(a.createdAt ?? a.rejectedAt)
  );
}
