import { ORDER_STATUS } from "./orderStatus.js";
import { PAYMENT_STATUS } from "./paymentStatus.js";

export const ORDER_STATUS_META = {
  [ORDER_STATUS.PENDING]: {
    labelEn: "Pending",
    labelAr: "قيد الانتظار",
    variant: "warning",
  },
  [ORDER_STATUS.AWAITING_PAYMENT]: {
    labelEn: "Awaiting Payment",
    labelAr: "بانتظار الدفع",
    variant: "warning",
  },
  [ORDER_STATUS.PAYMENT_PROOF_SUBMITTED]: {
    labelEn: "Proof Submitted",
    labelAr: "تم رفع الإثبات",
    variant: "accent",
  },
  [ORDER_STATUS.PAYMENT_UNDER_REVIEW]: {
    labelEn: "Under Review",
    labelAr: "قيد المراجعة",
    variant: "accent",
  },
  [ORDER_STATUS.PAYMENT_CONFIRMED]: {
    labelEn: "Payment Confirmed",
    labelAr: "تم تأكيد الدفع",
    variant: "success",
  },
  [ORDER_STATUS.PROCESSING]: {
    labelEn: "Processing",
    labelAr: "قيد التجهيز",
    variant: "primary",
  },
  [ORDER_STATUS.SHIPPED]: {
    labelEn: "Shipped",
    labelAr: "تم الشحن",
    variant: "primary",
  },
  [ORDER_STATUS.DELIVERED]: {
    labelEn: "Delivered",
    labelAr: "تم التسليم",
    variant: "success",
  },
  [ORDER_STATUS.COMPLETED]: {
    labelEn: "Completed",
    labelAr: "مكتمل",
    variant: "success",
  },
  [ORDER_STATUS.CANCELLED]: {
    labelEn: "Cancelled",
    labelAr: "ملغي",
    variant: "outline",
  },
  [ORDER_STATUS.REFUNDED]: {
    labelEn: "Refunded",
    labelAr: "مسترد",
    variant: "outline",
  },
  [ORDER_STATUS.CONFIRMED]: {
    labelEn: "Confirmed",
    labelAr: "مؤكد",
    variant: "success",
  },
  [ORDER_STATUS.PREPARING]: {
    labelEn: "Preparing",
    labelAr: "قيد التجهيز",
    variant: "primary",
  },
  [ORDER_STATUS.HANDED_TO_SHIPPING]: {
    labelEn: "Handed to Shipping",
    labelAr: "تم التسليم للشحن",
    variant: "primary",
  },
  [ORDER_STATUS.AT_LOCAL_HUB]: {
    labelEn: "At Local Hub",
    labelAr: "في المركز المحلي",
    variant: "primary",
  },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: {
    labelEn: "Out for Delivery",
    labelAr: "خرج للتسليم",
    variant: "primary",
  },
};

export const PAYMENT_STATUS_META = {
  [PAYMENT_STATUS.PENDING]: { labelEn: "Pending", labelAr: "قيد الانتظار", variant: "warning" },
  [PAYMENT_STATUS.PROOF_SUBMITTED]: { labelEn: "Proof Submitted", labelAr: "تم رفع الإثبات", variant: "accent" },
  [PAYMENT_STATUS.UNDER_REVIEW]: { labelEn: "Under Review", labelAr: "قيد المراجعة", variant: "accent" },
  [PAYMENT_STATUS.CONFIRMED]: { labelEn: "Confirmed", labelAr: "مؤكد", variant: "success" },
  [PAYMENT_STATUS.REJECTED]: { labelEn: "Rejected", labelAr: "مرفوض", variant: "error" },
  [PAYMENT_STATUS.REFUNDED]: { labelEn: "Refunded", labelAr: "مسترد", variant: "outline" },
};

export function getOrderStatusLabel(status, locale = "en") {
  const meta = ORDER_STATUS_META[status];
  if (!meta) return status;
  return locale === "ar" ? meta.labelAr : meta.labelEn;
}

export function getOrderStatusVariant(status) {
  return ORDER_STATUS_META[status]?.variant ?? "default";
}

export function getPaymentStatusLabel(status, locale = "en") {
  const meta = PAYMENT_STATUS_META[status];
  if (!meta) return status;
  return locale === "ar" ? meta.labelAr : meta.labelEn;
}

export function getPaymentStatusVariant(status) {
  return PAYMENT_STATUS_META[status]?.variant ?? "default";
}

export const ORDER_STATUS_FILTER_OPTIONS = Object.entries(ORDER_STATUS_META).map(([value, meta]) => ({
  value,
  labelEn: meta.labelEn,
  labelAr: meta.labelAr,
}));
