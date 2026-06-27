import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import * as productService from "../../services/productService.js";
import {
  ProductCard,
  ProductGridSkeleton,
  ProductSearch,
  EmptyState,
} from "../../components/store/index.js";
import { buildProductQueryParams } from "../../utils/shopFilters.js";
import { Button } from "../../components/ui/index.js";

export function SearchResultsPage() {
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pageTitle = query
    ? locale === "ar"
      ? `نتائج: ${query}`
      : `Results: ${query}`
    : locale === "ar"
      ? "بحث"
      : "Search";
  usePageTitle(pageTitle);

  const loadResults = useCallback(async () => {
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await productService.searchProducts(
        buildProductQueryParams({ searchTerm: query })
      );
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return (
    <StoreLayout>
      <header className="cb-search-hero cb-store-page-header">
        <h1 className="cb-page-title">{locale === "ar" ? "نتائج البحث" : "Search Results"}</h1>
        {query ? (
          <p className="cb-search-meta">
            {locale === "ar" ? (
              <>
                <strong>{products.length}</strong> نتيجة لـ &ldquo;{query}&rdquo;
              </>
            ) : (
              <>
                <strong>{products.length}</strong> result{products.length === 1 ? "" : "s"} for &ldquo;
                {query}&rdquo;
              </>
            )}
          </p>
        ) : null}
      </header>

      <ProductSearch
        className="mb-8 max-w-xl"
        defaultValue={query}
        onSubmit={(q) => setSearchParams({ q })}
      />

      {!query ? (
        <EmptyState
          variant="search"
          title={locale === "ar" ? "ابدأ البحث" : "Start searching"}
          description={
            locale === "ar"
              ? "اكتب كلمة للبحث عن الحقائب"
              : "Enter a term to find bags"
          }
        />
      ) : null}

      {query && loading ? <ProductGridSkeleton /> : null}
      {query && !loading && error ? (
        <EmptyState
          variant="error"
          title={locale === "ar" ? "تعذر البحث" : "Search failed"}
          description={error.message}
          action={
            <Button variant="accent" onClick={loadResults}>
              {locale === "ar" ? "إعادة المحاولة" : "Try again"}
            </Button>
          }
        />
      ) : null}
      {query && !loading && !error && products.length === 0 ? (
        <EmptyState
          variant="search"
          title={locale === "ar" ? "لا توجد نتائج" : "No results found"}
          description={
            locale === "ar"
              ? "جرّب كلمات بحث مختلفة"
              : "Try different search terms"
          }
          action={
            <Link to="/shop">
              <Button variant="outline">{locale === "ar" ? "تصفح المتجر" : "Browse Shop"}</Button>
            </Link>
          }
        />
      ) : null}
      {query && !loading && !error && products.length > 0 ? (
        <div className="cb-product-grid cb-animate-grid">
          {products.map((product) => (
            <ProductCard key={product.id ?? product.Id} product={product} />
          ))}
        </div>
      ) : null}
    </StoreLayout>
  );
}
