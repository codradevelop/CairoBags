import { memo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { Button } from "../ui/Button.jsx";
import { cn } from "../../utils/cn.js";

const SORT_OPTIONS = [
  { value: "newest", en: "Newest", ar: "الأحدث" },
  { value: "oldest", en: "Oldest", ar: "الأقدم" },
  { value: "highest", en: "Highest Rating", ar: "أعلى تقييم" },
  { value: "lowest", en: "Lowest Rating", ar: "أقل تقييم" },
  { value: "helpful", en: "Most Helpful", ar: "الأكثر فائدة" },
];

export const ReviewFilters = memo(function ReviewFilters({
  sort,
  rating,
  verifiedOnly,
  onSortChange,
  onRatingChange,
  onVerifiedOnlyChange,
  onClear,
  className,
}) {
  const { locale } = useLocale();
  const hasActiveFilters = Boolean(rating || verifiedOnly || sort !== "newest");

  return (
    <div className={cn("space-y-4 rounded-xl border border-brand-border/60 bg-brand-surface/50 p-4 md:space-y-5 md:p-5", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-brand-text" htmlFor="review-sort">
          {locale === "ar" ? "ترتيب" : "Sort"}
        </label>
        <select
          id="review-sort"
          value={sort}
          onChange={(e) => onSortChange?.(e.target.value)}
          className="rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {locale === "ar" ? option.ar : option.en}
            </option>
          ))}
        </select>

        <label className="ms-2 flex items-center gap-2 text-sm text-brand-text">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => onVerifiedOnlyChange?.(e.target.checked)}
            className="rounded border-brand-border text-brand-accent focus:ring-brand-accent"
          />
          {locale === "ar" ? "مشتريات موثّقة فقط" : "Verified Purchases"}
        </label>

        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            {locale === "ar" ? "مسح الفلاتر" : "Clear Filters"}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={locale === "ar" ? "تصفية حسب النجوم" : "Filter by rating"}>
        <span className="text-sm font-medium text-brand-text">
          {locale === "ar" ? "التقييم:" : "Rating:"}
        </span>
        {[5, 4, 3, 2, 1].map((stars) => (
          <button
            key={stars}
            type="button"
            onClick={() => onRatingChange?.(rating === stars ? null : stars)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent",
              rating === stars
                ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                : "border-brand-border text-brand-muted hover:border-brand-accent/50"
            )}
            aria-pressed={rating === stars}
          >
            {stars} ★
          </button>
        ))}
      </div>
    </div>
  );
});
