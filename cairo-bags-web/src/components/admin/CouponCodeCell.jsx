import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useToast } from "../ui/Toast.jsx";
import { CopyIcon } from "../checkout/paymentUi.jsx";
import { cn } from "../../utils/cn.js";

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 12.5l4 4 8-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyCouponCodeButton({ code, className }) {
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const copyCode = useCallback(async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      success(
        locale === "ar" ? "تم نسخ كود الخصم بنجاح." : "Coupon code copied successfully."
      );
      setCopied(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setCopied(false), 1200);
    } catch {
      toastError(locale === "ar" ? "تعذر نسخ الكود" : "Could not copy coupon code");
    }
  }, [code, locale, success, toastError]);

  return (
    <button
      type="button"
      onClick={copyCode}
      title={locale === "ar" ? "نسخ كود الخصم" : "Copy Coupon Code"}
      aria-label="Copy coupon code"
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-brand-border/70",
        "bg-brand-surface text-brand-muted transition-all duration-300",
        "hover:scale-105 hover:border-brand-accent/45 hover:bg-brand-accent/10 hover:text-brand-accent hover:shadow-[0_4px_12px_-4px_rgba(201,169,98,0.45)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40",
        copied && "border-brand-accent/50 bg-brand-accent/15 text-brand-accent",
        className
      )}
    >
      {copied ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <CopyIcon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function CouponCodeCell({ code, couponId, className }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)}>
      <Link
        to={`/admin/coupons/${couponId}`}
        className="truncate font-medium text-brand-accent transition-colors hover:text-brand-accent-muted hover:underline"
      >
        {code}
      </Link>
      <CopyCouponCodeButton code={code} />
    </div>
  );
}
