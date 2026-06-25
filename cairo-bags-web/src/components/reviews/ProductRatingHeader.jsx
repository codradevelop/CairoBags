import { memo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { StarRating } from "./StarRating.jsx";
import { cn } from "../../utils/cn.js";

export const ProductRatingHeader = memo(function ProductRatingHeader({
  stats,
  className,
  onScrollToReviews,
  loaded = true,
}) {
  const { locale } = useLocale();
  const hasReviews = (stats?.reviewCount ?? 0) > 0;

  return (
    <button
      type="button"
      onClick={onScrollToReviews}
      className={cn(
        "group mt-4 w-full rounded-2xl border border-transparent px-2 py-4 text-center transition-all duration-300",
        "hover:border-brand-accent/20 hover:bg-brand-accent/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
        loaded ? "animate-fade-in opacity-100" : "opacity-0",
        className
      )}
      aria-label={
        hasReviews
          ? locale === "ar"
            ? `التقييم ${stats.averageRating.toFixed(1)}، بناءً على ${stats.reviewCount} تقييم`
            : `Rating ${stats.averageRating.toFixed(1)}, based on ${stats.reviewCount} reviews`
          : locale === "ar"
            ? "لا توجد تقييمات بعد"
            : "No reviews yet"
      }
    >
      {hasReviews ? (
        <div className="flex flex-col items-center gap-2 md:gap-3">
          <StarRating
            value={stats.averageRating}
            size="xl"
            gold
            className="justify-center gap-1"
            label={`${stats.averageRating.toFixed(1)} out of 5`}
          />
          <p className="font-display text-4xl font-medium tracking-tight text-brand-text md:text-5xl">
            {stats.averageRating.toFixed(1)}
          </p>
          <p className="text-sm text-brand-muted transition-colors group-hover:text-brand-text md:text-base">
            {locale === "ar"
              ? `بناءً على ${stats.reviewCount} تقييم`
              : `Based on ${stats.reviewCount} Review${stats.reviewCount === 1 ? "" : "s"}`}
          </p>
          {stats.verifiedReviewCount > 0 ? (
            <p className="text-sm text-brand-muted">
              <span>{locale === "ar" ? "مشتريات موثّقة:" : "Verified Purchases:"}</span>{" "}
              <span className="font-medium text-brand-accent">{stats.verifiedReviewCount}</span>
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-brand-muted md:text-base">
          {locale === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}
        </p>
      )}
    </button>
  );
});
