import { COUPON_TYPE } from "../constants/couponHelpers.js";

export const SHIPPING_ERROR_MESSAGES = {
  en: {
    shipping_unavailable:
      "Shipping is currently unavailable for the selected governorate. Please choose another governorate or contact support.",
    governorate_invalid:
      "Shipping is currently unavailable for the selected governorate. Please choose another governorate or contact support.",
    governorate_required: "Please select your governorate.",
  },
  ar: {
    shipping_unavailable:
      "الشحن غير متاح حاليًا للمحافظة المختارة. يرجى اختيار محافظة أخرى أو التواصل مع الدعم.",
    governorate_invalid:
      "الشحن غير متاح حاليًا للمحافظة المختارة. يرجى اختيار محافظة أخرى أو التواصل مع الدعم.",
    governorate_required: "يرجى اختيار المحافظة.",
  },
};

export function getShippingErrorMessage(code, locale = "en", fallback) {
  const map = locale === "ar" ? SHIPPING_ERROR_MESSAGES.ar : SHIPPING_ERROR_MESSAGES.en;
  return map[code] || fallback || map.shipping_unavailable;
}

export function getGovernorateLabel(governorate, locale = "en") {
  if (!governorate) return "";
  return locale === "ar"
    ? governorate.nameAr ?? governorate.NameAr ?? governorate.nameEn ?? governorate.NameEn
    : governorate.nameEn ?? governorate.NameEn ?? governorate.nameAr ?? governorate.NameAr;
}

export function getGovernorateValue(governorate) {
  return governorate?.nameEn ?? governorate?.NameEn ?? "";
}

const GOVERNORATE_ALIASES = {
  قاهره: "Cairo",
  قاهرة: "Cairo",
  القاهره: "Cairo",
  الجيزه: "Giza",
  الجيزة: "Giza",
  اسكندريه: "Alexandria",
  الإسكندرية: "Alexandria",
  الاسكندرية: "Alexandria",
};

export function normalizeGovernorateName(name) {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "";
  return GOVERNORATE_ALIASES[trimmed] ?? trimmed;
}

export function findGovernorateByName(governorates, name) {
  if (!name || !Array.isArray(governorates)) return null;
  const trimmed = normalizeGovernorateName(name);
  return (
    governorates.find(
      (g) =>
        (g.nameEn ?? g.NameEn) === trimmed ||
        (g.nameAr ?? g.NameAr) === trimmed ||
        (g.nameEn ?? g.NameEn) === name.trim() ||
        (g.nameAr ?? g.NameAr) === name.trim()
    ) ?? null
  );
}

export function resolveGovernorateFormValue(governorates, storedName) {
  const found = findGovernorateByName(governorates, storedName);
  if (found) return getGovernorateValue(found);
  return normalizeGovernorateName(storedName);
}

export function resolveShippingFee({ governorates, governorateName, appliedCoupon }) {
  const governorate = findGovernorateByName(governorates, governorateName);
  if (!governorate) return null;

  const type = appliedCoupon?.type ?? appliedCoupon?.Type;
  const freeShipping =
    appliedCoupon?.freeShipping ??
    appliedCoupon?.FreeShipping ??
    type === COUPON_TYPE.FREE_SHIPPING;

  if (freeShipping) return 0;

  return governorate.shippingFee ?? governorate.ShippingFee ?? null;
}

export function buildCheckoutTotals({
  subTotal = 0,
  discountAmount = 0,
  shippingFee = null,
}) {
  const discount = discountAmount ?? 0;
  const shipping = shippingFee ?? 0;
  // Discount applies to products only; shipping is added after product discount.
  const total =
    shippingFee == null ? null : Math.max(0, subTotal - discount) + shipping;

  return {
    subTotal,
    discountAmount: discount,
    shippingFee,
    totalAmount: total,
  };
}
