import { useMemo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { getOrderStatusLabel } from "../../constants/orderStatusLabels.js";
import { formatOrderDate } from "../../utils/orderHelpers.js";
import { buildOrderTimelineEntries, TIMELINE_EVENT } from "../../utils/paymentHelpers.js";
import { cn } from "../../utils/cn.js";

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
    <div className="min-w-0 flex-1 rounded-lg border border-red-200/70 bg-red-50/60 px-3 py-2.5 timeline-rejection-enter">
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
    <div className="min-w-0 flex-1 rounded-lg border border-brand-accent/25 bg-brand-accent/5 px-3 py-2.5">
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
    <div className="min-w-0 flex-1 rounded-lg border border-emerald-200/70 bg-emerald-50/70 px-3 py-2.5">
      <p className="font-medium text-emerald-900">{title}</p>
      <p className="mt-2 text-xs text-emerald-800/80">
        <span className="font-medium">{dateLabel}:</span> {formatOrderDate(entry.createdAt, locale)}
      </p>
    </div>
  );
}

export function OrderTimeline({ history = [], payment = null, className }) {
  const { locale } = useLocale();
  const items = useMemo(() => buildOrderTimelineEntries(history, payment), [history, payment]);

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

        return (
          <li key={entry.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                className="absolute start-[0.4375rem] top-3 h-[calc(100%-0.5rem)] w-px bg-brand-border"
                aria-hidden="true"
              />
            ) : null}
            <span
              className={cn(
                "relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2",
                isRejection
                  ? "border-red-500 bg-red-500"
                  : isApproved
                    ? "border-emerald-500 bg-emerald-500"
                    : isProof
                      ? "border-brand-accent bg-brand-accent"
                      : index === 0
                        ? "border-brand-accent bg-brand-accent"
                        : "border-brand-border bg-brand-surface"
              )}
              aria-hidden="true"
            />
            {isRejection ? (
              <RejectionTimelineItem entry={entry} locale={locale} />
            ) : isProof ? (
              <ProofSubmittedTimelineItem entry={entry} locale={locale} />
            ) : isApproved ? (
              <PaymentApprovedTimelineItem entry={entry} locale={locale} />
            ) : (
              <div className="min-w-0 flex-1">
                <p className="font-medium text-brand-text">
                  {getOrderStatusLabel(entry.status, locale)}
                </p>
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
