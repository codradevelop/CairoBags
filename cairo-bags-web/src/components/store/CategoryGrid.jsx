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
      <div className="mb-6 text-center md:mb-8">
        <h2 className="font-display text-2xl font-medium text-brand-text md:text-3xl">{heading}</h2>
        <p className="mt-2 text-sm text-brand-muted">{sub}</p>
      </div>

      {loading ? <CategoryGridSkeleton /> : null}
      {!loading && error ? (
        <EmptyState
          title={locale === "ar" ? "تعذر تحميل التصنيفات" : "Unable to load categories"}
          description={error.message}
        />
      ) : null}
      {!loading && !error && categories.length === 0 ? (
        <EmptyState
          title={locale === "ar" ? "لا توجد تصنيفات" : "No categories yet"}
          description={
            locale === "ar" ? "ستتوفر التصنيفات قريباً" : "Categories will appear here soon"
          }
        />
      ) : null}

      {!loading && !error && categories.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {categories.map((category) => {
            const id = getCategoryId(category);
            const name = getCategoryName(category, locale);
            const imageUrl = getCategoryImageUrl(category);
            return (
              <Link
                key={id}
                to={buildCategoryPath(category)}
                className="group block text-center"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-lg border border-brand-border bg-brand-secondary">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-display text-2xl text-brand-muted">
                      CB
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-brand-text transition-colors group-hover:text-brand-accent md:text-base">
                  {name}
                </p>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
