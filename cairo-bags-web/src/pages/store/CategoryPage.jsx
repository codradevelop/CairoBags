import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import * as productService from "../../services/productService.js";
import * as categoryService from "../../services/categoryService.js";
import {
  ProductCard,
  ProductGridSkeleton,
  EmptyState,
} from "../../components/store/index.js";
import { buildProductQueryParams } from "../../utils/shopFilters.js";
import {
  buildCategoryPath,
  getCategoryDescription,
  getCategoryId,
  getCategoryImageUrl,
  getCategoryName,
  getCategorySlug,
} from "../../utils/productHelpers.js";
import { normalizeSlug } from "../../utils/slugHelper.js";
import { Button } from "../../components/ui/index.js";

export function CategoryPage() {
  const { slug: slugParam } = useParams();
  const identifier = decodeURIComponent(slugParam ?? "");
  const navigate = useNavigate();
  const { locale } = useLocale();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categoryName = category ? getCategoryName(category, locale) : "";
  usePageTitle(categoryName || (locale === "ar" ? "التصنيف" : "Category"));

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cat = await categoryService.getCategoryByIdentifier(identifier);
      const categoryId = getCategoryId(cat);
      const prods = await productService.getProducts(
        buildProductQueryParams({ categoryId: String(categoryId) })
      );
      setCategory(cat);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      setError(err);
      setCategory(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!category) return;
    const canonicalSlug = getCategorySlug(category, locale);
    if (!canonicalSlug || normalizeSlug(canonicalSlug) === normalizeSlug(identifier)) return;
    navigate(buildCategoryPath(category, locale), { replace: true });
  }, [category, locale, identifier, navigate]);

  const description = category ? getCategoryDescription(category, locale) : "";
  const imageUrl = category ? getCategoryImageUrl(category) : null;

  return (
    <StoreLayout>
      <nav className="cb-store-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">{locale === "ar" ? "الرئيسية" : "Home"}</Link>
        <span className="cb-store-breadcrumbs-sep">/</span>
        <Link to="/shop">{locale === "ar" ? "تسوق" : "Shop"}</Link>
        {categoryName ? (
          <>
            <span className="cb-store-breadcrumbs-sep">/</span>
            <span className="text-brand-text">{categoryName}</span>
          </>
        ) : null}
      </nav>

      <header className="cb-category-hero cb-store-page-header">
        <div className="cb-category-hero-inner">
          <div className="max-w-2xl">
            <p className="cb-section-label">{locale === "ar" ? "المجموعة" : "Collection"}</p>
            <h1 className="cb-page-title mt-2">
              {categoryName || (locale === "ar" ? "التصنيف" : "Category")}
            </h1>
            {description ? <p className="cb-page-lead">{description}</p> : null}
            {!loading && products.length > 0 ? (
              <span className="cb-category-hero-count">
                {products.length}{" "}
                {locale === "ar"
                  ? products.length === 1
                    ? "منتج"
                    : "منتجات"
                  : products.length === 1
                    ? "Product"
                    : "Products"}
              </span>
            ) : null}
          </div>
          {imageUrl ? (
            <div className="cb-category-hero-media">
              <img src={imageUrl} alt={categoryName} loading="lazy" />
            </div>
          ) : null}
        </div>
      </header>

      {loading ? <ProductGridSkeleton /> : null}
      {!loading && error ? (
        <EmptyState
          variant="error"
          title={locale === "ar" ? "تعذر تحميل التصنيف" : "Unable to load category"}
          description={error.message}
          action={
            <Button variant="accent" onClick={loadData}>
              {locale === "ar" ? "إعادة المحاولة" : "Try again"}
            </Button>
          }
        />
      ) : null}
      {!loading && !error && products.length === 0 ? (
        <EmptyState
          variant="category"
          title={locale === "ar" ? "لا توجد منتجات" : "No products in this category"}
          description={locale === "ar" ? "تصفح مجموعات أخرى" : "Browse other collections"}
          action={
            <Link to="/shop">
              <Button variant="outline">{locale === "ar" ? "تسوق الكل" : "Shop All"}</Button>
            </Link>
          }
        />
      ) : null}
      {!loading && !error && products.length > 0 ? (
        <div className="cb-product-grid cb-animate-grid">
          {products.map((product) => (
            <ProductCard key={product.id ?? product.Id} product={product} />
          ))}
        </div>
      ) : null}
    </StoreLayout>
  );
}
