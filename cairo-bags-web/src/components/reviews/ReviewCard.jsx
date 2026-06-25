import { memo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { formatReviewDate } from "../../utils/reviewHelpers.js";
import { StarRating } from "./StarRating.jsx";
import { VerifiedPurchaseBadge } from "./VerifiedPurchaseBadge.jsx";
import { Button } from "../ui/Button.jsx";
import { cn } from "../../utils/cn.js";

function UserAvatar({ name }) {
  const initial = (name?.trim()?.[0] ?? "C").toUpperCase();
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-secondary font-display text-sm font-medium text-brand-accent"
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export const ReviewCard = memo(function ReviewCard({
  review,
  currentUserId,
  isAdmin,
  canVoteHelpful,
  canManageOwn,
  onDelete,
  onToggleHelpful,
  onAdminDelete,
  onAdminToggleVisibility,
  helpfulLoading = false,
  isEntering = false,
  isPinned = false,
  isHighlighted = false,
}) {
  const { locale } = useLocale();
  const isOwner = currentUserId && review.userId === currentUserId;
  const showDeleteAction = isOwner && canManageOwn;

  return (
    <article
      className={cn(
        "rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-card transition-all duration-300 md:p-6",
        "hover:shadow-card-hover",
        isEntering && "review-card-enter",
        isPinned && "ring-1 ring-brand-accent/20",
        isHighlighted && "review-summary-glow"
      )}
      aria-labelledby={`review-title-${review.id}`}
    >
      <div className="flex gap-4">
        <UserAvatar name={review.reviewerName} />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-brand-text">{review.reviewerName}</h3>
                {review.isVerifiedPurchase ? <VerifiedPurchaseBadge /> : null}
              </div>
              <StarRating
                value={review.rating}
                size="sm"
                gold
                className="mt-1.5"
                label={`${review.rating} out of 5`}
              />
            </div>
            <time className="shrink-0 text-sm text-brand-muted" dateTime={review.createdAt}>
              {formatReviewDate(review.createdAt, locale)}
            </time>
          </div>

          {review.title ? (
            <h4 id={`review-title-${review.id}`} className="font-display text-lg font-medium text-brand-text">
              {review.title}
            </h4>
          ) : null}

          {review.comment ? (
            <p className="text-sm leading-relaxed text-brand-muted">{review.comment}</p>
          ) : null}

          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-brand-border/60 pt-4">
            {canVoteHelpful ? (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={helpfulLoading}
                  onClick={() => onToggleHelpful?.(review)}
                  aria-pressed={review.isHelpfulByCurrentUser}
                  aria-label={
                    locale === "ar"
                      ? `مفيد، ${review.helpfulCount} شخص وجد هذا مفيداً`
                      : `Helpful, ${review.helpfulCount} people found this helpful`
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
                    "hover:-translate-y-0.5 hover:bg-brand-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent",
                    review.isHelpfulByCurrentUser
                      ? "bg-brand-accent/15 text-brand-accent"
                      : "text-brand-text"
                  )}
                >
                  <span aria-hidden="true">👍</span>
                  {locale === "ar" ? "مفيد" : "Helpful"}
                </button>
                {review.helpfulCount > 0 ? (
                  <p className="ps-1 text-xs text-brand-muted">
                    {locale === "ar"
                      ? `${review.helpfulCount} شخص وجد هذا مفيداً`
                      : `${review.helpfulCount} ${review.helpfulCount === 1 ? "person" : "people"} found this helpful`}
                  </p>
                ) : null}
              </div>
            ) : (
              <div />
            )}

            <div className="flex flex-wrap items-center gap-2">
            {showDeleteAction ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onDelete?.(review)}>
                {locale === "ar" ? "حذف" : "Delete"}
              </Button>
            ) : null}

            {isAdmin ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAdminToggleVisibility?.(review)}
                >
                  {review.isVisible
                    ? locale === "ar"
                      ? "إخفاء"
                      : "Hide"
                    : locale === "ar"
                      ? "إظهار"
                      : "Unhide"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => onAdminDelete?.(review)}
                >
                  {locale === "ar" ? "حذف (مشرف)" : "Delete"}
                </Button>
              </>
            ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});
