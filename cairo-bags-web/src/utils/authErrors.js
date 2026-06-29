/**
 * User-friendly auth error copy for login/register flows.
 */
export function getAuthErrorMessage(error, locale = "en") {
  const msg = String(error?.message ?? "").trim();
  const lower = msg.toLowerCase();

  if (lower.includes("user not found")) {
    return locale === "ar"
      ? "لا يوجد حساب بهذا البريد الإلكتروني."
      : "No account found with this email.";
  }

  if (lower.includes("password incorrect") || lower.includes("email and/or")) {
    return locale === "ar"
      ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
      : "Incorrect email or password.";
  }

  if (error?.status === 401 || error?.isAuthError) {
    return locale === "ar" ? "بيانات الدخول غير صحيحة." : "Invalid sign-in credentials.";
  }

  if (msg && !/request failed with status code/i.test(msg)) {
    return msg;
  }

  return locale === "ar" ? "فشل تسجيل الدخول. حاول مرة أخرى." : "Sign in failed. Please try again.";
}
