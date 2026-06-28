export const PAYMENT_PHONE_LENGTH = 11;

export function sanitizePhoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, PAYMENT_PHONE_LENGTH);
}

export function isValidPaymentPhone(value) {
  return /^\d{11}$/.test(String(value ?? ""));
}

export function getPaymentPhoneValidationMessage(locale = "en") {
  return locale === "ar"
    ? "يجب أن يحتوي رقم الهاتف على 11 رقمًا بالضبط."
    : "Phone number must contain exactly 11 digits.";
}
