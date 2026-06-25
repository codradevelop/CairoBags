import { memo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { StarRating } from "./StarRating.jsx";
import { Button } from "../ui/Button.jsx";
import { cn } from "../../utils/cn.js";

export const ReviewEmptyState = memo(function ReviewEmptyState({
  className,
  onWriteReview,
  showWriteButton = false,
}) {
  const { locale } = useLocale();

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-brand-border bg-brand-surface px-6 py-12 text-center shadow-card md:px-10 md:py-14",
        className
      )}
    >
      <StarRating value={0} size="lg" className="justify-center opacity-40" label="" />
      <h3 className="mt-5 font-display text-xl font-medium text-brand-text md:text-2xl">
        {locale === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-brand-muted md:text-base">
        {locale === "ar"
          ? "كن أول عميل يقيّم هذا المنتج."
          : "Be the first customer to review this product."}
      </p>
      {showWriteButton ? (
        <Button type="button" variant="accent" size="lg" className="mt-8 min-w-[12rem]" onClick={onWriteReview}>
          {locale === "ar" ? "اكتب تقييمًا" : "Write a Review"}
        </Button>
      ) : null}
    </div>
  );
});
