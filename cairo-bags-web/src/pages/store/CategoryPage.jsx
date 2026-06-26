import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  getCategoryDescription,
  getCategoryImageUrl,
  getCategoryName,
} from "../../utils/productHelpers.js";
import { Button } from "../../components/ui/index.js";

export function CategoryPage() {
  const { id } = useParams();
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
      const [cat, prods] = await Promise.all([
        categoryService.getCategoryById(id),
        productService.getProducts(buildProductQueryParams({ categoryId: id })),
      ]);
      setCategory(cat);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      setError(err);
      setCategory(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const description = category ? getCategoryDescription(category, locale) : "";
  const imageUrl = category ? getCategoryImageUrl(category) : null;

  return (
    <StoreLayout>
      <nav className="mb-6 text-sm text-brand-muted">
        <Link to="/" className="hover:text-brand-accent">
          {locale === "ar" ? "الرئيسية" : "Home"}
        </Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-brand-accent">
          {locale === "ar" ? "تسوق" : "Shop"}
        </Link>
        {categoryName ? (
          <>
            <span className="mx-2">/</span>
            <span className="text-brand-text">{categoryName}</span>
          </>
        ) : null}
      </nav>

      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="cb-page-title">
            {categoryName || (locale === "ar" ? "التصنيف" : "Category")}
          </h1>
          {description ? <p className="cb-page-lead">{description}</p> : null}
        </div>
        {imageUrl ? (
          <div className="h-32 w-full overflow-hidden rounded-lg border border-brand-border md:h-36 md:w-56">
            <img src={imageUrl} alt={categoryName} className="h-full w-full object-cover" />
          </div>
        ) : null}
      </div>

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
          description={
            locale === "ar" ? "تصفح مجموعات أخرى" : "Browse other collections"
          }
          action={
            <Link to="/shop">
              <Button variant="outline">{locale === "ar" ? "تسوق الكل" : "Shop All"}</Button>
            </Link>
          }
        />
      ) : null}
      {!loading && !error && products.length > 0 ? (
        <div className="cb-product-grid">
          {products.map((product) => (
            <ProductCard key={product.id ?? product.Id} product={product} />
          ))}
        </div>
      ) : null}
    </StoreLayout>
  );
}
