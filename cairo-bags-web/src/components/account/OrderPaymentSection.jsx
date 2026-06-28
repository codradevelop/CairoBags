import { useNavigate } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Button, Card, CardBody, CardHeader } from "../ui/index.js";
import { getPaymentMethodLabel } from "../../constants/paymentMethodOptions.js";
import { getPaymentStatusLabel } from "../../constants/orderStatusLabels.js";
import { PAYMENT_STATUS } from "../../constants/paymentStatus.js";
import { formatPrice } from "../../utils/productHelpers.js";
import {
  buildPaymentResubmitState,
  canResubmitPaymentProof,
  getPaymentRejectionReason,
  getPaymentStatusValue,
  isPaymentRejected,
} from "../../utils/paymentHelpers.js";
import { cn } from "../../utils/cn.js";

function PaymentStatusBadge({ status, locale }) {
  const metaVariant =
    status === PAYMENT_STATUS.REJECTED
      ? "error"
      : status === PAYMENT_STATUS.CONFIRMED
        ? "success"
        : status === PAYMENT_STATUS.PROOF_SUBMITTED || status === PAYMENT_STATUS.UNDER_REVIEW
          ? "accent"
          : "warning";

  return (
    <Badge
      variant={metaVariant}
      size="md"
      aria-label={`${locale === "ar" ? "حالة الدفع" : "Payment status"}: ${getPaymentStatusLabel(status, locale)}`}
    >
      {status === PAYMENT_STATUS.REJECTED ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
          {getPaymentStatusLabel(status, locale)}
        </span>
      ) : (
        getPaymentStatusLabel(status, locale)
      )}
    </Badge>
  );
}

export function OrderPaymentSection({ order, payment, highlighted = false, className }) {
  const { locale } = useLocale();
  const navigate = useNavigate();

  if (!payment) return null;

  const paymentStatus = getPaymentStatusValue(payment);
  const rejected = isPaymentRejected(payment);
  const rejectionReason = getPaymentRejectionReason(payment);
  const showResubmit = canResubmitPaymentProof(order, payment);

  function handleResubmit() {
    navigate(`/checkout/payment/${order?.orderId ?? order?.OrderId ?? order?.id ?? order?.Id}`, {
      state: buildPaymentResubmitState(order, payment),
    });
  }

  const labels =
    locale === "ar"
      ? {
          payment: "الدفع",
          rejected: "تم رفض الدفع",
          rejectedHelp: "تمت مراجعة إثبات الدفع الخاص بك ورفضه.",
          reason: "السبب",
          method: "الطريقة",
          status: "الحالة",
          amount: "المبلغ",
          reference: "رقم العملية",
          resubmit: "إرسال إثبات دفع جديد",
        }
      : {
          payment: "Payment",
          rejected: "Payment Rejected",
          rejectedHelp: "Your payment proof has been reviewed and rejected.",
          reason: "Reason",
          method: "Method",
          status: "Status",
          amount: "Amount",
          reference: "Reference",
          resubmit: "Submit New Payment Proof",
        };

  return (
    <Card
      id="order-payment-section"
      variant="default"
      padding="md"
      tabIndex={-1}
      aria-label={labels.payment}
      className={cn("transition-shadow duration-1000", highlighted && "payment-section-glow", className)}
    >
      {rejected ? (
        <div className="mb-5 space-y-3 border-b border-brand-border pb-5">
          <Badge variant="error" size="lg" className="px-4 py-1.5 text-sm font-semibold">
            {labels.rejected}
          </Badge>
          <p className="text-sm text-brand-muted">{labels.rejectedHelp}</p>
          {rejectionReason ? (
            <div
              className="rounded-lg border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm shadow-[0_2px_12px_-6px_rgba(239,68,68,0.25)]"
              role="alert"
              aria-live="polite"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-800/80">
                {labels.reason}
              </p>
              <p className="mt-1 font-medium text-red-900">{rejectionReason}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <CardHeader title={labels.payment} />
      <CardBody className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-brand-muted">{labels.method}</span>
          <span className="font-medium text-brand-text">
            {getPaymentMethodLabel(payment.paymentMethod ?? payment.PaymentMethod, locale)}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-brand-muted">{labels.status}</span>
          <PaymentStatusBadge status={paymentStatus} locale={locale} />
        </div>
        {rejected && rejectionReason ? (
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span className="text-brand-muted">{labels.reason}</span>
            <span className="max-w-[16rem] text-end font-medium text-red-800">{rejectionReason}</span>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-brand-muted">{labels.amount}</span>
          <span className="font-medium text-brand-text">
            {formatPrice(payment.amount ?? payment.Amount, locale)}
          </span>
        </div>
        {payment.transactionReference ?? payment.TransactionReference ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-brand-muted">{labels.reference}</span>
            <span className="font-medium text-brand-text">
              {payment.transactionReference ?? payment.TransactionReference}
            </span>
          </div>
        ) : null}

        {showResubmit ? (
          <Button
            type="button"
            variant="accent"
            size="lg"
            className="mt-2 w-full transition-transform duration-300 hover:scale-[1.01] hover:shadow-glow-gold"
            aria-label={labels.resubmit}
            onClick={handleResubmit}
          >
            {labels.resubmit}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}
