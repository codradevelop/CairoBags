import { memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { getProductRatingStats } from "../../utils/reviewHelpers.js";
import { useProductRatings } from "../../context/ProductRatingContext.jsx";
import { requestReviewsHighlight } from "../../utils/reviewScrollUtils.js";
import { StarRating } from "./StarRating.jsx";
import { cn } from "../../utils/cn.js";

export const ProductRatingLine = memo(function ProductRatingLine({
  product,
  className,
  size = "xs",
  linkToReviews,
  onReviewsClick,
}) {
  const { locale } = useLocale();
  const { getRatingForProduct } = useProductRatings();
  const { averageRating, reviewCount } = getRatingForProduct(product);
  const hasReviews = reviewCount > 0;
  const displayRating = hasReviews ? averageRating : 0;

  const ariaLabel = hasReviews
    ? locale === "ar"
      ? `التقييم ${displayRating.toFixed(1)} من 5، ${reviewCount} تقييم`
      : `Rated ${displayRating.toFixed(1)} out of 5, ${reviewCount} reviews`
    : locale === "ar"
      ? "لا توجد تقييمات بعد"
      : "No reviews yet";

  const handleNavigate = useCallback(
    (event) => {
      requestReviewsHighlight();
      onReviewsClick?.(event);
    },
    [onReviewsClick]
  );

  const content = hasReviews ? (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 transition-transform duration-300 ease-out group-hover:scale-[1.03]">
        <StarRating value={displayRating} size={size} gold label={ariaLabel} />
        <span className="font-display text-sm font-medium tracking-tight text-brand-text">
          {displayRating.toFixed(1)}
        </span>
      </div>
      <span className="text-[11px] tracking-wide text-brand-muted/75">
        ({reviewCount} {locale === "ar" ? (reviewCount === 1 ? "تقييم" : "تقييمات") : reviewCount === 1 ? "Review" : "Reviews"})
      </span>
    </div>
  ) : (
    <span className="text-xs tracking-wide text-brand-muted">
      {locale === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}
    </span>
  );

  const wrapperClass = cn(
    "group block rounded-md transition-opacity duration-200 hover:opacity-90",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-1",
    className
  );

  if (linkToReviews) {
    return (
      <Link
        to={linkToReviews}
        className={wrapperClass}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          handleNavigate(e);
        }}
      >
        {content}
      </Link>
    );
  }

  if (onReviewsClick) {
    return (
      <button type="button" className={cn(wrapperClass, "text-start")} aria-label={ariaLabel} onClick={handleNavigate}>
        {content}
      </button>
    );
  }

  return (
    <div className={className} aria-label={ariaLabel}>
      {content}
    </div>
  );
});
