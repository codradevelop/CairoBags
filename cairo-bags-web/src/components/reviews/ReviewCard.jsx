import { memo } from "react";
import { FaThumbsUp } from "react-icons/fa";
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
                  "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold tracking-wide transition-all duration-300",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  review.isHelpfulByCurrentUser
                    ? "border-brand-accent/45 bg-brand-accent/12 text-brand-accent shadow-[inset_0_0_0_1px_rgba(197,155,39,0.18)]"
                    : "border-brand-border/80 bg-brand-surface-2 text-brand-muted hover:-translate-y-0.5 hover:border-brand-accent/35 hover:bg-brand-accent/8 hover:text-brand-accent hover:shadow-[0_4px_14px_-8px_rgba(197,155,39,0.55)]"
                )}
              >
                <FaThumbsUp
                  size={18}
                  aria-hidden="true"
                  style={{
                    color: review.isHelpfulByCurrentUser ? "#c59b27" : "#6B7280",
                  }}
                />
                <span>{locale === "ar" ? "مفيد" : "Helpful"}</span>
                {review.helpfulCount > 0 ? (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                      review.isHelpfulByCurrentUser
                        ? "bg-brand-accent/18 text-brand-accent"
                        : "bg-brand-border/50 text-brand-muted"
                    )}
                  >
                    {review.helpfulCount}
                  </span>
                ) : null}
              </button>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => onAdminDelete?.(review)}
              >
                {locale === "ar" ? "حذف" : "Delete"}
              </Button>
            ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});
