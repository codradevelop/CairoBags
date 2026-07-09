import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthPageLayout } from "./AuthPageLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import "./Auth.css";

function getRedirectPath(user, from) {
  if (from && from !== "/login" && from !== "/register") return from;
  if (user?.role?.includes("Admin")) return "/admin";
  return "/account";
}

function PasswordField({ id, value, onChange, placeholder, error, show, onToggleShow, toggleLabel }) {
  return (
    <div className="password-field-wrap">
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        required
        className={error ? "input-error" : ""}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={onToggleShow}
        aria-label={toggleLabel}
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          {show ? (
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          ) : (
            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
          )}
        </svg>
      </button>
    </div>
  );
}

function getLoginErrorMessage(err, locale) {
  if (err?.status === 401 || err?.isAuthError) {
    return locale === "ar"
      ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      : "Invalid email or password";
  }

  return err.message || (locale === "ar" ? "فشل تسجيل الدخول" : "Sign in failed");
}

export function AuthSlidingPanel({ initialPanelActive = false }) {
  const { locale } = useLocale();
  const { login, register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [panelActive, setPanelActive] = useState(initialPanelActive);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    userName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});
  const [registerErrors, setRegisterErrors] = useState({});
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  const wrapperClassName = useMemo(
    () =>
      `auth-wrapper${panelActive ? " panel-active auth-wrapper--register" : ""}`,
    [panelActive]
  );

  const copy = {
    loginTitle: locale === "ar" ? "تسجيل الدخول" : "Sign In",
    registerTitle: locale === "ar" ? "إنشاء حساب" : "Create Account",
    email: locale === "ar" ? "البريد الإلكتروني" : "Email Address",
    password: locale === "ar" ? "كلمة المرور" : "Password",
    userName: locale === "ar" ? "اسم المستخدم" : "Username",
    phone: locale === "ar" ? "رقم الهاتف" : "Phone Number",
    confirm: locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password",
    loginSubmit: locale === "ar" ? "تسجيل الدخول" : "Sign In",
    registerSubmit: locale === "ar" ? "إنشاء حساب" : "Sign Up",
    forgot: locale === "ar" ? "نسيت كلمة المرور؟" : "Forgot your password?",
    welcomeBack: locale === "ar" ? "مرحباً بعودتك!" : "Welcome Back!",
    welcomeBackDesc:
      locale === "ar"
        ? "ابقَ على تواصل من خلال تسجيل الدخول وتابع تجربتك معنا"
        : "Stay connected by logging in with your credentials and continue your experience",
    heyThere: locale === "ar" ? "أهلاً بك!" : "Hey There!",
    heyThereDesc:
      locale === "ar"
        ? "ابدأ رحلتك معنا بإنشاء حساب جديد اليوم"
        : "Begin your amazing journey by creating an account with us today",
    panelLogin: locale === "ar" ? "تسجيل الدخول" : "Sign In",
    panelRegister: locale === "ar" ? "إنشاء حساب" : "Sign Up",
    mobileNoAccount: locale === "ar" ? "ليس لديك حساب؟" : "Don't have an account?",
    mobileHasAccount: locale === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?",
    passwordHint: locale === "ar" ? "٩ أحرف على الأقل" : "At least 9 characters",
    required: locale === "ar" ? "مطلوب" : "Required",
    signingIn: locale === "ar" ? "جاري الدخول..." : "Signing In...",
    signingUp: locale === "ar" ? "جاري التسجيل..." : "Signing Up...",
    showPassword: locale === "ar" ? "إظهار كلمة المرور" : "Show password",
    hidePassword: locale === "ar" ? "إخفاء كلمة المرور" : "Hide password",
  };

  function openLoginPanel() {
    setPanelActive(false);
  }

  function openRegisterPanel() {
    setPanelActive(true);
  }

  function validateLogin() {
    const nextErrors = {};
    if (!loginForm.email.trim()) nextErrors.email = copy.required;
    if (!loginForm.password) nextErrors.password = copy.required;
    return nextErrors;
  }

  function validateRegister() {
    const nextErrors = {};
    if (!registerForm.userName.trim()) nextErrors.userName = copy.required;
    if (!registerForm.email.trim()) nextErrors.email = copy.required;
    if (!registerForm.phoneNumber.trim()) nextErrors.phoneNumber = copy.required;
    if (!registerForm.password) nextErrors.password = copy.required;
    else if (registerForm.password.length < 9) {
      nextErrors.password = copy.passwordHint;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      nextErrors.confirmPassword =
        locale === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match";
    }
    return nextErrors;
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLogin();
    setLoginErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoginSubmitting(true);
    try {
      const response = await login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      success(locale === "ar" ? "تم تسجيل الدخول" : "Signed in successfully");
      navigate(getRedirectPath(response.user, from), { replace: true });
    } catch (err) {
      toastError(getLoginErrorMessage(err, locale));
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    const nextErrors = validateRegister();
    setRegisterErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setRegisterSubmitting(true);
    try {
      await register({
        userName: registerForm.userName.trim(),
        email: registerForm.email.trim(),
        phoneNumber: registerForm.phoneNumber.trim(),
        password: registerForm.password,
      });
      success(locale === "ar" ? "تم إنشاء الحساب" : "Account created successfully");
      navigate("/account", { replace: true });
    } catch (err) {
      toastError(err.message || (locale === "ar" ? "فشل التسجيل" : "Registration failed"));
    } finally {
      setRegisterSubmitting(false);
    }
  }

  return (
    <AuthPageLayout variant="sliding">
      <div className="auth-page" dir="ltr" lang={locale === "ar" ? "ar" : "en"}>
        <div className={wrapperClassName} id="authWrapper">
          <div className="auth-form-box register-form-box">
            <form onSubmit={handleRegisterSubmit} noValidate>
              <h1 className="font-display">{copy.registerTitle}</h1>
              <input
                type="text"
                placeholder={copy.userName}
                required
                className={registerErrors.userName ? "input-error" : ""}
                value={registerForm.userName}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, userName: e.target.value }));
                  if (registerErrors.userName) {
                    setRegisterErrors((prev) => ({ ...prev, userName: "" }));
                  }
                }}
              />
              {registerErrors.userName ? <div className="error-text">{registerErrors.userName}</div> : null}
              <input
                type="email"
                placeholder={copy.email}
                required
                className={registerErrors.email ? "input-error" : ""}
                value={registerForm.email}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, email: e.target.value }));
                  if (registerErrors.email) {
                    setRegisterErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
              />
              {registerErrors.email ? <div className="error-text">{registerErrors.email}</div> : null}
              <input
                type="tel"
                placeholder={copy.phone}
                required
                className={registerErrors.phoneNumber ? "input-error" : ""}
                value={registerForm.phoneNumber}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, phoneNumber: e.target.value }));
                  if (registerErrors.phoneNumber) {
                    setRegisterErrors((prev) => ({ ...prev, phoneNumber: "" }));
                  }
                }}
              />
              {registerErrors.phoneNumber ? (
                <div className="error-text">{registerErrors.phoneNumber}</div>
              ) : null}
              <PasswordField
                id="register-password"
                placeholder={copy.password}
                value={registerForm.password}
                error={registerErrors.password}
                show={showRegisterPassword}
                onToggleShow={() => setShowRegisterPassword((prev) => !prev)}
                toggleLabel={showRegisterPassword ? copy.hidePassword : copy.showPassword}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, password: e.target.value }));
                  if (registerErrors.password) {
                    setRegisterErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
              />
              {registerErrors.password ? <div className="error-text">{registerErrors.password}</div> : null}
              <PasswordField
                id="register-confirm"
                placeholder={copy.confirm}
                value={registerForm.confirmPassword}
                error={registerErrors.confirmPassword}
                show={showRegisterConfirmPassword}
                onToggleShow={() => setShowRegisterConfirmPassword((prev) => !prev)}
                toggleLabel={showRegisterConfirmPassword ? copy.hidePassword : copy.showPassword}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }));
                  if (registerErrors.confirmPassword) {
                    setRegisterErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
              />
              {registerErrors.confirmPassword ? (
                <div className="error-text">{registerErrors.confirmPassword}</div>
              ) : null}
              <button type="submit" disabled={registerSubmitting}>
                {registerSubmitting ? copy.signingUp : copy.registerSubmit}
              </button>
              <div className="mobile-switch">
                <p>{copy.mobileHasAccount}</p>
                <button type="button" id="mobileLoginBtn" onClick={openLoginPanel}>
                  {copy.panelLogin}
                </button>
              </div>
            </form>
          </div>

          <div className="auth-form-box login-form-box">
            <form onSubmit={handleLoginSubmit} noValidate>
              <h1 className="font-display">{copy.loginTitle}</h1>
              <input
                type="email"
                placeholder={copy.email}
                required
                className={loginErrors.email ? "input-error" : ""}
                value={loginForm.email}
                onChange={(e) => {
                  setLoginForm((prev) => ({ ...prev, email: e.target.value }));
                  if (loginErrors.email) {
                    setLoginErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
              />
              {loginErrors.email ? <div className="error-text">{loginErrors.email}</div> : null}
              <PasswordField
                id="login-password"
                placeholder={copy.password}
                value={loginForm.password}
                error={loginErrors.password}
                show={showLoginPassword}
                onToggleShow={() => setShowLoginPassword((prev) => !prev)}
                toggleLabel={showLoginPassword ? copy.hidePassword : copy.showPassword}
                onChange={(e) => {
                  setLoginForm((prev) => ({ ...prev, password: e.target.value }));
                  if (loginErrors.password) {
                    setLoginErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
              />
              {loginErrors.password ? <div className="error-text">{loginErrors.password}</div> : null}
              <Link to="/forgot-password" className="auth-forgot-link">
                {copy.forgot}
              </Link>
              <button type="submit" disabled={loginSubmitting}>
                {loginSubmitting ? copy.signingIn : copy.loginSubmit}
              </button>
              <div className="mobile-switch">
                <p>{copy.mobileNoAccount}</p>
                <button type="button" id="mobileRegisterBtn" onClick={openRegisterPanel}>
                  {copy.panelRegister}
                </button>
              </div>
            </form>
          </div>

          <div className="slide-panel-wrapper">
            <div className="slide-panel">
              <div className="panel-content panel-content-left">
                <h1 className="font-display">{copy.welcomeBack}</h1>
                <p>{copy.welcomeBackDesc}</p>
                <button type="button" className="transparent-btn" id="loginBtn" onClick={openLoginPanel}>
                  {copy.panelLogin}
                </button>
              </div>
              <div className="panel-content panel-content-right">
                <h1 className="font-display">{copy.heyThere}</h1>
                <p>{copy.heyThereDesc}</p>
                <button
                  type="button"
                  className="transparent-btn"
                  id="registerBtn"
                  onClick={openRegisterPanel}
                >
                  {copy.panelRegister}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  );
}
