import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

const STATUS_STYLES = {
  Active: {
    dot: "bg-emerald-500",
    shell:
      "border-emerald-200/80 bg-emerald-50/90 text-emerald-800 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.35)]",
    labelEn: "Active",
    labelAr: "نشط",
  },
  Scheduled: {
    dot: "bg-amber-500",
    shell:
      "border-amber-200/80 bg-amber-50/90 text-amber-900 shadow-[0_2px_10px_-4px_rgba(245,158,11,0.35)]",
    labelEn: "Scheduled",
    labelAr: "مجدول",
  },
  Expired: {
    dot: "bg-red-500",
    shell: "border-red-200/80 bg-red-50/90 text-red-800 shadow-[0_2px_10px_-4px_rgba(239,68,68,0.35)]",
    labelEn: "Expired",
    labelAr: "منتهي",
  },
  Inactive: {
    dot: "bg-neutral-500",
    shell:
      "border-neutral-300/80 bg-neutral-100/90 text-neutral-700 shadow-[0_2px_10px_-4px_rgba(82,82,82,0.2)]",
    labelEn: "Inactive",
    labelAr: "غير نشط",
  },
  Draft: {
    dot: "bg-sky-500",
    shell: "border-sky-200/80 bg-sky-50/90 text-sky-800 shadow-[0_2px_10px_-4px_rgba(14,165,233,0.35)]",
    labelEn: "Draft",
    labelAr: "مسودة",
  },
  "Maximum Uses Reached": {
    dot: "bg-red-500",
    shell: "border-red-200/80 bg-red-50/90 text-red-800 shadow-[0_2px_10px_-4px_rgba(239,68,68,0.35)]",
    labelEn: "Max Uses Reached",
    labelAr: "الحد الأقصى",
  },
};

const FALLBACK_STYLE = STATUS_STYLES.Inactive;

export function CouponStatusBadge({ status, className }) {
  const { locale } = useLocale();
  const config = STATUS_STYLES[status] ?? FALLBACK_STYLE;
  const label = locale === "ar" ? config.labelAr : config.labelEn;

  return (
    <span
      role="status"
      aria-label={`${locale === "ar" ? "حالة الكود" : "Coupon status"}: ${label}`}
      className={cn(
        "inline-flex h-7 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-full border px-2.5",
        "text-[11px] font-semibold tracking-[0.02em] transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-md",
        config.shell,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", config.dot)} aria-hidden="true" />
      {label}
    </span>
  );
}
