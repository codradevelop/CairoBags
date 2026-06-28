import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import * as paymentService from "../../services/paymentService.js";
import { formatCheckoutResponse } from "../../utils/cartHelpers.js";
import { getPaymentMethodLabel } from "../../constants/paymentMethodOptions.js";
import { requestPaymentHighlight } from "../../utils/paymentScrollUtils.js";
import {
  getPaymentPhoneValidationMessage,
  isValidPaymentPhone,
  sanitizePhoneDigits,
} from "../../utils/paymentFormHelpers.js";
import { PaymentProofPreview } from "../../components/checkout/PaymentProofPreview.jsx";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  FieldError,
  FileUpload,
  Input,
  InputGroup,
  Label,
} from "../../components/ui/index.js";

export function PaymentUploadPage() {
  const { orderId } = useParams();
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const checkout = formatCheckoutResponse(location.state?.checkout);
  const isResubmit = Boolean(location.state?.resubmit);
  const returnTo = location.state?.returnTo || `/account/orders/${orderId}`;

  const [form, setForm] = useState({
    senderName: "",
    senderPhone: "",
    transactionReference: "",
  });
  const [files, setFiles] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const submittingRef = useRef(false);

  const phoneMessage = getPaymentPhoneValidationMessage(locale);
  const isPhoneValid = isValidPaymentPhone(form.senderPhone);
  const canSubmit =
    Boolean(form.senderName.trim()) &&
    isPhoneValid &&
    Boolean(form.transactionReference.trim()) &&
    files.length > 0 &&
    !submitting;

  function handlePhoneChange(event) {
    const nextPhone = sanitizePhoneDigits(event.target.value);
    setForm((current) => ({ ...current, senderPhone: nextPhone }));
    if (fieldErrors.senderPhone) {
      setFieldErrors((current) => ({ ...current, senderPhone: undefined }));
    }
  }

  function handlePhonePaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData("text") ?? "";
    const nextPhone = sanitizePhoneDigits(pasted);
    setForm((current) => ({ ...current, senderPhone: nextPhone }));
  }

  usePageTitle(locale === "ar" ? "رفع إثبات الدفع" : "Upload Payment Proof");

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearProofSelection() {
    setFiles([]);
    setSelectedFileName("");
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function handleProofFilesChange(event) {
    const selected = Array.from(event.target.files ?? []);
    setFiles(selected);

    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return selected[0] ? URL.createObjectURL(selected[0]) : null;
    });

    if (selected.length === 0) {
      setSelectedFileName("");
    } else if (selected.length === 1) {
      setSelectedFileName(selected[0].name);
    } else {
      setSelectedFileName(
        locale === "ar" ? `${selected.length} ملفات` : `${selected.length} files`
      );
    }
  }

  if (!location.state?.checkout && !isResubmit) {
    return <Navigate to="/account/orders" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current || submitting) return;

    const nextErrors = {};
    if (!form.senderName.trim()) nextErrors.senderName = locale === "ar" ? "مطلوب" : "Required";
    if (!isValidPaymentPhone(form.senderPhone)) nextErrors.senderPhone = phoneMessage;
    if (!form.transactionReference.trim()) {
      nextErrors.transactionReference = locale === "ar" ? "مطلوب" : "Required";
    }
    if (!files.length) nextErrors.files = locale === "ar" ? "أرفق صورة الدفع" : "Attach payment proof";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    submittingRef.current = true;
    setSubmitting(true);
    try {
      await paymentService.submitPaymentProof(orderId, {
        senderName: form.senderName.trim(),
        senderPhone: form.senderPhone.trim(),
        transactionReference: form.transactionReference.trim(),
        proofFiles: files,
      });
      success(
        isResubmit
          ? locale === "ar"
            ? "تم إرسال إثبات الدفع الجديد"
            : "New payment proof submitted"
          : locale === "ar"
            ? "تم رفع إثبات الدفع"
            : "Payment proof submitted"
      );

      if (isResubmit) {
        requestPaymentHighlight();
        navigate(returnTo, {
          replace: true,
          state: { highlightPayment: true },
        });
        return;
      }

      navigate("/checkout/success", {
        state: {
          checkout: {
            ...checkout,
            paymentStatus: "ProofSubmitted",
            nextStepMessage:
              locale === "ar"
                ? "تم استلام إثبات الدفع. سيتم مراجعته قريباً."
                : "Payment proof received. We will review it shortly.",
          },
        },
      });
    } catch (err) {
      toastError(err.message || (locale === "ar" ? "فشل الرفع" : "Upload failed"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const submitLabel = isResubmit
    ? locale === "ar"
      ? "إرسال إثبات الدفع الجديد"
      : "Submit New Payment Proof"
    : locale === "ar"
      ? "إرسال إثبات الدفع"
      : "Submit Payment Proof";
  const uploadingLabel = locale === "ar" ? "جاري الرفع..." : "Uploading...";

  return (
    <StoreLayout>
      <div className="mx-auto max-w-xl">
        <h1 className="font-display text-3xl font-medium text-brand-text">
          {isResubmit
            ? locale === "ar"
              ? "إرسال إثبات دفع جديد"
              : "Submit New Payment Proof"
            : locale === "ar"
              ? "رفع إثبات الدفع"
              : "Upload Payment Proof"}
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          {isResubmit
            ? locale === "ar"
              ? "يرجى رفع إثبات دفع جديد بعد رفض الإثبات السابق."
              : "Please upload a new payment proof after your previous proof was rejected."
            : checkout.nextStepMessage}
        </p>

        <Card variant="flat" padding="md" className="mt-6">
          <CardBody className="space-y-2 text-sm">
            <p>
              <span className="text-brand-muted">{locale === "ar" ? "رقم الطلب: " : "Order: "}</span>
              <span className="font-medium">{checkout.orderNumber}</span>
            </p>
            <p>
              <span className="text-brand-muted">{locale === "ar" ? "الإجمالي: " : "Total: "}</span>
              <span className="font-medium">{checkout.totalAmount} EGP</span>
            </p>
            <p>
              <span className="text-brand-muted">{locale === "ar" ? "الدفع عبر: " : "Pay via: "}</span>
              <span className="font-medium">
                {getPaymentMethodLabel(checkout.paymentMethod, locale) || checkout.paymentMethod}
              </span>
            </p>
          </CardBody>
        </Card>

        <Card variant="elevated" padding="lg" className="mt-6">
          <CardHeader title={locale === "ar" ? "بيانات التحويل" : "Transfer Details"} />
          <form onSubmit={handleSubmit}>
            <CardBody className="space-y-4">
              <InputGroup>
                <Label required>{locale === "ar" ? "اسم المرسل" : "Sender name"}</Label>
                <Input
                  value={form.senderName}
                  onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                  variant={fieldErrors.senderName ? "error" : "default"}
                />
                <FieldError>{fieldErrors.senderName}</FieldError>
              </InputGroup>
              <InputGroup>
                <Label required>{locale === "ar" ? "هاتف المرسل" : "Sender phone"}</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel"
                  maxLength={11}
                  value={form.senderPhone}
                  onChange={handlePhoneChange}
                  onPaste={handlePhonePaste}
                  aria-invalid={Boolean(fieldErrors.senderPhone || (form.senderPhone && !isPhoneValid))}
                  aria-describedby="sender-phone-error"
                  variant={fieldErrors.senderPhone || (form.senderPhone && !isPhoneValid) ? "error" : "default"}
                />
                <FieldError id="sender-phone-error">
                  {fieldErrors.senderPhone ||
                    (form.senderPhone && !isPhoneValid ? phoneMessage : null)}
                </FieldError>
              </InputGroup>
              <InputGroup>
                <Label required>{locale === "ar" ? "رقم العملية" : "Transaction reference"}</Label>
                <Input
                  value={form.transactionReference}
                  onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                  variant={fieldErrors.transactionReference ? "error" : "default"}
                />
                <FieldError>{fieldErrors.transactionReference}</FieldError>
              </InputGroup>
              <InputGroup>
                <Label required>{locale === "ar" ? "صورة إثبات الدفع" : "Payment proof image"}</Label>
                {files[0] && previewUrl ? (
                  <PaymentProofPreview
                    file={files[0]}
                    previewUrl={previewUrl}
                    onChange={handleProofFilesChange}
                    onRemove={clearProofSelection}
                    className="mb-2"
                  />
                ) : (
                  <FileUpload
                    accept="image/*"
                    multiple
                    previewUrl={previewUrl}
                    fileName={selectedFileName}
                    onChange={handleProofFilesChange}
                  />
                )}
                <FieldError>{fieldErrors.files}</FieldError>
              </InputGroup>
              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full transition-transform duration-300 hover:scale-[1.01] hover:shadow-glow-gold disabled:hover:scale-100"
                loading={submitting}
                disabled={!canSubmit}
                aria-busy={submitting}
              >
                {submitting ? uploadingLabel : submitLabel}
              </Button>
            </CardBody>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm">
          <Link
            to={isResubmit ? returnTo : "/account/orders"}
            className="text-brand-accent hover:text-brand-primary"
          >
            {isResubmit
              ? locale === "ar"
                ? "العودة لتفاصيل الطلب"
                : "Back to order details"
              : locale === "ar"
                ? "تخطي الآن — عرض طلباتي"
                : "Skip for now — View my orders"}
          </Link>
        </p>
      </div>
    </StoreLayout>
  );
}
