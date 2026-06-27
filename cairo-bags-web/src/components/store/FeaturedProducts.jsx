import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as productService from "../../services/productService.js";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { ProductCard } from "./ProductCard.jsx";
import { ProductGridSkeleton } from "./ProductSkeleton.jsx";
import { EmptyState } from "./EmptyState.jsx";
import { Button } from "../ui/Button.jsx";
import { ScrollReveal, StaggerReveal, StaggerItem } from "../ui/motion.jsx";
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
      label={locale === "ar" ? "مختارات" : "Curated"}
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
      label={locale === "ar" ? "جديد" : "Just In"}
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
  label,
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
      <ScrollReveal className="cb-store-section-header cb-store-section-header--split mb-8 md:mb-10">
        <div>
          <p className="cb-section-label">{label}</p>
          <h2 className="cb-section-heading mt-2">{heading}</h2>
          <p className="cb-section-subheading mt-3">{subtitle}</p>
        </div>
        <Link to="/shop" className="shrink-0">
          <Button variant="outline" size="sm" className="rounded-full px-5">
            {locale === "ar" ? "عرض الكل" : "View All"}
          </Button>
        </Link>
      </ScrollReveal>

      {loading ? <ProductGridSkeleton count={10} compact /> : null}
      {!loading && error ? (
        <EmptyState variant="error" title={emptyTitle} description={error.message} />
      ) : null}
      {!loading && !error && products.length === 0 ? (
        <EmptyState
          variant="products"
          title={emptyTitle}
          description={locale === "ar" ? "عد قريباً" : "Check back soon"}
        />
      ) : null}
      {!loading && !error && products.length > 0 ? (
        <StaggerReveal className="cb-product-grid">
          {products.map((product) => (
            <StaggerItem key={product.id ?? product.Id}>
              <ProductCard product={product} variant="landing" />
            </StaggerItem>
          ))}
        </StaggerReveal>
      ) : null}
    </section>
  );
}
