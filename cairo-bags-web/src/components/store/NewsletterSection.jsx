import { useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { useNewsletter } from "../../context/NewsletterContext.jsx";
import * as newsletterService from "../../services/newsletterService.js";
import { cn } from "../../utils/cn.js";

const COPY = {
  en: {
    label: "Stay Updated",
    title: "Stay Ahead of Every Collection",
    description:
      "Be the first to discover new arrivals, exclusive collections, and members-only offers.",
    placeholder: "Enter your email address",
    button: "Subscribe",
    invalidEmpty: "Please enter your email address.",
    invalidFormat: "Please enter a valid email address.",
    genericError: "Something went wrong. Please try again.",
    subscribedTitle: "Welcome to Cairo Bags",
    subscribedSubtitle: "You're all set!",
    subscribedBenefits: [
      "Early access to new collections",
      "Exclusive member offers",
      "New arrivals alerts",
    ],
  },
  ar: {
    label: "ابقَ على اطلاع",
    title: "تقدّم على كل مجموعة",
    description:
      "كن أول من يكتشف الوصولات الجديدة، المجموعات الحصرية، وعروض الأعضاء فقط.",
    placeholder: "أدخل بريدك الإلكتروني",
    button: "اشترك",
    invalidEmpty: "يرجى إدخال بريدك الإلكتروني.",
    invalidFormat: "يرجى إدخال بريد إلكتروني صحيح.",
    genericError: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    subscribedTitle: "أهلاً بك في Cairo Bags",
    subscribedSubtitle: "كل شيء جاهز!",
    subscribedBenefits: [
      "وصول مبكر للمجموعات الجديدة",
      "عروض حصرية للأعضاء",
      "تنبيهات الوصولات الجديدة",
    ],
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value, copy) {
  const trimmed = value.trim();
  if (!trimmed) return copy.invalidEmpty;
  if (!EMAIL_PATTERN.test(trimmed)) return copy.invalidFormat;
  return "";
}

function MailIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NewsletterBannerSkeleton() {
  return (
    <div className="cb-nl-banner__skeleton" aria-busy="true" aria-label="Loading newsletter">
      <div className="cb-nl-banner__skeleton-left">
        <div className="cb-nl-banner__skeleton-icon" />
        <div className="cb-nl-banner__skeleton-text">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="cb-nl-banner__skeleton-form">
        <span />
        <span />
      </div>
    </div>
  );
}

function NewsletterBannerSuccess({ copy }) {
  return (
    <motion.div
      className="cb-nl-banner__success"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      role="status"
      aria-live="polite"
    >
      <div className="cb-nl-banner__success-head">
        <span className="cb-nl-banner__success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 12.5l2.5 2.5L16 9.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div className="cb-nl-banner__success-copy">
          <p className="cb-nl-banner__success-title">{copy.subscribedTitle}</p>
          <p className="cb-nl-banner__success-subtitle">{copy.subscribedSubtitle}</p>
        </div>
      </div>
      <ul className="cb-nl-banner__success-list">
        {copy.subscribedBenefits.map((item) => (
          <li key={item}>
            <span className="cb-nl-banner__success-check" aria-hidden="true">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function NewsletterBannerForm({
  copy,
  email,
  error,
  submitting,
  disabled,
  isAr,
  onEmailChange,
  onSubmit,
}) {
  return (
    <form className="cb-nl-banner__form" onSubmit={onSubmit} noValidate>
      <div className="cb-nl-banner__field">
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={onEmailChange}
          placeholder={copy.placeholder}
          autoComplete="email"
          disabled={disabled || submitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "newsletter-email-error" : undefined}
          className={cn("cb-nl-banner__input", error && "cb-nl-banner__input--error")}
          dir={isAr ? "rtl" : "ltr"}
        />
        <MailIcon className="cb-nl-banner__input-icon" />
      </div>
      <button type="submit" className="cb-nl-banner__btn" disabled={disabled || submitting}>
        <span>{copy.button}</span>
        <span aria-hidden="true">→</span>
      </button>
      {error ? (
        <p id="newsletter-email-error" className="cb-nl-banner__error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function NewsletterSection({ className }) {
  const { locale } = useLocale();
  const isAr = locale === "ar";
  const readOnly = useStoreReadOnly();
  const { isSubscribed, showLoadingSkeleton, markSubscribed } = useNewsletter();
  const copy = isAr ? COPY.ar : COPY.en;

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleEmailChange(event) {
    setEmail(event.target.value);
    if (error) setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (readOnly || isSubscribed) return;

    const validationError = validateEmail(email, copy);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setSubmitting(true);

    const trimmedEmail = email.trim();

    try {
      await newsletterService.subscribeNewsletter({
        email: trimmedEmail,
        language: locale,
      });
      markSubscribed(trimmedEmail);
    } catch (err) {
      if (err.code === "already_subscribed") {
        markSubscribed(trimmedEmail);
      } else if (err.code === "invalid_email") {
        setError(copy.invalidFormat);
      } else {
        setError(err.message || copy.genericError);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.section
      className={cn("cb-nl-banner", className)}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-labelledby="newsletter-banner-title"
    >
      <div className={cn("cb-nl-banner__card", isSubscribed && "cb-nl-banner__card--success")}>
        <span className="cb-nl-banner__glow" aria-hidden="true" />
        <span className="cb-nl-banner__shimmer" aria-hidden="true" />

        <div className={cn("cb-nl-banner__inner", isAr && "cb-nl-banner__inner--rtl")}>
          <div className="cb-nl-banner__left">
            <div className="cb-nl-banner__icon-wrap" aria-hidden="true">
              <MailIcon className="cb-nl-banner__icon" />
            </div>
            <div className="cb-nl-banner__copy">
              <span className="cb-nl-banner__label">{copy.label}</span>
              <h2 id="newsletter-banner-title" className="cb-nl-banner__title">
                {copy.title}
              </h2>
              <p className="cb-nl-banner__desc">{copy.description}</p>
            </div>
          </div>

          <div className="cb-nl-banner__right">
            {showLoadingSkeleton ? (
              <NewsletterBannerSkeleton />
            ) : isSubscribed ? (
              <NewsletterBannerSuccess copy={copy} />
            ) : (
              <NewsletterBannerForm
                copy={copy}
                email={email}
                error={error}
                submitting={submitting}
                disabled={readOnly}
                isAr={isAr}
                onEmailChange={handleEmailChange}
                onSubmit={handleSubmit}
              />
            )}
          </div>
        </div>
      </div>
    </motion.section>
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
      <div className="cb-store-section-header mb-10">
        <p className="cb-section-label">{locale === "ar" ? "قيمنا" : "Our Values"}</p>
        <h2 className="cb-section-heading mt-2">
          {locale === "ar" ? "لماذا Cairo Bags؟" : "Why Cairo Bags?"}
        </h2>
      </div>
      <div className="cb-values-grid">
        {items.map((item, index) => (
          <div key={item.title} className="cb-value-card" style={{ animationDelay: `${index * 80}ms` }}>
            <div className="cb-value-card-index">{String(index + 1).padStart(2, "0")}</div>
            <h3 className="font-display text-lg font-medium text-brand-text">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-muted">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
