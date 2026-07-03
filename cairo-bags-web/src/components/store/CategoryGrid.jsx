import { useCallback, useEffect, useState } from "react";
import * as categoryService from "../../services/categoryService.js";
import { useCatalogRefresh } from "../../hooks/useCatalogRefresh.js";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { CategoryCard } from "./CategoryCard.jsx";
import { getCategoryId } from "../../utils/productHelpers.js";
import { CategoryGridSkeleton } from "./ProductSkeleton.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { ScrollReveal } from "../ui/motion.jsx";
import { AnimatedCounter } from "../ui/animation.jsx";
import { ProductCarousel } from "./ProductCarousel.jsx";
import { cn } from "../../utils/cn.js";

export function CategoryGrid({ className, title, subtitle }) {
  const { locale } = useLocale();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCategories = useCallback((options = {}) => {
    const background = options?.background === true;
    if (!background) {
      setLoading(true);
      setError(null);
    }
    return categoryService
      .getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (!background) setError(err);
      })
      .finally(() => {
        if (!background) setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useCatalogRefresh(loadCategories, { entity: "category" });

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
        <ProductCarousel autoplay={4000} showDots={categories.length > 3} gap={16}>
          {categories.map((category) => {
            const id = getCategoryId(category);
            return <CategoryCard key={id} category={category} className="cb-carousel-category-item" />;
          })}
        </ProductCarousel>
      ) : null}
    </section>
  );
}
