import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as categoryService from "../../services/categoryService.js";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import {
  buildCategoryPath,
  getCategoryId,
  getCategoryImageUrl,
  getCategoryName,
} from "../../utils/productHelpers.js";
import { CategoryGridSkeleton } from "./ProductSkeleton.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { ScrollReveal, StaggerReveal, StaggerItem } from "../ui/motion.jsx";
import { AnimatedCounter } from "../ui/animation.jsx";
import { cn } from "../../utils/cn.js";

export function CategoryGrid({ className, title, subtitle }) {
  const { locale } = useLocale();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    categoryService
      .getCategories()
      .then((data) => {
        if (!cancelled) setCategories(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const heading = title ?? (locale === "ar" ? "تسوق حسب التصنيف" : "Shop by Category");
  const sub =
    subtitle ??
    (locale === "ar" ? "استكشف مجموعاتنا المنسقة" : "Explore our curated collections");

  return (
    <section className={cn(className)}>
      <ScrollReveal className="mb-8 text-center md:mb-10">
        <p className="cb-section-label">{locale === "ar" ? "المجموعات" : "Collections"}</p>
        <h2 className="cb-section-heading mt-2">{heading}</h2>
        <p className="cb-section-subheading mx-auto mt-3">
          {sub}
          {!loading && !error && categories.length > 0 ? (
            <span className="mt-2 block text-[11px] tracking-wide text-brand-accent/80 uppercase">
              <AnimatedCounter value={categories.length} /> {locale === "ar" ? "تصنيف" : "Categories"}
            </span>
          ) : null}
        </p>
      </ScrollReveal>

      {loading ? <CategoryGridSkeleton /> : null}
      {!loading && error ? (
        <EmptyState
          variant="error"
          title={locale === "ar" ? "تعذر تحميل التصنيفات" : "Unable to load categories"}
          description={error.message}
        />
      ) : null}
      {!loading && !error && categories.length === 0 ? (
        <EmptyState
          variant="category"
          title={locale === "ar" ? "لا توجد تصنيفات" : "No categories yet"}
          description={
            locale === "ar" ? "ستتوفر التصنيفات قريباً" : "Categories will appear here soon"
          }
        />
      ) : null}

      {!loading && !error && categories.length > 0 ? (
        <StaggerReveal className="cb-category-grid">
          {categories.map((category) => {
            const id = getCategoryId(category);
            const name = getCategoryName(category, locale);
            const imageUrl = getCategoryImageUrl(category);
            return (
              <StaggerItem key={id}>
                <Link to={buildCategoryPath(category)} className="group block">
                  <div className="cb-luxury-card relative aspect-[3/4] overflow-hidden bg-brand-secondary">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-2xl text-brand-muted/50">
                        CB
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/70 via-brand-primary/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="font-display text-base font-medium text-brand-secondary md:text-lg">
                        {name}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] tracking-wide text-brand-accent uppercase opacity-0 transition-all duration-300 group-hover:opacity-100">
                        {locale === "ar" ? "استكشف" : "Explore"}
                        <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerReveal>
      ) : null}
    </section>
  );
}
