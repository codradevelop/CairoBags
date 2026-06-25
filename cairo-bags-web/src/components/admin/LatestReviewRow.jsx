import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { StarRating } from "../reviews/StarRating.jsx";
import { VerifiedPurchaseBadge } from "../reviews/VerifiedPurchaseBadge.jsx";
import { formatReviewDate } from "../../utils/reviewHelpers.js";
import { requestReviewHighlight } from "../../utils/reviewScrollUtils.js";
import { cn } from "../../utils/cn.js";

export const LatestReviewRow = memo(function LatestReviewRow({ review, className }) {
  const { locale } = useLocale();
  const navigate = useNavigate();

  const handleClick = () => {
    requestReviewHighlight(review.id);
    navigate(`/products/${review.productId}#reviews`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full flex-col gap-2 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-start transition-all duration-200",
        "hover:border-brand-accent/40 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent",
        "sm:flex-row sm:items-center sm:justify-between sm:gap-4",
        className
      )}
      aria-label={`${review.customerName} reviewed ${review.productName}`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <StarRating value={review.rating} size="xs" gold />
          {review.title ? (
            <span className="truncate font-medium text-brand-text">{review.title}</span>
          ) : null}
        </div>
        <p className="truncate text-sm text-brand-muted">
          <span className="text-brand-text">{review.customerName}</span>
          {" · "}
          {review.productName}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {review.isVerifiedPurchase ? <VerifiedPurchaseBadge /> : null}
        <time className="text-xs text-brand-muted" dateTime={review.createdAt}>
          {formatReviewDate(review.createdAt, locale)}
        </time>
      </div>
    </button>
  );
});
