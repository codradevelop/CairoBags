import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShopLayout } from "../../layouts/ShopLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import * as productService from "../../services/productService.js";
import * as categoryService from "../../services/categoryService.js";
import { ProductGridSkeleton, EmptyState } from "../../components/store/index.js";
import { ShopHero } from "../../components/store/shop/ShopHero.jsx";
import { ShopFiltersSidebar } from "../../components/store/shop/ShopFiltersSidebar.jsx";
import { ShopToolbar } from "../../components/store/shop/ShopToolbar.jsx";
import { ShopFeatureBar } from "../../components/store/shop/ShopFeatureBar.jsx";
import { ShopProductCard } from "../../components/store/shop/ShopProductCard.jsx";
import {
  buildProductQueryParams,
  filtersToSearchParams,
  parseShopFilters,
} from "../../utils/shopFilters.js";
import { getProductName, getProductPriceRange } from "../../utils/productHelpers.js";
import { Button } from "../../components/ui/index.js";
import { cn } from "../../utils/cn.js";

function sortProducts(products, sortKey, locale) {
  const items = [...products];
  const nameOf = (product) => getProductName(product, locale).toLowerCase();
  const priceOf = (product) => getProductPriceRange(product).low ?? 0;

  switch (sortKey) {
    case "price-asc":
      return items.sort((a, b) => priceOf(a) - priceOf(b));
    case "price-desc":
      return items.sort((a, b) => priceOf(b) - priceOf(a));
    case "name":
      return items.sort((a, b) => nameOf(a).localeCompare(nameOf(b), locale));
    default:
      return items;
  }
}

export function ShopPage() {
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = parseShopFilters(searchParams);
  const [draftFilters, setDraftFilters] = useState(urlFilters);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortValue, setSortValue] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");

  usePageTitle(locale === "ar" ? "تسوق" : "Shop");

  useEffect(() => {
    setDraftFilters(parseShopFilters(searchParams));
  }, [searchParams]);

  useEffect(() => {
    categoryService
      .getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProducts(buildProductQueryParams(urlFilters));
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [urlFilters.categoryId, urlFilters.minPrice, urlFilters.maxPrice, urlFilters.inStock, urlFilters.searchTerm]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const sortedProducts = useMemo(
    () => sortProducts(products, sortValue, locale),
    [products, sortValue, locale]
  );

  function applyFilters() {
    setSearchParams(filtersToSearchParams(draftFilters));
    setFiltersOpen(false);
  }

  function resetFilters() {
    const empty = { categoryId: "", minPrice: "", maxPrice: "", inStock: false, searchTerm: "" };
    setDraftFilters(empty);
    setSearchParams({});
    setFiltersOpen(false);
  }

  function handleCategoryPillSelect(categoryId) {
    const next = { ...urlFilters, categoryId };
    setDraftFilters(next);
    setSearchParams(filtersToSearchParams(next));
  }

  return (
    <ShopLayout>
      <ShopHero
        categories={categories}
        activeCategoryId={urlFilters.categoryId}
        onCategorySelect={handleCategoryPillSelect}
      />

      <div className="cb-shop-container">
        <button
          type="button"
          className="cb-shop-mobile-filters-btn"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          {locale === "ar" ? "تصفية المنتجات" : "Filter Products"}
        </button>

        <div className="cb-shop-layout">
          <div className={cn(filtersOpen ? "block" : "hidden lg:block")}>
            <ShopFiltersSidebar
              categories={categories}
              filters={draftFilters}
              onChange={setDraftFilters}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>

          <div className="cb-shop-content">
            <ShopToolbar
              productCount={sortedProducts.length}
              loading={loading}
              sortValue={sortValue}
              onSortChange={setSortValue}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {loading ? <ProductGridSkeleton count={8} className="cb-shop-product-grid" /> : null}

            {!loading && error ? (
              <EmptyState
                variant="error"
                title={locale === "ar" ? "تعذر تحميل المنتجات" : "Unable to load products"}
                description={error.message}
                action={
                  <Button variant="accent" onClick={loadProducts}>
                    {locale === "ar" ? "إعادة المحاولة" : "Try again"}
                  </Button>
                }
              />
            ) : null}

            {!loading && !error && products.length === 0 ? (
              <EmptyState
                variant="products"
                title={locale === "ar" ? "لا توجد منتجات" : "No products found"}
                description={
                  locale === "ar" ? "جرّب تعديل عوامل التصفية" : "Try adjusting your filters"
                }
                action={
                  <Button variant="outline" onClick={resetFilters}>
                    {locale === "ar" ? "مسح التصفية" : "Clear filters"}
                  </Button>
                }
              />
            ) : null}

            {!loading && !error && sortedProducts.length > 0 ? (
              <div
                className={viewMode === "grid" ? "cb-shop-product-grid" : "cb-shop-product-list"}
                data-count={viewMode === "grid" && sortedProducts.length <= 3 ? String(sortedProducts.length) : undefined}
                key={`${viewMode}-${sortedProducts.length}`}
              >
                {sortedProducts.map((product) => (
                  <ShopProductCard
                    key={product.id ?? product.Id}
                    product={product}
                    listView={viewMode === "list"}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <ShopFeatureBar />
      </div>
    </ShopLayout>
  );
}
