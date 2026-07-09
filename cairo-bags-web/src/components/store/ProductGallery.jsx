import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { EASE_LUXURY } from "../ui/motion.jsx";
import { cn } from "../../utils/cn.js";
import { getProductImageFullUrl, getProductImageThumbUrl } from "../../utils/productHelpers.js";
import { ProductPresentation } from "./ProductPresentation.jsx";

function getImageAlt(image, locale) {
  if (locale === "ar") {
    return image?.altTextAr ?? image?.AltTextAr ?? image?.altTextEn ?? image?.AltTextEn ?? "";
  }
  return image?.altTextEn ?? image?.AltTextEn ?? image?.altTextAr ?? image?.AltTextAr ?? "";
}

export function ProductGallery({ images = [], productName = "", className }) {
  const { locale } = useLocale();
  const prefersReduced = useReducedMotion();

  const sorted = [...images].sort((a, b) => {
    const aPrimary = a?.isPrimary ?? a?.IsPrimary ? 0 : 1;
    const bPrimary = b?.isPrimary ?? b?.IsPrimary ? 0 : 1;
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    return (a?.sortOrder ?? a?.SortOrder ?? 0) - (b?.sortOrder ?? b?.SortOrder ?? 0);
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex] ?? sorted[0];
  const activeUrl = active ? getProductImageFullUrl(active) : null;

  if (!sorted.length) {
    return (
      <div
        className={cn(
          "flex cb-product-aspect items-center justify-center rounded-xl border border-brand-border bg-brand-secondary",
          className
        )}
      >
        <span className="font-display text-4xl text-brand-muted/50">CB</span>
      </div>
    );
  }

  return (
    <div className={cn("lg:sticky lg:top-28 lg:self-start", className)}>
      <div className="space-y-3">
        <div className="cb-luxury-card relative cb-product-aspect overflow-hidden rounded-xl">
          <AnimatePresence mode="wait">
            {activeUrl ? (
              <motion.div
                key={activeUrl}
                className="absolute inset-0"
                initial={prefersReduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={prefersReduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.45, ease: EASE_LUXURY }}
              >
                <ProductPresentation
                  src={activeUrl}
                  alt={getImageAlt(active, locale) || productName}
                  size="gallery"
                  interactive
                  loading="eager"
                  priority="high"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {sorted.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 cb-scrollbar-thin">
            {sorted.map((image, index) => {
              const url = getProductImageThumbUrl(image);
              if (!url) return null;
              const selected = index === activeIndex;
              return (
                <motion.button
                  key={image?.id ?? image?.Id ?? index}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: EASE_LUXURY }}
                  className={cn(
                    "h-14 w-11 shrink-0 overflow-hidden rounded-lg border transition-colors duration-300",
                    selected
                      ? "border-brand-accent ring-1 ring-brand-accent/30"
                      : "border-brand-border opacity-70 hover:border-brand-muted hover:opacity-100"
                  )}
                  aria-label={`${productName} ${index + 1}`}
                  aria-pressed={selected}
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-contain p-1"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                  />
                </motion.button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
