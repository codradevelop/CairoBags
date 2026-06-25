import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button.jsx";
import { FieldError, Input } from "../ui/Input.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { cn } from "../../utils/cn.js";

const COPY = {
  en: {
    label: "Exclusive Welcome Offer",
    title: "Get 10% OFF Your First Order",
    description:
      "Subscribe with your email and we'll send you an exclusive 10% discount coupon directly to your inbox.",
    placeholder: "Enter your email address",
    button: "Get My Coupon",
    disclaimer: "No spam. Only exclusive offers and early access to new collections.",
    invalidEmpty: "Please enter your email address.",
    invalidFormat: "Please enter a valid email address.",
    successTitle: "Welcome to Cairo Bags!",
    successLead: "Your exclusive 10% discount coupon will be sent to your email shortly.",
    successHint: "Please check your inbox (and spam folder if needed).",
    continueShopping: "Continue Shopping",
  },
  ar: {
    label: "العرض الترحيبي",
    title: "احصل على خصم 10٪ على أول طلب",
    description:
      "أدخل بريدك الإلكتروني وسنرسل لك كوبون خصم 10٪ مباشرة إلى بريدك الإلكتروني.",
    placeholder: "أدخل بريدك الإلكتروني",
    button: "احصل على الكوبون",
    disclaimer: "لن نرسل رسائل مزعجة. فقط عروض حصرية وإطلاقات جديدة.",
    invalidEmpty: "يرجى إدخال بريدك الإلكتروني.",
    invalidFormat: "يرجى إدخال بريد إلكتروني صحيح.",
    successTitle: "أهلاً بك في Cairo Bags",
    successLead: "سيتم إرسال كوبون خصم 10٪ إلى بريدك الإلكتروني خلال لحظات.",
    successHint: "يرجى التحقق من صندوق الوارد أو الرسائل غير المرغوب فيها.",
    continueShopping: "متابعة التسوق",
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value, copy) {
  const trimmed = value.trim();
  if (!trimmed) return copy.invalidEmpty;
  if (!EMAIL_PATTERN.test(trimmed)) return copy.invalidFormat;
  return "";
}

// TODO: Replace mock success with POST /api/newsletter/subscribe
async function subscribeToWelcomeCoupon(_email) {
  await new Promise((resolve) => window.setTimeout(resolve, 700));
  return { success: true };
}

function WelcomeCouponSuccess({ copy, className }) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "mx-auto flex max-w-lg flex-col items-center text-center",
        "animate-slide-down motion-reduce:animate-none",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "mb-5 flex h-14 w-14 items-center justify-center rounded-full",
          "bg-brand-accent/15 text-2xl ring-1 ring-brand-accent/30",
          "shadow-glow-sm dark:bg-brand-accent/20"
        )}
        aria-hidden="true"
      >
        🎉
      </div>

      <p className="text-xs font-medium tracking-[0.25em] text-brand-accent uppercase">
        {copy.label}
      </p>
      <h2 className="mt-3 font-display text-2xl font-medium text-brand-text md:text-3xl">
        {copy.successTitle}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-brand-muted md:text-base">
        {copy.successLead}
      </p>
      <p className="mt-2 text-sm text-brand-muted/90">{copy.successHint}</p>

      <Button
        type="button"
        variant="accent"
        size="lg"
        className="mt-8 h-12 min-w-[160px] px-6 text-base"
        onClick={() => navigate("/shop")}
      >
        {copy.continueShopping}
      </Button>
    </div>
  );
}

function WelcomeCouponForm({ copy, email, error, submitting, disabled, onEmailChange, onSubmit }) {
  return (
    <div className="animate-fade-in motion-reduce:animate-none">
      <p className="text-xs font-medium tracking-[0.25em] text-brand-accent uppercase">
        {copy.label}
      </p>
      <h2 className="mt-3 font-display text-2xl font-medium text-brand-text md:text-3xl">
        {copy.title}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-brand-muted md:text-base">
        {copy.description}
      </p>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mx-auto mt-8 max-w-md space-y-3 text-start"
      >
        <div>
          <Input
            id="welcome-coupon-email"
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder={copy.placeholder}
            variant={error ? "error" : "default"}
            autoComplete="email"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "welcome-coupon-email-error" : undefined}
            disabled={disabled || submitting}
            className="transition-shadow duration-fast"
          />
          <FieldError id="welcome-coupon-email-error">{error}</FieldError>
        </div>

        <div className="flex justify-center pt-1">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            loading={submitting}
            disabled={disabled || submitting}
            className="h-12 min-w-[160px] px-6 text-base"
          >
            {copy.button}
          </Button>
        </div>
      </form>

      <p className="mx-auto mt-5 max-w-md text-xs leading-relaxed text-brand-muted/90">
        {copy.disclaimer}
      </p>
    </div>
  );
}

export function NewsletterSection({ className }) {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();
  const copy = locale === "ar" ? COPY.ar : COPY.en;

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle");

  const submitting = status === "submitting";
  const succeeded = status === "success";

  function handleEmailChange(event) {
    setEmail(event.target.value);
    if (error) setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (readOnly) return;
    const validationError = validateEmail(email, copy);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setStatus("submitting");

    try {
      await subscribeToWelcomeCoupon(email.trim());
      setStatus("success");
    } catch {
      setStatus("idle");
      setError(
        locale === "ar"
          ? "حدث خطأ. يرجى المحاولة مرة أخرى."
          : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-brand-border bg-brand-secondary px-6 py-10 text-center shadow-soft md:px-12 md:py-14",
        "transition-all duration-slow dark:border-brand-border dark:bg-brand-surface-dark",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent"
        aria-hidden="true"
      />

      {succeeded ? (
        <WelcomeCouponSuccess copy={copy} />
      ) : (
        <WelcomeCouponForm
          copy={copy}
          email={email}
          error={error}
          submitting={submitting}
          disabled={readOnly}
          onEmailChange={handleEmailChange}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}

export function WhyChooseSection({ className }) {
  const { locale } = useLocale();

  const items = [
    {
      title: locale === "ar" ? "حرفية فاخرة" : "Luxury Craftsmanship",
      desc:
        locale === "ar"
          ? "كل قطعة مصنوعة بعناية فائقة من أجود الخامات"
          : "Each piece is meticulously crafted from premium materials",
    },
    {
      title: locale === "ar" ? "تصاميم خالدة" : "Timeless Design",
      desc:
        locale === "ar"
          ? "أناقة لا تتأثر بمواسم الموضة"
          : "Elegance that transcends seasonal trends",
    },
    {
      title: locale === "ar" ? "شحن مميز" : "Premium Delivery",
      desc:
        locale === "ar"
          ? "تغليف فاخر وتوصيل آمن لباب منزلك"
          : "Luxury packaging and secure delivery to your door",
    },
  ];

  return (
    <section className={cn(className)}>
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-medium text-brand-text md:text-3xl">
          {locale === "ar" ? "لماذا Cairo Bags؟" : "Why Cairo Bags?"}
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-brand-border bg-brand-surface p-6 text-center dark:bg-brand-surface-dark"
          >
            <div className="mx-auto mb-4 h-px w-10 bg-brand-accent" />
            <h3 className="font-display text-lg font-medium text-brand-text">{item.title}</h3>
            <p className="mt-2 text-sm text-brand-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
