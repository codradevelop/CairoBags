import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as productService from "../../services/productService.js";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { ProductCard } from "./ProductCard.jsx";
import { ProductGridSkeleton } from "./ProductSkeleton.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { Button } from "../ui/Button.jsx";
import { cn } from "../../utils/cn.js";

export function FeaturedProducts({ className, title, subtitle }) {
  const { locale } = useLocale();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productService
      .getFeaturedProducts()
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
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

  const heading = title ?? (locale === "ar" ? "منتجات مميزة" : "Featured Products");
  const sub =
    subtitle ??
    (locale === "ar" ? "قطع مختارة بعناية" : "Handpicked pieces for the discerning");

  return (
    <ProductSection
      className={className}
      heading={heading}
      subtitle={sub}
      products={products}
      loading={loading}
      error={error}
      emptyTitle={locale === "ar" ? "لا توجد منتجات مميزة" : "No featured products"}
      locale={locale}
    />
  );
}

export function NewArrivals({ className, title, subtitle }) {
  const { locale } = useLocale();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productService
      .getNewArrivals()
      .then((data) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
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

  const heading = title ?? (locale === "ar" ? "وصل حديثاً" : "New Arrivals");
  const sub =
    subtitle ?? (locale === "ar" ? "أحدث إضافات المجموعة" : "The latest additions to our collection");

  return (
    <ProductSection
      className={className}
      heading={heading}
      subtitle={sub}
      products={products}
      loading={loading}
      error={error}
      emptyTitle={locale === "ar" ? "لا توجد منتجات جديدة" : "No new arrivals"}
      locale={locale}
    />
  );
}

function ProductSection({
  className,
  heading,
  subtitle,
  products,
  loading,
  error,
  emptyTitle,
  locale,
}) {
  return (
    <section className={cn(className)}>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end md:mb-8">
        <div>
          <h2 className="font-display text-2xl font-medium text-brand-text md:text-3xl">{heading}</h2>
          <p className="mt-2 text-sm text-brand-muted">{subtitle}</p>
        </div>
        <Link to="/shop">
          <Button variant="outline" size="sm">
            {locale === "ar" ? "عرض الكل" : "View All"}
          </Button>
        </Link>
      </div>

      {loading ? <ProductGridSkeleton count={4} /> : null}
      {!loading && error ? (
        <EmptyState title={emptyTitle} description={error.message} />
      ) : null}
      {!loading && !error && products.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={locale === "ar" ? "عد قريباً" : "Check back soon"}
        />
      ) : null}
      {!loading && !error && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id ?? product.Id} product={product} variant="landing" />
          ))}
        </div>
      ) : null}
    </section>
  );
}
