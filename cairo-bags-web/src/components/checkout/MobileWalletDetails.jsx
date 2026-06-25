import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { PAYMENT_WALLET_NUMBER_DISPLAY } from "../../constants/paymentMethodOptions.js";
import { WalletBrandLogos } from "./WalletBrandLogos.jsx";
import {
  PaymentDetailCard,
  PaymentInstructionsList,
  PaymentSectionTitle,
  PaymentWalletNumber,
  PaymentWarningNotice,
} from "./paymentUi.jsx";

export function MobileWalletDetails({ className }) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  const steps = isAr
    ? [
        "افتح محفظتك المفضلة.",
        <>
          اختر إحدى الطرق:
          <ul className="mt-2 list-inside list-disc space-y-1 ps-1">
            <li>فودافون كاش</li>
            <li>أورانج موني</li>
            <li>اتصالات كاش</li>
            <li>وي باي</li>
          </ul>
        </>,
        <>
          أرسل إجمالي الطلب بالضبط إلى:{" "}
          <strong className="text-brand-text" dir="ltr">
            {PAYMENT_WALLET_NUMBER_DISPLAY}
          </strong>
        </>,
        "ارفع إيصال الدفع.",
        "انتظر التحقق من الدفع.",
      ]
    : [
        "Open your preferred mobile wallet.",
        <>
          Choose one of:
          <ul className="mt-2 list-inside list-disc space-y-1 ps-1">
            <li>Vodafone Cash</li>
            <li>Orange Money</li>
            <li>Etisalat Cash</li>
            <li>WE Pay</li>
          </ul>
        </>,
        <>
          Send the exact order total to:{" "}
          <strong className="text-brand-text" dir="ltr">
            {PAYMENT_WALLET_NUMBER_DISPLAY}
          </strong>
        </>,
        "Upload the payment receipt.",
        "Wait for payment verification.",
      ];

  return (
    <PaymentDetailCard
      className={className}
      header={
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden="true">
            📱
          </span>
          <h4 className="font-display text-lg font-semibold text-brand-text">
            {isAr ? "محفظة موبايل" : "Mobile Wallet"}
          </h4>
        </div>
      }
    >
      <section>
        <PaymentSectionTitle>
          {isAr ? "طرق الدفع المدعومة" : "Supported Methods"}
        </PaymentSectionTitle>
        <WalletBrandLogos />
      </section>

      <PaymentWalletNumber />

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
