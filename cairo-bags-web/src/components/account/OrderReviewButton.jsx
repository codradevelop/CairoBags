import { memo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

export const OrderReviewButton = memo(function OrderReviewButton({
  hasReviewed,
  onClick,
  className,
  size = "sm",
}) {
  const { locale } = useLocale();
  const label = hasReviewed
    ? locale === "ar"
      ? "تعديل التقييم"
      : "Edit Review"
    : locale === "ar"
      ? "اكتب تقييمًا"
      : "Write Review";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200",
        "border-brand-accent/40 bg-brand-accent/10 text-brand-text hover:border-brand-accent hover:bg-brand-accent/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
        sizes[size] ?? sizes.sm,
        className
      )}
    >
      <span aria-hidden="true">⭐</span>
      {label}
    </button>
  );
});
