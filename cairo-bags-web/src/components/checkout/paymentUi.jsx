import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useToast } from "../ui/Toast.jsx";
import {
  PAYMENT_WALLET_NUMBER_COPY,
  PAYMENT_WALLET_NUMBER_DISPLAY,
} from "../../constants/paymentMethodOptions.js";
import { cn } from "../../utils/cn.js";

export function CopyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function InfoIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PaymentSectionTitle({ children, className }) {
  return (
    <p
      className={cn(
        "mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-muted",
        className
      )}
    >
      {children}
    </p>
  );
}

export function PaymentWalletNumber({
  className,
  titleEn = "Wallet Number",
  titleAr = "رقم المحفظة",
  copySuccessEn = "Wallet number copied successfully.",
  copySuccessAr = "تم نسخ رقم المحفظة بنجاح.",
  copyAriaEn = "Copy wallet number",
  copyAriaAr = "نسخ رقم المحفظة",
}) {
  const { locale } = useLocale();
  const { success, error: toastError } = useToast();
  const isAr = locale === "ar";
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const copyNumber = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_WALLET_NUMBER_COPY);
      success(isAr ? copySuccessAr : copySuccessEn);
      setCopied(true);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setCopied(false), 1000);
    } catch {
      toastError(isAr ? "تعذر نسخ الرقم" : "Could not copy number");
    }
  }, [copySuccessAr, copySuccessEn, isAr, success, toastError]);

  return (
    <section
      className={cn(
        "mb-8 rounded-2xl border bg-brand-surface px-4 py-3 shadow-[0_4px_20px_-10px_rgba(201,169,98,0.22)] transition-[border-color,box-shadow] duration-300 sm:mb-9 sm:px-5 sm:py-3.5",
        copied
          ? "border-brand-accent shadow-[0_0_0_1px_rgba(201,169,98,0.35),0_6px_24px_-8px_rgba(201,169,98,0.35)]"
          : "border-brand-accent/25",
        className
      )}
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
        {isAr ? titleAr : titleEn}
      </p>

      <div
        className={cn(
          "flex min-h-10 items-center gap-3",
          isAr ? "flex-row-reverse" : "flex-row"
        )}
      >
        <p
          className={cn(
            "min-w-0 flex-1 font-sans text-[22px] font-semibold tabular-nums leading-tight tracking-[0.05em] text-brand-text sm:text-[28px]",
            isAr ? "text-end" : "text-start"
          )}
          dir="ltr"
        >
          {PAYMENT_WALLET_NUMBER_DISPLAY}
        </p>

        <button
          type="button"
          onClick={copyNumber}
          className={cn(
            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-white",
            "border-brand-accent/45 text-brand-accent",
            "transition-all duration-200 ease-out",
            "hover:scale-105 hover:border-brand-accent hover:bg-brand-accent/10 hover:shadow-[0_4px_14px_-4px_rgba(201,169,98,0.45)]",
            "active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 focus-visible:ring-offset-2",
            copied && "border-brand-accent bg-brand-accent/10"
          )}
          aria-label={isAr ? copyAriaAr : copyAriaEn}
        >
          <span
            className={cn(
              "transition-transform duration-200",
              copied ? "scale-100 opacity-100" : "scale-100 opacity-100"
            )}
          >
            {copied ? (
              <CheckIcon className="h-[18px] w-[18px]" />
            ) : (
              <CopyIcon className="h-[17px] w-[17px]" />
            )}
          </span>
        </button>
      </div>
    </section>
  );
}

export function PaymentWarningNotice({ className }) {
  const { locale } = useLocale();
  const isAr = locale === "ar";

  return (
    <div
      className={cn(
        "flex gap-3.5 rounded-2xl border border-brand-accent/35 bg-brand-accent/10 px-5 py-4",
        "text-[15px] leading-7 text-brand-text",
        className
      )}
    >
      <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-accent" />
      <p>
        {isAr
          ? "يرجى إرسال المبلغ الإجمالي الظاهر في ملخص الطلب بالضبط. قد تتطلب المبالغ غير الصحيحة تحققاً يدوياً."
          : "Please send the exact total shown in your order summary. Incorrect amounts may require manual verification."}
      </p>
    </div>
  );
}

export function PaymentInstructionsList({ steps, className }) {
  return (
    <ol className={cn("space-y-3 text-[15px] leading-7 text-brand-muted", className)}>
      {steps.map((step, index) => (
        <li key={index} className="flex gap-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-accent/15 text-xs font-semibold text-brand-accent">
            {index + 1}
          </span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function PaymentDetailCard({ header, children, className }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-brand-accent/25 bg-gradient-to-b from-brand-surface to-brand-background/50",
        "shadow-[0_10px_40px_-14px_rgba(201,169,98,0.28)]",
        className
      )}
    >
      <div className="border-b border-brand-accent/15 bg-brand-accent/5 px-5 py-4 sm:px-6 sm:py-5">
        {header}
      </div>
      <div className="space-y-7 px-5 py-6 sm:space-y-8 sm:px-6 sm:py-7">{children}</div>
    </div>
  );
}
