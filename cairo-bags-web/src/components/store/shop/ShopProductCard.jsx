import { memo, useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useWishlist } from "../../../context/WishlistContext.jsx";
import { useCart } from "../../../context/CartContext.jsx";
import { useToast } from "../../ui/Toast.jsx";
import { useStoreReadOnly } from "../../../hooks/useStoreReadOnly.js";
import { useProductRatings } from "../../../context/ProductRatingContext.jsx";
import * as productService from "../../../services/productService.js";
import { ProductPrice } from "../ProductPrice.jsx";
import { QuickAddModal } from "../QuickAddModal.jsx";
import { StarRating } from "../../reviews/StarRating.jsx";
import {
  buildProductPath,
  getProductId,
  getProductImageUrl,
  getProductName,
  getProductVariants,
  getVariantId,
  isProductInStock,
  isProductNewArrival,
  isVariantInStock,
} from "../../../utils/productHelpers.js";
import { cn } from "../../../utils/cn.js";

const productDetailsCache = new Map();

async function loadProductDetails(productId) {
  if (productDetailsCache.has(productId)) return productDetailsCache.get(productId);
  const data = await productService.getProductById(productId);
  productDetailsCache.set(productId, data);
  return data;
}

function getPurchasableVariants(product) {
  return getProductVariants(product).filter((variant) => isVariantInStock(variant));
}

function ShopWishlistButton({ productId }) {
  const readOnly = useStoreReadOnly();
  if (readOnly) return null;

  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { error: toastError } = useToast();
  const [pending, setPending] = useState(false);
  const active = isInWishlist(productId);

  async function handleToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    setPending(true);
    try {
      await toggleWishlist(productId);
    } catch (err) {
      toastError(err.message || (locale === "ar" ? "تعذر تحديث المفضلة" : "Could not update wishlist"));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className={cn("cb-shop-card-wishlist", active && "cb-shop-card-wishlist-active")}
      aria-label={
        active
          ? locale === "ar"
            ? "إزالة من المفضلة"
            : "Remove from wishlist"
          : locale === "ar"
            ? "أضف إلى المفضلة"
            : "Add to wishlist"
      }
      aria-pressed={active}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}

function ShopCardRating({ product, href }) {
  const { locale } = useLocale();
  const { getRatingForProduct } = useProductRatings();
  const { averageRating, reviewCount } = getRatingForProduct(product);
  const hasReviews = reviewCount > 0;

  if (!hasReviews) {
    return (
      <span className="cb-shop-card-rating-empty">
        {locale === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}
      </span>
    );
  }

  return (
    <Link to={`${href}#reviews`} className="cb-shop-card-rating" onClick={(e) => e.stopPropagation()}>
      <StarRating value={averageRating} size="xs" gold label={`${averageRating.toFixed(1)}`} />
      <span className="cb-shop-card-rating-count">({reviewCount})</span>
    </Link>
  );
}

export const ShopProductCard = memo(function ShopProductCard({ product, className, listView = false }) {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();
  const { addItem } = useCart();
  const { success, error: toastError } = useToast();
  const [adding, setAdding] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const productId = getProductId(product);
  const name = getProductName(product, locale);
  const href = buildProductPath(product, locale);
  const inStock = isProductInStock(product);
  const isNew = isProductNewArrival(product);
  const imageUrl = getProductImageUrl(product);

  const labels = {
    added: locale === "ar" ? "أُضيف إلى السلة" : "Added to cart",
    outOfStock: locale === "ar" ? "غير متوفر" : "Out of stock",
    loadFailed: locale === "ar" ? "تعذر تحميل المنتج" : "Could not load product",
  };

  const handleAddToCart = useCallback(
    async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!inStock) {
        toastError(labels.outOfStock);
        return;
      }
      setAdding(true);
      try {
        let details = product;
        let purchasable = getPurchasableVariants(product);
        if (!purchasable.length) {
          details = await loadProductDetails(productId);
          purchasable = getPurchasableVariants(details);
        }
        if (!purchasable.length) {
          toastError(labels.outOfStock);
          return;
        }
        if (purchasable.length === 1) {
          await addItem({ productVariantId: getVariantId(purchasable[0]), quantity: 1 });
          success(labels.added);
          return;
        }
        setQuickAddProduct(details);
        setQuickAddOpen(true);
      } catch (err) {
        toastError(err.message || labels.loadFailed);
      } finally {
        setAdding(false);
      }
    },
    [addItem, inStock, labels, product, productId, success, toastError]
  );

  return (
    <>
      <article className={cn("cb-shop-card group", listView && "cb-shop-card-list", className)}>
        <div className="cb-shop-card-image-wrap">
          <Link to={href} className="cb-shop-card-image-link" aria-label={name}>
            {!imageLoaded && imageUrl ? <div className="cb-shimmer absolute inset-0" aria-hidden="true" /> : null}
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                className={cn("cb-shop-card-image", imageLoaded ? "opacity-100" : "opacity-0")}
              />
            ) : (
              <span className="font-display text-3xl text-brand-accent/40">CB</span>
            )}
          </Link>

          {isNew ? (
            <span className="cb-shop-card-badge">{locale === "ar" ? "جديد" : "New"}</span>
          ) : null}

          <ShopWishlistButton productId={productId} />

          {!readOnly ? (
            <button
              type="button"
              className="cb-shop-card-cart"
              onClick={handleAddToCart}
              disabled={adding || !inStock}
              aria-label={locale === "ar" ? "أضف للسلة" : "Add to cart"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M6 6h15l-1.5 9h-12L6 6Z" strokeLinejoin="round" />
                <path d="M6 6 5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="cb-shop-card-body">
          <Link to={href} className="cb-shop-card-info">
            <h3 className="cb-shop-card-title">{name}</h3>
            <div className="cb-shop-card-price-row">
              <ProductPrice product={product} size="sm" className="cb-shop-card-price" />
            </div>
            <ShopCardRating product={product} href={href} />
          </Link>
        </div>
      </article>

      {!readOnly ? (
        <QuickAddModal
          open={quickAddOpen}
          product={quickAddProduct}
          onClose={() => {
            setQuickAddOpen(false);
            setQuickAddProduct(null);
          }}
        />
      ) : null}
    </>
  );
});
