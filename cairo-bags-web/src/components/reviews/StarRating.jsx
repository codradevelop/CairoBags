import { memo } from "react";
import { cn } from "../../utils/cn.js";

function StarGlyph({ filled = false, partial = 0, className, gold = false }) {
  return (
    <span className={cn("relative inline-block shrink-0", className)} aria-hidden="true">
      <svg
        viewBox="0 0 24 24"
        className={cn("h-full w-full", gold ? "text-brand-accent/25" : "text-brand-border")}
        fill="currentColor"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {(filled || partial > 0) && (
        <span
          className="absolute inset-0 overflow-hidden text-brand-accent"
          style={{ width: filled ? "100%" : `${Math.min(100, Math.max(0, partial * 100))}%` }}
        >
          <svg viewBox="0 0 24 24" className="h-full w-full" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </span>
      )}
    </span>
  );
}

export const StarRating = memo(function StarRating({
  value = 0,
  size = "sm",
  className,
  label,
  gold = false,
}) {
  const sizes = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-7 w-7",
    xl: "h-9 w-9",
  };

  const stars = Array.from({ length: 5 }, (_, index) => {
    const starValue = value - index;
    if (starValue >= 1) return { filled: true, partial: 0 };
    if (starValue > 0) return { filled: false, partial: starValue };
    return { filled: false, partial: 0 };
  });

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={label}
    >
      {stars.map((star, index) => (
        <StarGlyph
          key={index}
          filled={star.filled}
          partial={star.partial}
          gold={gold}
          className={sizes[size] ?? sizes.sm}
        />
      ))}
    </div>
  );
});

export const InteractiveStarRating = memo(function InteractiveStarRating({
  value = 0,
  onChange,
  size = "lg",
  className,
  label,
}) {
  const sizes = {
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role="radiogroup"
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          onClick={() => onChange?.(star)}
          className={cn(
            "rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent",
            sizes[size] ?? sizes.lg
          )}
        >
          <StarGlyph filled={value >= star} className="h-full w-full" />
        </button>
      ))}
    </div>
  );
});
