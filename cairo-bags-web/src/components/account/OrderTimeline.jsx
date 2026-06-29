import { useMemo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { getOrderStatusLabel } from "../../constants/orderStatusLabels.js";
import { getCodStatusLabel, getCodStatusTimelineDot } from "../../constants/codOrderStatus.js";
import { isCashOnDeliveryOrder } from "../../utils/codOrderHelpers.js";
import { formatOrderDate } from "../../utils/orderHelpers.js";
import { buildOrderTimelineEntries, TIMELINE_EVENT } from "../../utils/paymentHelpers.js";
import { cn } from "../../utils/cn.js";

function TimelineDot({ className }) {
  return (
    <span
      className={cn(
        "relative z-[1] mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 transition-all duration-300",
        className
      )}
      aria-hidden="true"
    />
  );
}

function RejectionTimelineItem({ entry, locale }) {
  const labels =
    locale === "ar"
      ? {
          title: "تم رفض الدفع",
          description: "تم رفض إثبات الدفع من قبل فريقنا.",
          reason: "السبب",
          date: "التاريخ",
        }
      : {
          title: "Payment Rejected",
          description: "Payment proof was rejected by our team.",
          reason: "Reason",
          date: "Date",
        };

  return (
    <div className="min-w-0 flex-1 rounded-xl border border-red-200/70 bg-red-50/50 px-4 py-3">
      <p className="font-medium text-red-900">{labels.title}</p>
      <p className="mt-1 text-sm text-red-800/80">{labels.description}</p>
      {entry.reason ? (
        <p className="mt-2 text-sm">
          <span className="font-medium text-red-900">{labels.reason}:</span>{" "}
          <span className="text-red-800">{entry.reason}</span>
        </p>
      ) : null}
      <p className="mt-2 text-xs text-red-700/80">
        <span className="font-medium">{labels.date}:</span>{" "}
        {formatOrderDate(entry.rejectedAt ?? entry.createdAt, locale)}
      </p>
    </div>
  );
}

function ProofSubmittedTimelineItem({ entry, locale }) {
  const title = locale === "ar" ? "تم رفع إثبات الدفع" : "Proof Submitted";
  const dateLabel = locale === "ar" ? "التاريخ" : "Date";

  return (
    <div className="min-w-0 flex-1 rounded-xl border border-brand-accent/25 bg-brand-accent/5 px-4 py-3">
      <p className="font-medium text-brand-text">{title}</p>
      <p className="mt-2 text-xs text-brand-muted">
        <span className="font-medium">{dateLabel}:</span> {formatOrderDate(entry.createdAt, locale)}
      </p>
    </div>
  );
}

function PaymentApprovedTimelineItem({ entry, locale }) {
  const title = locale === "ar" ? "تمت الموافقة على الدفع" : "Payment Approved";
  const dateLabel = locale === "ar" ? "التاريخ" : "Date";

  return (
    <div className="min-w-0 flex-1 rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-3">
      <p className="font-medium text-emerald-900">{title}</p>
      <p className="mt-2 text-xs text-emerald-800/80">
        <span className="font-medium">{dateLabel}:</span> {formatOrderDate(entry.createdAt, locale)}
      </p>
    </div>
  );
}

function OrderConfirmedTimelineItem({ entry, locale }) {
  const title = locale === "ar" ? "تم تأكيد الطلب" : "Order Confirmed";
  const dateLabel = locale === "ar" ? "التاريخ" : "Date";

  return (
    <div className="min-w-0 flex-1 rounded-xl border border-sky-200/70 bg-sky-50/50 px-4 py-3">
      <p className="font-medium text-sky-900">{title}</p>
      <p className="mt-2 text-xs text-sky-800/80">
        <span className="font-medium">{dateLabel}:</span> {formatOrderDate(entry.createdAt, locale)}
      </p>
    </div>
  );
}

function getEventDotClass(entry, isLast) {
  if (entry.kind === TIMELINE_EVENT.PAYMENT_REJECTED) {
    return isLast
      ? "border-red-500 bg-red-500 ring-2 ring-red-200 ring-offset-2 ring-offset-brand-surface"
      : "border-red-300 bg-brand-surface";
  }
  if (entry.kind === TIMELINE_EVENT.ORDER_CONFIRMED) {
    return getCodStatusTimelineDot(entry.status, isLast);
  }
  if (entry.kind === TIMELINE_EVENT.PAYMENT_APPROVED) {
    return isLast
      ? "border-emerald-500 bg-emerald-500 ring-2 ring-emerald-200 ring-offset-2 ring-offset-brand-surface"
      : "border-emerald-300 bg-brand-surface";
  }
  if (entry.kind === TIMELINE_EVENT.PROOF_SUBMITTED) {
    return isLast
      ? "border-brand-accent bg-brand-accent ring-2 ring-brand-accent/25 ring-offset-2 ring-offset-brand-surface"
      : "border-brand-border bg-brand-surface";
  }
  return isLast
    ? "border-brand-accent bg-brand-accent ring-2 ring-brand-accent/25 ring-offset-2 ring-offset-brand-surface"
    : "border-brand-border bg-brand-surface";
}

export function OrderTimeline({ history = [], payment = null, className }) {
  const { locale } = useLocale();
  const items = useMemo(() => buildOrderTimelineEntries(history, payment), [history, payment]);
  const isCod = isCashOnDeliveryOrder({ payment });

  function getTimelineStatusLabel(status) {
    if (isCod) return getCodStatusLabel(status, locale);
    return getOrderStatusLabel(status, locale);
  }

  if (!items.length) {
    return (
      <p className={cn("text-sm text-brand-muted", className)}>
        {locale === "ar" ? "لا يوجد سجل حالة" : "No status history yet"}
      </p>
    );
  }

  return (
    <ol className={cn("space-y-0", className)}>
      {items.map((entry, index) => {
        const isLast = index === items.length - 1;
        const isRejection = entry.kind === TIMELINE_EVENT.PAYMENT_REJECTED;
        const isProof = entry.kind === TIMELINE_EVENT.PROOF_SUBMITTED;
        const isApproved = entry.kind === TIMELINE_EVENT.PAYMENT_APPROVED;
        const isConfirmed = entry.kind === TIMELINE_EVENT.ORDER_CONFIRMED;

        const dotClass =
          entry.kind === TIMELINE_EVENT.ORDER_STATUS && isCod
            ? getCodStatusTimelineDot(entry.status, isLast)
            : getEventDotClass(entry, isLast);

        return (
          <li key={entry.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className="absolute start-[0.3125rem] top-4 h-[calc(100%-0.75rem)] w-px bg-gradient-to-b from-brand-border to-brand-border/40"
                aria-hidden="true"
              />
            ) : null}
            <TimelineDot className={dotClass} />
            {isRejection ? (
              <RejectionTimelineItem entry={entry} locale={locale} />
            ) : isProof ? (
              <ProofSubmittedTimelineItem entry={entry} locale={locale} />
            ) : isConfirmed ? (
              <OrderConfirmedTimelineItem entry={entry} locale={locale} />
            ) : isApproved ? (
              <PaymentApprovedTimelineItem entry={entry} locale={locale} />
            ) : (
              <div className="min-w-0 flex-1 transition-all duration-300">
                <p className="font-medium text-brand-text">{getTimelineStatusLabel(entry.status)}</p>
                {entry.notes ? <p className="mt-1 text-sm text-brand-muted">{entry.notes}</p> : null}
                <p className="mt-1 text-xs text-brand-muted">
                  {formatOrderDate(entry.createdAt, locale)}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
