import { ORDER_STATUS } from "./orderStatus.js";

export const COD_LEGACY_STATUS_MAP = {
  [ORDER_STATUS.PAYMENT_CONFIRMED]: ORDER_STATUS.CONFIRMED,
  [ORDER_STATUS.PROCESSING]: ORDER_STATUS.PREPARING,
  [ORDER_STATUS.SHIPPED]: ORDER_STATUS.OUT_FOR_DELIVERY,
};

export const COD_STATUS_SEQUENCE = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.HANDED_TO_SHIPPING,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

export const COD_STATUS_META = {
  [ORDER_STATUS.PENDING]: {
    labelEn: "Pending",
    labelAr: "قيد الانتظار",
    dot: "bg-neutral-500",
    ring: "ring-neutral-200",
    shell:
      "border-neutral-300/80 bg-neutral-100/90 text-neutral-700 shadow-[0_2px_10px_-4px_rgba(82,82,82,0.2)]",
  },
  [ORDER_STATUS.CONFIRMED]: {
    labelEn: "Confirmed",
    labelAr: "مؤكد",
    dot: "bg-sky-500",
    ring: "ring-sky-200",
    shell: "border-sky-200/80 bg-sky-50/90 text-sky-800 shadow-[0_2px_10px_-4px_rgba(14,165,233,0.35)]",
  },
  [ORDER_STATUS.PREPARING]: {
    labelEn: "Preparing",
    labelAr: "قيد التجهيز",
    dot: "bg-amber-500",
    ring: "ring-amber-200",
    shell:
      "border-amber-200/80 bg-amber-50/90 text-amber-900 shadow-[0_2px_10px_-4px_rgba(245,158,11,0.35)]",
  },
  [ORDER_STATUS.HANDED_TO_SHIPPING]: {
    labelEn: "Handed to Shipping",
    labelAr: "تم التسليم للشحن",
    dot: "bg-indigo-500",
    ring: "ring-indigo-200",
    shell:
      "border-indigo-200/80 bg-indigo-50/90 text-indigo-800 shadow-[0_2px_10px_-4px_rgba(99,102,241,0.35)]",
  },
  [ORDER_STATUS.AT_LOCAL_HUB]: {
    labelEn: "At Local Hub",
    labelAr: "في المركز المحلي",
    dot: "bg-violet-500",
    ring: "ring-violet-200",
    shell:
      "border-violet-200/80 bg-violet-50/90 text-violet-800 shadow-[0_2px_10px_-4px_rgba(139,92,246,0.35)]",
  },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: {
    labelEn: "Out for Delivery",
    labelAr: "خرج للتسليم",
    dot: "bg-purple-500",
    ring: "ring-purple-200",
    shell:
      "border-purple-200/80 bg-purple-50/90 text-purple-800 shadow-[0_2px_10px_-4px_rgba(168,85,247,0.35)]",
  },
  [ORDER_STATUS.DELIVERED]: {
    labelEn: "Delivered",
    labelAr: "تم التسليم",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200",
    shell:
      "border-emerald-200/80 bg-emerald-50/90 text-emerald-800 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.35)]",
  },
  [ORDER_STATUS.CANCELLED]: {
    labelEn: "Cancelled",
    labelAr: "ملغي",
    dot: "bg-red-500",
    ring: "ring-red-200",
    shell: "border-red-200/80 bg-red-50/90 text-red-800 shadow-[0_2px_10px_-4px_rgba(239,68,68,0.35)]",
  },
};

export function normalizeCodStatus(status) {
  return COD_LEGACY_STATUS_MAP[status] ?? status;
}

export function getCodStatusLabel(status, locale = "en") {
  const meta = COD_STATUS_META[normalizeCodStatus(status)];
  if (!meta) return status;
  return locale === "ar" ? meta.labelAr : meta.labelEn;
}

export function getCodStatusDotClass(status) {
  return COD_STATUS_META[normalizeCodStatus(status)]?.dot ?? "bg-neutral-400";
}

export function getCodStatusTimelineDot(status, isActive = false) {
  const meta = COD_STATUS_META[normalizeCodStatus(status)];
  if (!meta) {
    return isActive
      ? "border-brand-accent bg-brand-accent ring-2 ring-brand-accent/25 ring-offset-2 ring-offset-brand-surface"
      : "border-brand-border bg-brand-surface";
  }

  const borderColor = meta.dot.replace("bg-", "border-");
  if (isActive) {
    return `${borderColor} ${meta.dot} ring-2 ${meta.ring} ring-offset-2 ring-offset-brand-surface`;
  }

  return `${borderColor} bg-brand-surface`;
}

export const COD_STATUS_SUCCESS_TOAST = {
  en: "Order status updated successfully.",
  ar: "تم تحديث حالة الطلب بنجاح.",
};

export function getCodTerminalMessage(status, locale = "en") {
  const normalized = normalizeCodStatus(status);
  if (normalized === ORDER_STATUS.DELIVERED) {
    return locale === "ar" ? "اكتمل الطلب" : "Order completed";
  }
  if (status === ORDER_STATUS.CANCELLED) {
    return locale === "ar"
      ? "لا يمكن تعديل هذا الطلب بعد الآن."
      : "This order can no longer be modified.";
  }
  return null;
}
