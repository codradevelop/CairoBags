import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useWishlist } from "../../../context/WishlistContext.jsx";
import { useCart } from "../../../context/CartContext.jsx";
import { useToast } from "../../ui/Toast.jsx";
import { useStoreReadOnly } from "../../../hooks/useStoreReadOnly.js";
import { useResolvedImageLoad } from "../../../hooks/useResolvedImageLoad.js";
import { subscribeCatalogChange } from "../../../utils/catalogEvents.js";
import { useProductRatings } from "../../../context/ProductRatingContext.jsx";
import * as productService from "../../../services/productService.js";
import { ProductPrice } from "../ProductPrice.jsx";
import { QuickAddModal } from "../QuickAddModal.jsx";
import { StarRating } from "../../reviews/StarRating.jsx";
import {
  buildProductPath,
  getProductId,
  getProductImageCardUrl,
  getProductCardImageUrl,
  getProductImages,
  getProductName,
  getProductVariants,
  getVariantId,
  isProductInStock,
  isProductNewArrival,
  isVariantInStock,
} from "../../../utils/productHelpers.js";
import { cn } from "../../../utils/cn.js";
import { ProductPresentation, isAboveFoldPriority } from "../ProductPresentation.jsx";

/* ─────────────────────────────────────────────────────────
   Cache & helpers
───────────────────────────────────────────────────────── */
const productDetailsCache = new Map();

if (typeof window !== "undefined") {
  subscribeCatalogChange((detail) => {
    if (detail.entityType === "product" && detail.id != null) {
      productDetailsCache.delete(detail.id);
    }
  });
}

async function loadProductDetails(productId) {
  if (productDetailsCache.has(productId)) return productDetailsCache.get(productId);
  const data = await productService.getProductById(productId);
  productDetailsCache.set(productId, data);
  return data;
}

function getAllProductImageUrls(product) {
  const images = getProductImages(product);
  if (images.length) {
    const urls = images.map((img) => getProductImageCardUrl(img)).filter(Boolean);
    if (urls.length) return urls;
  }
  const fallback = getProductCardImageUrl(product);
  return fallback ? [fallback] : [];
}

function getPurchasableVariants(product) {
  return getProductVariants(product).filter((variant) => isVariantInStock(variant));
}

/* ─────────────────────────────────────────────────────────
   Simple image display — no arrows, just the slides + dots
───────────────────────────────────────────────────────── */
function ShopCardImageSlides({ urls, current, name, priority = "low" }) {
  const primaryUrl = urls[0] ?? null;
  const count = urls.length;

  const { loaded: primaryLoaded, imgRef, handleLoad, handleError } = useResolvedImageLoad(
    primaryUrl,
    primaryUrl
  );

  return (
    <div className="relative h-full w-full">
      {!primaryLoaded && primaryUrl ? (
        <div className="cb-shimmer absolute inset-0 z-[1]" aria-hidden="true" />
      ) : null}

      <ProductPresentation size="card" className="h-full" priority={priority}>
        {primaryUrl ? (
          <div className="cb-pres__images">
            {urls.map((url, i) => (
              <img
                key={url}
                ref={i === 0 ? imgRef : undefined}
                src={url}
                alt={i === 0 ? name : ""}
                aria-hidden={i !== 0}
                loading={priority === "high" && i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={priority === "high" && i === 0 ? "high" : "low"}
                onLoad={i === 0 ? handleLoad : undefined}
                onError={i === 0 ? handleError : undefined}
                className={cn(
                  "cb-pres__img",
                  i !== 0 && "cb-pres__img--secondary",
                  i === current ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              />
            ))}
          </div>
        ) : null}
      </ProductPresentation>

      {count > 1 ? (
        <div className="absolute bottom-2 start-0 end-0 z-20 flex justify-center gap-1 pointer-events-none">
          {urls.map((_, i) => (
            <span
              key={i}
              className={cn(
                "block rounded-full transition-all duration-300",
                i === current ? "h-1.5 w-4 bg-white shadow" : "h-1.5 w-1.5 bg-white/55"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Wishlist button
───────────────────────────────────────────────────────── */
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
          ? locale === "ar" ? "إزالة من المفضلة" : "Remove from wishlist"
          : locale === "ar" ? "أضف إلى المفضلة" : "Add to wishlist"
      }
      aria-pressed={active}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   Rating row
───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   Main exported card
   Slider state lives here so arrows can be positioned
   relative to the card (outside the overflow:hidden image-wrap)
───────────────────────────────────────────────────────── */
export const ShopProductCard = memo(function ShopProductCard({
  product,
  className,
  listView = false,
  listIndex = 0,
}) {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();
  const { addItem } = useCart();
  const { success, error: toastError } = useToast();
  const [adding, setAdding] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);

  /* ── slider state ── */
  const [imageUrls, setImageUrls] = useState(() => getAllProductImageUrls(product));
  const [currentImg, setCurrentImg] = useState(0);
  const [cardHovered, setCardHovered] = useState(false);
  const fetchedRef = useRef(false);
  const timerRef = useRef(null);
  const imgCount = imageUrls.length;

  const productId = getProductId(product);
  const name = getProductName(product, locale);
  const href = buildProductPath(product, locale);
  const inStock = isProductInStock(product);
  const isNew = isProductNewArrival(product);

  /* lazy-load full image list on first hover */
  const handleCardEnter = useCallback(() => {
    setCardHovered(true);
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadProductDetails(productId)
      .then((details) => {
        const allUrls = getAllProductImageUrls(details);
        if (allUrls.length > 1) {
          setImageUrls(allUrls);
          const preload = new Image();
          preload.src = allUrls[1];
        }
      })
      .catch(() => {});
  }, [productId]);

  const handleCardLeave = useCallback(() => setCardHovered(false), []);

  /* auto-advance */
  useEffect(() => {
    if (!cardHovered || imgCount <= 1) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setCurrentImg((c) => (c + 1) % imgCount), 2400);
    return () => clearInterval(timerRef.current);
  }, [cardHovered, imgCount]);

  const goPrev = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((c) => (c - 1 + imgCount) % imgCount);
  }, [imgCount]);

  const goNext = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImg((c) => (c + 1) % imgCount);
  }, [imgCount]);

  const labels = {
    added: locale === "ar" ? "أُضيف إلى السلة" : "Added to cart",
    outOfStock: locale === "ar" ? "غير متوفر" : "Out of stock",
    loadFailed: locale === "ar" ? "تعذر تحميل المنتج" : "Could not load product",
  };

  const handleAddToCart = useCallback(
    async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!inStock) { toastError(labels.outOfStock); return; }
      setAdding(true);
      try {
        let details = product;
        let purchasable = getPurchasableVariants(product);
        if (!purchasable.length) {
          details = await loadProductDetails(productId);
          purchasable = getPurchasableVariants(details);
        }
        if (!purchasable.length) { toastError(labels.outOfStock); return; }
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
      <article
        className={cn("cb-shop-card group", listView && "cb-shop-card-list", className)}
        onMouseEnter={handleCardEnter}
        onMouseLeave={handleCardLeave}
      >
        {/*
          ── Prev / Next arrows ──
          Rendered at the CARD level (outside image-wrap's overflow:hidden)
          so they sit exactly on the left / right edge of the card.
          Vertically centred over the image area using the CSS variable.
        */}
        {imgCount > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className={cn(
                "cb-shop-card-nav cb-shop-card-nav-prev",
                cardHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
              )}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className={cn(
                "cb-shop-card-nav cb-shop-card-nav-next",
                cardHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1"
              )}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        <div className="cb-shop-card-image-wrap">
          <Link to={href} className="cb-shop-card-image-link" aria-label={name} tabIndex={-1}>
            <ShopCardImageSlides
              urls={imageUrls}
              current={currentImg}
              name={name}
              priority={isAboveFoldPriority(listIndex) ? "high" : "low"}
            />
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
