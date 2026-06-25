import { useLocale } from "../layout/LanguageSwitcher.jsx";
import {
  PAYMENT_WALLET_NUMBER_DISPLAY,
} from "../../constants/paymentMethodOptions.js";
import instapayLogo from "../../assets/payment/instapay.svg";
import {
  PaymentDetailCard,
  PaymentInstructionsList,
  PaymentSectionTitle,
  PaymentWalletNumber,
  PaymentWarningNotice,
} from "./paymentUi.jsx";
import { cn } from "../../utils/cn.js";

export function InstaPayDetails({ className }) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const steps = isAr
    ? [
        "افتح تطبيق إنستاباي.",
        <>اضغط <strong className="text-brand-text">إرسال أموال</strong>.</>,
        <>اختر <strong className="text-brand-text">رقم الموبايل</strong>.</>,
        <>
          أدخل: <strong className="text-brand-text" dir="ltr">{PAYMENT_WALLET_NUMBER_DISPLAY}</strong>
        </>,
        "أرسل إجمالي الطلب بالضبط.",
        "ارفع إيصال الدفع.",
        "انتظر التحقق من الدفع.",
      ]
    : [
        "Open the InstaPay application.",
        <>
          Tap <strong className="text-brand-text">Send Money</strong>.
        </>,
        <>
          Choose <strong className="text-brand-text">Mobile Number</strong>.
        </>,
        <>
          Enter: <strong className="text-brand-text" dir="ltr">{PAYMENT_WALLET_NUMBER_DISPLAY}</strong>
        </>,
        "Send the exact order total.",
        "Upload your payment receipt.",
        "Wait for payment verification.",
      ];

  return (
    <PaymentDetailCard
      className={className}
      header={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" aria-hidden="true">
              📲
            </span>
            <h4 className="font-display text-lg font-semibold text-brand-text">
              {isAr ? "إنستاباي" : "InstaPay"}
            </h4>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
              "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            )}
          >
            <span className="text-brand-accent" aria-hidden="true">
              ★
            </span>
            {isAr ? "موصى به • أسرع تحقق" : "Recommended • Fastest Verification"}
          </span>
        </div>
      }
    >
      <section className="flex justify-center">
        <img
          src={instapayLogo}
          alt="InstaPay"
          className="h-auto w-full max-w-[280px] rounded-2xl shadow-md"
        />
      </section>

      <PaymentWalletNumber
        titleEn="InstaPay Number"
        titleAr="رقم إنستاباي"
        copySuccessEn="InstaPay number copied successfully."
        copySuccessAr="تم نسخ رقم إنستاباي بنجاح."
        copyAriaEn="Copy InstaPay number"
        copyAriaAr="نسخ رقم إنستاباي"
      />

      <section>
        <PaymentSectionTitle>
          {isAr ? "تعليمات الدفع" : "Payment Instructions"}
        </PaymentSectionTitle>
        <PaymentInstructionsList steps={steps} />
      </section>

      <PaymentWarningNotice />
    </PaymentDetailCard>
  );
}
