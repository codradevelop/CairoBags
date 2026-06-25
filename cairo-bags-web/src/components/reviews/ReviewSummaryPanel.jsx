import { memo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { getRatingDistribution } from "../../utils/reviewHelpers.js";
import { StarRating } from "./StarRating.jsx";
import { cn } from "../../utils/cn.js";

export const ReviewSummaryPanel = memo(function ReviewSummaryPanel({
  summary,
  className,
  highlighted = false,
}) {
  const { locale } = useLocale();
  const distribution = getRatingDistribution(summary);
  const hasReviews = (summary?.reviewCount ?? 0) > 0;

  if (!hasReviews) return null;

  return (
    <div
      id="review-summary"
      className={cn(
        "rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-card transition-shadow duration-500 md:p-8",
        highlighted && "review-summary-glow",
        className
      )}
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,220px)_1fr] md:items-center">
        <div className="text-center md:text-start">
          <p className="font-display text-5xl font-medium tracking-tight text-brand-text md:text-6xl">
            {summary.averageRating.toFixed(1)}
          </p>
          <StarRating
            value={summary.averageRating}
            size="lg"
            gold
            className="mt-3 justify-center md:justify-start"
            label={`${summary.averageRating.toFixed(1)} out of 5`}
          />
          <p className="mt-3 text-sm text-brand-muted">
            {locale === "ar"
              ? `بناءً على ${summary.reviewCount} تقييم`
              : `Based on ${summary.reviewCount} review${summary.reviewCount === 1 ? "" : "s"}`}
          </p>
          {summary.verifiedReviewCount > 0 ? (
            <p className="mt-2 text-sm text-brand-muted">
              <span>{locale === "ar" ? "مشتريات موثّقة:" : "Verified Purchases:"}</span>{" "}
              <span className="font-medium text-brand-accent">{summary.verifiedReviewCount}</span>
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5" role="list" aria-label={locale === "ar" ? "توزيع التقييمات" : "Rating distribution"}>
          {distribution.map((row) => (
            <div key={row.stars} className="flex items-center gap-3" role="listitem">
              <span className="w-12 shrink-0 text-sm font-medium text-brand-text">
                {row.stars} {locale === "ar" ? "نجوم" : "star"}
              </span>
              <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-brand-secondary">
                <div
                  className="absolute inset-y-0 start-0 rounded-full bg-brand-accent transition-all duration-700 ease-out"
                  style={{ width: `${row.percent}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className="w-10 shrink-0 text-end text-sm text-brand-muted">{row.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
