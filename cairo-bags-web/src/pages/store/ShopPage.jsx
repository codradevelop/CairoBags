import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShopLayout } from "../../layouts/ShopLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useCatalogRefresh } from "../../hooks/useCatalogRefresh.js";
import { useShopFilterOptions } from "../../hooks/useShopFilterOptions.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import * as productService from "../../services/productService.js";
import * as categoryService from "../../services/categoryService.js";
import { ProductGridSkeleton, EmptyState } from "../../components/store/index.js";
import { ShopHero } from "../../components/store/shop/ShopHero.jsx";
import { ShopFiltersSidebar } from "../../components/store/shop/ShopFiltersSidebar.jsx";
import { ShopToolbar } from "../../components/store/shop/ShopToolbar.jsx";
import { ShopPagination } from "../../components/store/shop/ShopPagination.jsx";
import { ShopFeatureBar } from "../../components/store/shop/ShopFeatureBar.jsx";
import { ShopProductCard } from "../../components/store/shop/ShopProductCard.jsx";
import {
  buildProductQueryParams,
  filtersToSearchParams,
  parseShopFilters,
} from "../../utils/shopFilters.js";
import { isValidShopCategoryId } from "../../utils/collectionCategory.js";
import { getProductName, getProductPriceRange, getCategoryId, getCategoryName } from "../../utils/productHelpers.js";
import { Button } from "../../components/ui/index.js";
import { cn } from "../../utils/cn.js";

const SHOP_PAGE_SIZE = 12;

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
  const [page, setPage] = useState(1);
  const { colors: filterColors } = useShopFilterOptions();

  usePageTitle(locale === "ar" ? "تسوق" : "Shop");

  useEffect(() => {
    setDraftFilters(parseShopFilters(searchParams));
  }, [searchParams]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      /* keep existing categories on refresh failure */
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!urlFilters.categoryId || categories.length === 0) return;
    if (isValidShopCategoryId(categories, urlFilters.categoryId)) return;

    const next = { ...urlFilters, categoryId: "" };
    setDraftFilters(next);
    setSearchParams(filtersToSearchParams(next), { replace: true });
  }, [categories, urlFilters.categoryId, urlFilters.minPrice, urlFilters.maxPrice, urlFilters.inStock, urlFilters.searchTerm, urlFilters.color, setSearchParams]);

  const activeFilters = useMemo(() => {
    if (!urlFilters.categoryId || categories.length === 0) return urlFilters;
    if (isValidShopCategoryId(categories, urlFilters.categoryId)) return urlFilters;
    return { ...urlFilters, categoryId: "" };
  }, [urlFilters, categories]);

  const activeCategory = useMemo(() => {
    if (!activeFilters.categoryId || categories.length === 0) return null;
    return (
      categories.find(
        (category) => String(getCategoryId(category)) === String(activeFilters.categoryId)
      ) ?? null
    );
  }, [activeFilters.categoryId, categories]);

  const activeCategoryName = activeCategory ? getCategoryName(activeCategory, locale) : "";

  const loadProducts = useCallback(async (options = {}) => {
    const background = options?.background === true;
    if (!background) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await productService.getProducts(buildProductQueryParams(activeFilters));
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!background) {
        setError(err);
        setProducts([]);
      }
    } finally {
      if (!background) setLoading(false);
    }
  }, [activeFilters.categoryId, activeFilters.minPrice, activeFilters.maxPrice, activeFilters.inStock, activeFilters.searchTerm, activeFilters.color]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useCatalogRefresh(loadProducts, { entity: "product" });
  useCatalogRefresh(loadCategories, { entity: "category" });

  const sortedAndFiltered = useMemo(() => {
    return sortProducts(products, sortValue, locale);
  }, [products, sortValue, locale]);

  const totalCount = sortedAndFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / SHOP_PAGE_SIZE) || 1);

  useEffect(() => {
    setPage(1);
  }, [
    activeFilters.categoryId,
    activeFilters.minPrice,
    activeFilters.maxPrice,
    activeFilters.inStock,
    activeFilters.searchTerm,
    activeFilters.color,
    sortValue,
  ]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * SHOP_PAGE_SIZE;
    return sortedAndFiltered.slice(start, start + SHOP_PAGE_SIZE);
  }, [sortedAndFiltered, page]);

  const displayedCount = pageItems.length;

  function applyFilters() {
    setSearchParams(filtersToSearchParams(draftFilters));
    setFiltersOpen(false);
    setPage(1);
  }

  function resetFilters() {
    const empty = { categoryId: "", minPrice: "", maxPrice: "", inStock: false, searchTerm: "", color: "" };
    setDraftFilters(empty);
    setSearchParams({});
    setFiltersOpen(false);
    setPage(1);
  }

  function handleCategoryPillSelect(categoryId) {
    const next = { ...urlFilters, categoryId };
    setDraftFilters(next);
    setSearchParams(filtersToSearchParams(next));
    setPage(1);
  }

  function handlePageChange(nextPage) {
    const safe = Math.min(Math.max(1, nextPage), totalPages);
    setPage(safe);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <ShopLayout>
      <ShopHero
        categories={categories}
        activeCategoryId={activeFilters.categoryId}
        activeCategoryName={activeCategoryName}
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
              availableColors={filterColors}
              onChange={setDraftFilters}
              onApply={applyFilters}
              onReset={resetFilters}
            />
          </div>

          <div className="cb-shop-content">
            <ShopToolbar
              displayedCount={displayedCount}
              totalCount={totalCount}
              loading={loading}
              sortValue={sortValue}
              onSortChange={setSortValue}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              activeCategoryName={activeCategoryName}
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

            {!loading && !error && pageItems.length > 0 ? (
              <>
                <div
                  className={viewMode === "grid" ? "cb-shop-product-grid" : "cb-shop-product-list"}
                  data-count={viewMode === "grid" && pageItems.length <= 3 ? String(pageItems.length) : undefined}
                  key={`${viewMode}-${page}-${pageItems.length}`}
                >
                  {pageItems.map((product, index) => (
                    <ShopProductCard
                      key={product.id ?? product.Id}
                      product={product}
                      listView={viewMode === "list"}
                      listIndex={index}
                    />
                  ))}
                </div>

                <ShopPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <ShopFeatureBar />
    </ShopLayout>
  );
}
