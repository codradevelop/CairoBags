import { PAYMENT_METHOD, PAYMENT_METHOD_LABELS } from "./paymentMethods.js";

export const INSTA_PAY_PAYMENT_METHOD = PAYMENT_METHOD.INSTA_PAY;
/** Backend enum for the unified Mobile Wallet checkout UI. */
export const MOBILE_WALLET_PAYMENT_METHOD = PAYMENT_METHOD.VODAFONE_CASH;

export const PAYMENT_WALLET_NUMBER_DISPLAY = "+20 10 12729933";
export const PAYMENT_WALLET_NUMBER_COPY = "+201012729933";

/** @deprecated Use PAYMENT_WALLET_NUMBER_* */
export const MOBILE_WALLET_NUMBER_DISPLAY = PAYMENT_WALLET_NUMBER_DISPLAY;
/** @deprecated Use PAYMENT_WALLET_NUMBER_* */
export const MOBILE_WALLET_NUMBER_COPY = PAYMENT_WALLET_NUMBER_COPY;

export const PAYMENT_METHOD_OPTIONS = [
  {
    value: PAYMENT_METHOD.CASH_ON_DELIVERY,
    labelEn: "Cash On Delivery",
    labelAr: "الدفع عند الاستلام",
    descriptionEn: "Pay the courier when your order arrives.",
    descriptionAr: "ادفع للمندوب عند استلام الطلب.",
    isWallet: false,
  },
  {
    value: INSTA_PAY_PAYMENT_METHOD,
    labelEn: "InstaPay",
    labelAr: "إنستاباي",
    descriptionEn: "Fast bank transfer via InstaPay — recommended for quickest verification.",
    descriptionAr: "تحويل بنكي سريع عبر إنستاباي — موصى به لأسرع تحقق.",
    isWallet: true,
    isInstaPay: true,
    recommended: true,
  },
  {
    value: MOBILE_WALLET_PAYMENT_METHOD,
    labelEn: "Mobile Wallet",
    labelAr: "محفظة موبايل",
    descriptionEn: "Pay via Vodafone Cash, Orange Money, Etisalat Cash, or WE Pay.",
    descriptionAr: "ادفع عبر فودافون كاش، أورانج موني، اتصالات كاش، أو وي باي.",
    isWallet: true,
    isMobileWallet: true,
  },
];

export function isWalletPaymentMethod(method) {
  const option = PAYMENT_METHOD_OPTIONS.find((m) => m.value === method);
  if (option) return option.isWallet;
  return method !== PAYMENT_METHOD.CASH_ON_DELIVERY;
}

const LEGACY_WALLET_LABELS = {
  [PAYMENT_METHOD.INSTA_PAY]: { en: "InstaPay", ar: "إنستاباي" },
  [PAYMENT_METHOD.VODAFONE_CASH]: { en: "Vodafone Cash", ar: "فودافون كاش" },
  [PAYMENT_METHOD.ORANGE_CASH]: { en: "Orange Money", ar: "أورانج موني" },
  [PAYMENT_METHOD.ETISALAT_CASH]: { en: "Etisalat Cash", ar: "اتصالات كاش" },
  [PAYMENT_METHOD.WE_PAY]: { en: "WE Pay", ar: "وي باي" },
};

export function getPaymentMethodLabel(method, locale = "en") {
  if (typeof method === "string") {
    const byLabel = Object.entries(PAYMENT_METHOD_LABELS).find(([, label]) => label === method);
    if (byLabel) {
      const numeric = Number(byLabel[0]);
      const option = PAYMENT_METHOD_OPTIONS.find((m) => m.value === numeric);
      if (option?.isMobileWallet) {
        return locale === "ar" ? option.labelAr : option.labelEn;
      }
      if (option?.isInstaPay) {
        return locale === "ar" ? option.labelAr : option.labelEn;
      }
      if (LEGACY_WALLET_LABELS[numeric]) {
        return locale === "ar" ? LEGACY_WALLET_LABELS[numeric].ar : LEGACY_WALLET_LABELS[numeric].en;
      }
    }
    return method;
  }

  const option = PAYMENT_METHOD_OPTIONS.find((m) => m.value === method);
  if (option?.isMobileWallet || option?.isInstaPay) {
    return locale === "ar" ? option.labelAr : option.labelEn;
  }
  if (option) return locale === "ar" ? option.labelAr : option.labelEn;

  if (typeof method === "number" && LEGACY_WALLET_LABELS[method]) {
    return locale === "ar" ? LEGACY_WALLET_LABELS[method].ar : LEGACY_WALLET_LABELS[method].en;
  }

  return String(method ?? "");
}
