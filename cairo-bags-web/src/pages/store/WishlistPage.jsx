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
import { buildProductPath } from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";

function WishlistItemCard({ item, locale, onRemove, onAddToCart, removing }) {
  const name = getWishlistItemName(item, locale);
  const href = buildProductPath({ id: item.productId });

  return (
    <article
        className={cn(
        "overflow-hidden rounded-xl border border-brand-border/70 bg-brand-surface transition-all duration-500",
        removing ? "pointer-events-none scale-[0.98] opacity-0" : "opacity-100"
      )}
      style={{ boxShadow: "var(--cb-shadow-card)" }}
    >
      <div className="grid gap-4 p-4 sm:grid-cols-[120px_1fr] sm:items-center">
        <Link to={href} className="block overflow-hidden rounded-lg border border-brand-border/70 bg-brand-secondary">
          {item.primaryImage ? (
            <img
              src={item.primaryImage}
              alt={name}
              loading="lazy"
              decoding="async"
              className="cb-product-aspect cb-product-image transition-transform duration-500 hover:scale-[1.03]"
            />
          ) : (
            <div className="cb-product-aspect flex items-center justify-center font-display text-brand-muted/50">CB</div>
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
            <Button type="button" variant="outline" size="sm" onClick={() => onAddToCart(item)}>
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
        <div className="grid gap-4">
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
