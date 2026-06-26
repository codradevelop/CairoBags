import { memo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { EmptyState, EmptyStateAction } from "../store/EmptyState.jsx";
import { cn } from "../../utils/cn.js";

export const ReviewEmptyState = memo(function ReviewEmptyState({
  className,
  onWriteReview,
  showWriteButton = false,
}) {
  const { locale } = useLocale();

  return (
    <EmptyState
      className={cn("max-w-xl", className)}
      variant="reviews"
      title={locale === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}
      description={
        locale === "ar"
          ? "كن أول عميل يقيّم هذا المنتج."
          : "Be the first customer to review this product."
      }
      action={
        showWriteButton ? (
          <EmptyStateAction type="button" size="lg" onClick={onWriteReview}>
            {locale === "ar" ? "اكتب تقييمًا" : "Write a Review"}
          </EmptyStateAction>
        ) : null
      }
    />
  );
});
