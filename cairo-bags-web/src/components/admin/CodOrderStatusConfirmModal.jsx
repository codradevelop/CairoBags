import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { getCodStatusDotClass, getCodStatusLabel } from "../../constants/codOrderStatus.js";
import { ORDER_STATUS } from "../../constants/orderStatus.js";
import { cn } from "../../utils/cn.js";

function StatusTransitionPill({ status, locale, className }) {
  const label = getCodStatusLabel(status, locale);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-3 py-1.5 text-sm font-medium text-brand-text",
        className
      )}
    >
      <span
        className={cn("h-2 w-2 shrink-0 rounded-full", getCodStatusDotClass(status))}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

export function CodOrderStatusConfirmModal({
  open,
  onClose,
  onConfirm,
  currentStatus,
  nextStatus,
  orderNumber,
  loading = false,
}) {
  const { locale } = useLocale();
  const isCancel = nextStatus === ORDER_STATUS.CANCELLED;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        open ? "visible" : "invisible pointer-events-none"
      )}
      role="presentation"
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        aria-label={locale === "ar" ? "إغلاق" : "Close"}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cod-status-confirm-title"
        className={cn(
          "relative w-full max-w-md rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-xl",
          "transition-all duration-200",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        <h2 id="cod-status-confirm-title" className="font-display text-xl font-medium text-brand-text">
          {isCancel
            ? locale === "ar"
              ? "إلغاء الطلب؟"
              : "Cancel order?"
            : locale === "ar"
              ? "تغيير حالة الطلب؟"
              : "Change order status?"}
        </h2>
        {orderNumber ? (
          <p className="mt-1 text-sm text-brand-muted">{orderNumber}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <StatusTransitionPill status={currentStatus} locale={locale} />
          <span className="text-lg text-brand-muted" aria-hidden="true">
            ↓
          </span>
          <StatusTransitionPill status={nextStatus} locale={locale} />
        </div>

        <p className="mt-5 text-sm text-brand-muted">
          {isCancel
            ? locale === "ar"
              ? "لن يتمكن العميل من استكمال هذا الطلب بعد الإلغاء."
              : "The customer will not be able to continue this order after cancellation."
            : locale === "ar"
              ? "سيتم إخطار العميل بهذا التغيير."
              : "The customer will be notified about this change."}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-brand-muted transition hover:text-brand-text"
          >
            {locale === "ar" ? "إلغاء" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-white transition",
              isCancel ? "bg-red-600 hover:bg-red-700" : "bg-brand-primary hover:bg-brand-primary/90",
              loading && "opacity-70"
            )}
          >
            {loading
              ? locale === "ar"
                ? "جاري الحفظ..."
                : "Saving..."
              : locale === "ar"
                ? "تأكيد"
                : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
