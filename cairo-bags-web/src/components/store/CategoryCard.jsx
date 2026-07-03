import { Link } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useResolvedImageLoad } from "../../hooks/useResolvedImageLoad.js";
import {
  buildCategoryPath,
  getCategoryId,
  getCategoryImageUrl,
  getCategoryName,
} from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";

export function CategoryCard({ category, className }) {
  const { locale } = useLocale();
  const id = getCategoryId(category);
  const name = getCategoryName(category, locale);
  const imageUrl = getCategoryImageUrl(category);
  const { loaded: imageLoaded, imgRef, handleLoad, handleError } = useResolvedImageLoad(
    imageUrl,
    id
  );

  return (
    <Link
      to={`/shop?categoryId=${id}`}
      className={cn("group block h-full", className)}
    >
      <div className="cb-product-card-shell relative flex h-full flex-col overflow-hidden rounded-xl border border-brand-border/70 bg-brand-surface transition-all duration-300 group-hover:-translate-y-0.5">

        {/* ── Image area ── */}
        <div className="cb-product-aspect relative overflow-hidden bg-brand-secondary/60 shrink-0">
          {!imageLoaded && imageUrl ? (
            <div className="cb-shimmer absolute inset-0 z-[1] animate-shimmer" aria-hidden="true" />
          ) : null}

          {imageUrl ? (
            <img
              ref={imgRef}
              key={imageUrl}
              src={imageUrl}
              alt={name}
              className="cb-product-image transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
              decoding="async"
              onLoad={handleLoad}
              onError={handleError}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span
                className="font-display text-4xl opacity-40"
                style={{
                  background: "linear-gradient(135deg, #c9a962, #e8d5a3)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                CB
              </span>
            </div>
          )}

          {/* hover gradient */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>

        {/* ── Name below image ── */}
        <div className="cb-product-card-body flex flex-col gap-1">
          <h3 className="line-clamp-1 font-display text-[13px] font-semibold leading-snug text-brand-text transition-colors duration-300 group-hover:text-brand-accent">
            {name}
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium tracking-wide text-brand-accent uppercase">
            {locale === "ar" ? "استكشف" : "Explore"}
            <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
