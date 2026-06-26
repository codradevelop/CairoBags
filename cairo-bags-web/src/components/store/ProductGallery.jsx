import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { EASE_LUXURY } from "../ui/motion.jsx";
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
  const prefersReduced = useReducedMotion();
  const frameRef = useRef(null);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [zooming, setZooming] = useState(false);

  const sorted = [...images].sort((a, b) => {
    const aPrimary = a?.isPrimary ?? a?.IsPrimary ? 0 : 1;
    const bPrimary = b?.isPrimary ?? b?.IsPrimary ? 0 : 1;
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    return (a?.sortOrder ?? a?.SortOrder ?? 0) - (b?.sortOrder ?? b?.SortOrder ?? 0);
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex] ?? sorted[0];
  const activeUrl = active ? getProductImageAssetUrl(active) : null;

  const onMove = useCallback(
    (event) => {
      if (prefersReduced || !frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setZoomOrigin({ x, y });
    },
    [prefersReduced]
  );

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
        <div
          ref={frameRef}
          className="cb-luxury-card relative cb-product-aspect overflow-hidden bg-brand-secondary"
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onMouseMove={onMove}
        >
          <AnimatePresence mode="wait">
            {activeUrl ? (
              <motion.img
                key={activeUrl}
                src={activeUrl}
                alt={getImageAlt(active, locale) || productName}
                loading="lazy"
                decoding="async"
                initial={{ opacity: 0, scale: 1.03 }}
                animate={{
                  opacity: 1,
                  scale: zooming && !prefersReduced ? 1.08 : 1,
                }}
                exit={{ opacity: 0, scale: 1.01 }}
                transition={{ duration: 0.5, ease: EASE_LUXURY }}
                className="h-full w-full object-cover object-center will-change-transform"
                style={{
                  transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                }}
              />
            ) : null}
          </AnimatePresence>
        </div>

        {sorted.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 cb-scrollbar-thin">
            {sorted.map((image, index) => {
              const url = getProductImageAssetUrl(image);
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
                  <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </motion.button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
