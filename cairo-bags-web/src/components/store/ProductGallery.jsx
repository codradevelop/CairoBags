import { useState } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";
import { getProductImageAssetUrl } from "../../utils/productHelpers.js";

function getImageAlt(image, locale) {
  if (locale === "ar") {
    return image?.altTextAr ?? image?.AltTextAr ?? image?.altTextEn ?? image?.AltTextEn ?? "";
  }
  return image?.altTextEn ?? image?.AltTextEn ?? image?.altTextAr ?? image?.AltTextAr ?? "";
}

export function ProductGallery({ images = [], productName = "", className }) {
  const { locale } = useLocale();
  const sorted = [...images].sort((a, b) => {
    const aPrimary = a?.isPrimary ?? a?.IsPrimary ? 0 : 1;
    const bPrimary = b?.isPrimary ?? b?.IsPrimary ? 0 : 1;
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    return (a?.sortOrder ?? a?.SortOrder ?? 0) - (b?.sortOrder ?? b?.SortOrder ?? 0);
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex] ?? sorted[0];
  const activeUrl = active ? getProductImageAssetUrl(active) : null;

  if (!sorted.length) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center rounded-lg border border-brand-border bg-brand-secondary",
          className
        )}
      >
        <span className="font-display text-4xl text-brand-muted">CB</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="aspect-square overflow-hidden rounded-lg border border-brand-border bg-brand-secondary">
        {activeUrl ? (
          <img
            src={activeUrl}
            alt={getImageAlt(active, locale) || productName}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      {sorted.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 cb-scrollbar-thin">
          {sorted.map((image, index) => {
            const url = getProductImageAssetUrl(image);
            if (!url) return null;
            const selected = index === activeIndex;
            return (
              <button
                key={image?.id ?? image?.Id ?? index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                  selected ? "border-brand-accent" : "border-brand-border hover:border-brand-muted"
                )}
                aria-label={`${productName} ${index + 1}`}
                aria-pressed={selected}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
