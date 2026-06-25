import { memo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

export const VerifiedPurchaseBadge = memo(function VerifiedPurchaseBadge({ className }) {
  const { locale } = useLocale();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5",
        "text-[10px] font-medium tracking-wide text-emerald-800",
        "dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300",
        className
      )}
    >
      <span aria-hidden="true">✔</span>
      {locale === "ar" ? "شراء موثّق" : "Verified Purchase"}
    </span>
  );
});
