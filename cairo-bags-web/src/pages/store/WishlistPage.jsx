import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { EmptyState } from "../../components/store/EmptyState.jsx";
import { QuickAddModal } from "../../components/store/QuickAddModal.jsx";
import { ProductPrice } from "../../components/store/ProductPrice.jsx";
import { Button, Spinner } from "../../components/ui/index.js";
import * as productService from "../../services/productService.js";
import { getWishlistItemName } from "../../utils/wishlistHelpers.js";
import { buildProductPathFromRefs } from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";

function WishlistItemCard({ item, locale, onRemove, onAddToCart, removing }) {
  const name = getWishlistItemName(item, locale);
  const href = buildProductPathFromRefs(
    {
      productId: item.productId,
      productSlugAr: item.productSlugAr ?? item.ProductSlugAr,
      productSlugEn: item.productSlugEn ?? item.ProductSlugEn,
    },
    locale
  );

  return (
    <article
      className={cn("cb-wishlist-card", removing && "pointer-events-none scale-[0.98] opacity-0")}
    >
      <div className="cb-wishlist-card-inner">
        <Link to={href} className="cb-wishlist-thumb">
          {item.primaryImage ? (
            <img src={item.primaryImage} alt={name} loading="lazy" decoding="async" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-brand-muted/50">CB</div>
          )}
        </Link>

        <div className="min-w-0 space-y-3">
          {item.category ? (
            <p className="text-[10px] font-medium tracking-[0.22em] text-brand-accent uppercase">
              {item.category}
            </p>
          ) : null}

          <Link to={href} className="block">
            <h2 className="font-display text-lg font-medium text-brand-text transition-colors hover:text-brand-accent">
              {name}
            </h2>
          </Link>

          <ProductPrice
            size="sm"
            price={item.price}
            comparePrice={item.compareAtPrice}
          />

          <p
            className={cn(
              "text-xs font-medium uppercase tracking-wide",
              item.inStock ? "text-emerald-700" : "text-red-700"
            )}
          >
            {item.inStock
              ? locale === "ar"
                ? "متوفر"
                : "In Stock"
              : locale === "ar"
                ? "نفد"
                : "Sold Out"}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!item.inStock}
              onClick={() => onAddToCart(item)}
            >
              {locale === "ar" ? "أضف للسلة" : "Add to Cart"}
            </Button>
            <Link to={href}>
              <Button type="button" variant="ghost" size="sm">
                {locale === "ar" ? "عرض المنتج" : "View Product"}
              </Button>
            </Link>
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.productId)}>
              {locale === "ar" ? "إزالة" : "Remove"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function WishlistPage() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const { items, loading, remove } = useWishlist();
  const { success, error: toastError } = useToast();

  const [removingIds, setRemovingIds] = useState(new Set());
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addingProductId, setAddingProductId] = useState(null);

  const title = locale === "ar" ? "المفضلة" : "Wishlist";
  usePageTitle(title);

  const handleRemove = useCallback(
    async (productId) => {
      setRemovingIds((current) => new Set(current).add(productId));
      try {
        await new Promise((resolve) => window.setTimeout(resolve, 280));
        await remove(productId);
        success(locale === "ar" ? "تمت الإزالة من المفضلة" : "Removed from wishlist");
      } catch (err) {
        toastError(err.message);
      } finally {
        setRemovingIds((current) => {
          const next = new Set(current);
          next.delete(productId);
          return next;
        });
      }
    },
    [locale, remove, success, toastError]
  );

  const handleAddToCart = useCallback(
    async (item) => {
      setAddingProductId(item.productId);
      try {
        const product = await productService.getProductById(item.productId);
        setQuickAddProduct(product);
        setQuickAddOpen(true);
      } catch (err) {
        toastError(err.message || (locale === "ar" ? "تعذر تحميل المنتج" : "Could not load product"));
      } finally {
        setAddingProductId(null);
      }
    },
    [locale, toastError]
  );

  return (
    <StoreLayout>
      <div className="mb-10">
        <h1 className="cb-page-title">{title}</h1>
        {items.length > 0 ? (
          <p className="cb-page-lead">
            {locale === "ar"
              ? `${items.length} منتج`
              : `${items.length} item${items.length === 1 ? "" : "s"}`}
          </p>
        ) : null}
      </div>

      {loading && items.length === 0 ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          variant="wishlist"
          title={locale === "ar" ? "قائمة المفضلة فارغة" : "Your wishlist is empty"}
          description={
            locale === "ar"
              ? "احفظ القطع التي تعجبك لتعود إليها لاحقاً"
              : "Save pieces you love and come back to them anytime"
          }
          action={
            <Button variant="accent" onClick={() => navigate("/shop")}>
              {locale === "ar" ? "تسوق الآن" : "Shop Now"}
            </Button>
          }
        />
      ) : null}

      {items.length > 0 ? (
        <div className="cb-wishlist-list">
          {items.map((item) => (
            <WishlistItemCard
              key={item.productId}
              item={item}
              locale={locale}
              removing={removingIds.has(item.productId)}
              onRemove={handleRemove}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : null}

      {addingProductId ? (
        <p className="sr-only" aria-live="polite">
          {locale === "ar" ? "جاري التحميل" : "Loading"}
        </p>
      ) : null}

      <QuickAddModal
        open={quickAddOpen}
        product={quickAddProduct}
        onClose={() => {
          setQuickAddOpen(false);
          setQuickAddProduct(null);
        }}
      />
    </StoreLayout>
  );
}
