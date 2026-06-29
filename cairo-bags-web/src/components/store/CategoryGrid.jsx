import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import * as categoryService from "../../services/categoryService.js";
import { STORE_EVENTS } from "../../constants/storeEvents.js";
import { useStoreSync } from "../../hooks/useStoreSync.js";
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
  const [syncHighlight, setSyncHighlight] = useState(false);

  const loadCategories = useCallback(() => {
    setLoading(true);
    return categoryService
      .getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useStoreSync(
    [STORE_EVENTS.CategoryCreated, STORE_EVENTS.CategoryUpdated, STORE_EVENTS.CategoryDeleted],
    () => {
      setSyncHighlight(true);
      loadCategories().finally(() => {
        window.setTimeout(() => setSyncHighlight(false), 900);
      });
    }
  );

  const heading = title ?? (locale === "ar" ? "تسوق حسب التصنيف" : "Shop by Category");
  const sub =
    subtitle ??
    (locale === "ar" ? "استكشف مجموعاتنا المنسقة" : "Explore our curated collections");

  return (
    <section className={cn(className, syncHighlight && "store-sync-highlight")}>
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
                <Link to={buildCategoryPath(category, locale)} className="group block">
                  <div className="cb-category-card">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="cb-category-card-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-display text-2xl text-brand-muted/50">
                        CB
                      </div>
                    )}
                    <div className="cb-category-card-overlay" aria-hidden="true" />
                    <div className="cb-category-card-label">
                      <p className="font-display text-sm font-medium text-brand-secondary md:text-base">
                        {name}
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] tracking-wide text-brand-accent uppercase opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
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
