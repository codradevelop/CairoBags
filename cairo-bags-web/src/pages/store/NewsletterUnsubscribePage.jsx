import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useNewsletter } from "../../context/NewsletterContext.jsx";
import * as newsletterService from "../../services/newsletterService.js";
import { cn } from "../../utils/cn.js";

export function NewsletterUnsubscribePage() {
  const { locale } = useLocale();
  const { markUnsubscribed } = useNewsletter();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const title = locale === "ar" ? "إلغاء الاشتراك" : "Unsubscribe";
  usePageTitle(title);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(locale === "ar" ? "رابط إلغاء الاشتراك غير صالح." : "Invalid unsubscribe link.");
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const data = await newsletterService.unsubscribeNewsletter(token);
        if (!cancelled) {
          markUnsubscribed();
          setStatus("success");
          setMessage(data?.message ?? (locale === "ar" ? "تم إلغاء الاشتراك بنجاح." : "You have successfully unsubscribed."));
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setMessage(err.message ?? (locale === "ar" ? "تعذر إلغاء الاشتراك." : "Unable to unsubscribe."));
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, locale, markUnsubscribed]);

  return (
    <StoreLayout contentClassName="!py-16 md:!py-24">
      <div className="mx-auto max-w-lg text-center">
        {status === "loading" ? (
          <div className="animate-pulse space-y-4" aria-busy="true">
            <div className="mx-auto h-14 w-14 rounded-full bg-brand-secondary/40" />
            <div className="mx-auto h-6 w-48 rounded bg-brand-secondary/30" />
            <div className="mx-auto h-4 w-full max-w-sm rounded bg-brand-secondary/20" />
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl border border-brand-border/70 bg-brand-primary px-8 py-12",
              "animate-fade-in motion-reduce:animate-none"
            )}
            role="status"
            aria-live="polite"
          >
            <div
              className={cn(
                "mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full text-2xl",
                status === "success"
                  ? "bg-brand-accent/15 text-brand-accent ring-1 ring-brand-accent/30"
                  : "bg-brand-error/10 text-brand-error ring-1 ring-brand-error/20"
              )}
              aria-hidden="true"
            >
              {status === "success" ? "✓" : "!"}
            </div>
            <h1 className="font-display text-2xl font-light text-brand-secondary md:text-3xl">
              {status === "success"
                ? locale === "ar"
                  ? "تم إلغاء الاشتراك"
                  : "Unsubscribed"
                : locale === "ar"
                  ? "حدث خطأ"
                  : "Something went wrong"}
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-brand-secondary/60">{message}</p>
            <Link
              to="/"
              className="cb-btn-accent mt-8 inline-flex h-11 min-h-11 items-center justify-center px-7 text-sm tracking-wide"
            >
              {locale === "ar" ? "العودة للمتجر" : "Back to Store"}
            </Link>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
