import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "../ui/Modal.jsx";
import { Button, Input, InputGroup, Label, Textarea } from "../ui/index.js";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { StatusBadge } from "./StatusBadge.jsx";
import { formatPrice } from "../../utils/productHelpers.js";
import { getPaymentProofImageUrl } from "../../utils/orderHelpers.js";
import * as adminPaymentService from "../../services/adminPaymentService.js";

export function PaymentReviewModal({ open, paymentId, onClose, onReviewed }) {
  const { locale } = useLocale();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!open || !paymentId) return;
    setLoading(true);
    adminPaymentService
      .getAdminPaymentById(paymentId)
      .then(setPayment)
      .catch(() => setPayment(null))
      .finally(() => setLoading(false));
  }, [open, paymentId]);

  useEffect(() => {
    if (!open) setPreviewUrl(null);
  }, [open]);

  useEffect(() => {
    if (!previewUrl) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        setPreviewUrl(null);
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [previewUrl]);

  const proofImages = payment?.proofImages ?? payment?.ProofImages ?? [];

  async function handleApprove() {
    setSubmitting(true);
    try {
      await adminPaymentService.approvePayment(paymentId);
      onReviewed?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return;
    setSubmitting(true);
    try {
      await adminPaymentService.rejectPayment(paymentId, {
        rejectionReason: rejectionReason.trim(),
      });
      onReviewed?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={locale === "ar" ? "مراجعة الدفع" : "Review Payment"}
        size="lg"
        footer={
          payment ? (
            <>
              <Button variant="ghost" onClick={onClose} disabled={submitting}>
                {locale === "ar" ? "إغلاق" : "Close"}
              </Button>
              <Button variant="danger" onClick={handleReject} loading={submitting}>
                {locale === "ar" ? "رفض" : "Reject"}
              </Button>
              <Button variant="accent" onClick={handleApprove} loading={submitting}>
                {locale === "ar" ? "موافقة" : "Approve"}
              </Button>
            </>
          ) : null
        }
      >
        {loading ? (
          <p className="text-sm text-brand-muted">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</p>
        ) : null}
        {payment ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">{payment.orderNumber ?? payment.OrderNumber}</p>
              <StatusBadge
                status={payment.orderStatus ?? payment.OrderStatus}
                paymentStatus={payment.paymentStatus ?? payment.PaymentStatus}
              />
            </div>
            <p className="text-sm text-brand-muted">
              {payment.customerName ?? payment.CustomerName} · {payment.customerEmail ?? payment.CustomerEmail}
            </p>
            <p className="font-display text-xl text-brand-primary">
              {formatPrice(payment.amount ?? payment.Amount, locale)}
            </p>
            {payment.transactionReference ?? payment.TransactionReference ? (
              <p className="text-sm">
                {locale === "ar" ? "المرجع: " : "Ref: "}
                {payment.transactionReference ?? payment.TransactionReference}
              </p>
            ) : null}
            {proofImages.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium text-brand-text">
                  {locale === "ar" ? "صورة إثبات الدفع" : "Payment proof"}
                </p>
                <div className="flex flex-wrap gap-3">
                  {proofImages.map((img, index) => {
                    const imageUrl = getPaymentProofImageUrl(img);
                    return (
                      <button
                        key={img.id ?? img.Id ?? index}
                        type="button"
                        className="group relative overflow-hidden rounded-md border border-brand-border transition hover:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                        onClick={() => setPreviewUrl(imageUrl)}
                        aria-label={
                          locale === "ar"
                            ? `فتح صورة إثبات الدفع ${index + 1}`
                            : `Open payment proof image ${index + 1}`
                        }
                      >
                        <img
                          src={imageUrl}
                          alt=""
                          className="h-28 w-28 object-cover transition group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-brand-primary/0 text-xs font-medium text-white opacity-0 transition group-hover:bg-brand-primary/45 group-hover:opacity-100">
                          {locale === "ar" ? "عرض" : "View"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <InputGroup>
              <Label>{locale === "ar" ? "سبب الرفض" : "Rejection reason"}</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </InputGroup>
          </div>
        ) : null}
      </Modal>

      {previewUrl
        ? createPortal(
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
              <button
                type="button"
                className="absolute inset-0 bg-brand-primary/70 backdrop-blur-sm"
                aria-label={locale === "ar" ? "إغلاق" : "Close"}
                onClick={() => setPreviewUrl(null)}
              />
              <div className="relative z-[71] flex max-h-[90vh] w-full max-w-4xl flex-col gap-3">
                <div className="flex items-center justify-end gap-2">
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-white/20 bg-brand-surface/95 px-3 py-1.5 text-sm text-brand-text shadow-soft transition hover:bg-brand-surface"
                  >
                    {locale === "ar" ? "فتح في تبويب جديد" : "Open in new tab"}
                  </a>
                  <button
                    type="button"
                    className="rounded-md border border-white/20 bg-brand-surface/95 p-2 text-brand-text shadow-soft transition hover:bg-brand-surface"
                    aria-label={locale === "ar" ? "إغلاق" : "Close"}
                    onClick={() => setPreviewUrl(null)}
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M5 5l10 10M15 5L5 15"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
                <img
                  src={previewUrl}
                  alt={locale === "ar" ? "صورة إثبات الدفع" : "Payment proof"}
                  className="max-h-[calc(90vh-3rem)] w-full rounded-lg border border-brand-border bg-brand-surface object-contain shadow-modal"
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
