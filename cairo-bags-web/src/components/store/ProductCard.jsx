import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import * as productService from "../../services/productService.js";
import { ProductPrice } from "./ProductPrice.jsx";
import { ProductBadges } from "./ProductBadges.jsx";
import { ProductRatingLine } from "../reviews/ProductRatingLine.jsx";
import { QuickAddModal } from "./QuickAddModal.jsx";
import {
  buildProductPath,
  getCategoryName,
  getProductComparePrice,
  getProductId,
  getProductImageAssetUrl,
  getProductImageUrl,
  getProductImages,
  getProductName,
  getProductPriceRange,
  getProductVariants,
  getVariantColorName,
  getVariantId,
  isProductInStock,
  isVariantInStock,
} from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";

const SWATCH_TONES = [
  "bg-brand-primary",
  "bg-brand-accent",
  "bg-[#8B7355]",
  "bg-[#C4B5A0]",
  "bg-[#2A2824]",
];

const productDetailsCache = new Map();

function getSecondaryImageFromProduct(product) {
  const images = getProductImages(product);
  if (images.length < 2) return null;

  const primaryIndex = images.findIndex((image) => image.isPrimary ?? image.IsPrimary);
  const secondary =
    images.find((image, index) => index !== primaryIndex && !(image.isPrimary ?? image.IsPrimary)) ??
    images[primaryIndex === 0 ? 1 : 0];

  return getProductImageAssetUrl(secondary);
}

function preloadImage(url) {
  if (!url || typeof window === "undefined") return;
  const img = new Image();
  img.src = url;
}

async function loadProductDetails(productId) {
  if (productDetailsCache.has(productId)) {
    return productDetailsCache.get(productId);
  }

  const data = await productService.getProductById(productId);
  productDetailsCache.set(productId, data);
  return data;
}

function useHoverCapable() {
  const [hoverCapable, setHoverCapable] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverCapable(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return hoverCapable;
}

function getProductCategoryName(product, locale) {
  const category = product?.category ?? product?.Category;
  if (category) return getCategoryName(category, locale);
  return product?.categoryName ?? product?.CategoryName ?? null;
}

function getDiscountPercent(product) {
  const compare = getProductComparePrice(product);
  const { low } = getProductPriceRange(product);
  if (compare == null || low == null) return null;
  if (Number(compare) <= Number(low)) return null;
  return Math.round(((Number(compare) - Number(low)) / Number(compare)) * 100);
}

function getPurchasableVariants(product) {
  return getProductVariants(product).filter((variant) => isVariantInStock(variant));
}

function WishlistButton({ productId, className }) {
  const readOnly = useStoreReadOnly();
  if (readOnly) return null;

  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { error: toastError } = useToast();

  const [pending, setPending] = useState(false);
  const [pulse, setPulse] = useState(false);

  const active = isInWishlist(productId);

  async function handleToggle(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }

    setPending(true);
    setPulse(true);
    try {
      await toggleWishlist(productId);
    } catch (err) {
      toastError(err.message || (locale === "ar" ? "تعذر تحديث المفضلة" : "Could not update wishlist"));
    } finally {
      setPending(false);
      window.setTimeout(() => setPulse(false), 450);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-300",
        "hover:scale-110 active:scale-95 disabled:opacity-70",
        pulse && "animate-[pulse_0.45s_ease-out]",
        active
          ? "border-brand-accent bg-brand-accent/20 text-brand-accent"
          : "border-brand-border/80 bg-brand-surface/90 text-brand-text hover:border-brand-accent hover:text-brand-accent",
        className
      )}
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
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        className={cn("transition-all duration-300", active && "scale-110")}
        aria-hidden="true"
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </button>
  );
}

function ColorVariants({ product, className }) {
  const { locale } = useLocale();
  const variants = getProductVariants(product);

  if (!variants.length) return null;

  const colors = variants.slice(0, 5).map((variant, index) => ({
    id: getVariantId(variant),
    name: getVariantColorName(variant, locale),
    tone: SWATCH_TONES[index % SWATCH_TONES.length],
  }));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-[10px] font-medium tracking-[0.18em] text-brand-muted uppercase">
        {locale === "ar" ? "اللون" : "Color"}
      </span>
      <div className="flex items-center gap-1.5">
        {colors.map((color) => (
          <span
            key={color.id}
            title={color.name}
            className={cn(
              "h-3.5 w-3.5 rounded-full ring-1 ring-brand-border transition-transform duration-300 group-hover:scale-110",
              color.tone
            )}
          />
        ))}
      </div>
    </div>
  );
}

function DiscountBadge({ product, className }) {
  const discount = getDiscountPercent(product);
  if (!discount) return null;

  return (
    <Badge
      variant="primary"
      size="sm"
      className={cn("border-brand-accent/30 bg-brand-primary text-brand-accent", className)}
    >
      -{discount}%
    </Badge>
  );
}

const ProductCardImage = memo(function ProductCardImage({ product, name, href, hoverCapable }) {
  const productId = getProductId(product);
  const primaryUrl = getProductImageUrl(product);
  const inlineSecondary = getSecondaryImageFromProduct(product);

  const [secondaryUrl, setSecondaryUrl] = useState(inlineSecondary);
  const [showSecondary, setShowSecondary] = useState(false);
  const fetchStartedRef = useRef(false);

  useEffect(() => {
    setSecondaryUrl(inlineSecondary);
    fetchStartedRef.current = false;
  }, [productId, inlineSecondary]);

  const handlePrimaryLoad = useCallback(() => {
    if (secondaryUrl) {
      preloadImage(secondaryUrl);
      return;
    }

    if (!hoverCapable || fetchStartedRef.current) return;
    fetchStartedRef.current = true;

    loadProductDetails(productId)
      .then((details) => {
        const nextSecondary = getSecondaryImageFromProduct(details);
        if (nextSecondary) {
          setSecondaryUrl(nextSecondary);
          preloadImage(nextSecondary);
        }
      })
      .catch(() => {});
  }, [hoverCapable, productId, secondaryUrl]);

  const canCrossfade = hoverCapable && Boolean(secondaryUrl);

  return (
    <div
      className="relative aspect-[3/4] overflow-hidden bg-brand-secondary"
      onMouseEnter={() => canCrossfade && setShowSecondary(true)}
      onMouseLeave={() => setShowSecondary(false)}
    >
      <Link to={href} className="absolute inset-0 z-0 block" aria-label={name}>
        {primaryUrl ? (
          <div className="relative h-full w-full">
            <img
              src={primaryUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              onLoad={handlePrimaryLoad}
              className={cn(
                "absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ease-out-expo",
                canCrossfade && showSecondary ? "scale-105 opacity-0" : "scale-100 opacity-100",
                "group-hover:scale-105"
              )}
            />
            {canCrossfade ? (
              <img
                src={secondaryUrl}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className={cn(
                  "absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ease-out-expo",
                  showSecondary ? "scale-105 opacity-100" : "scale-100 opacity-0"
                )}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="font-display text-4xl opacity-40"
              style={{
                background: "linear-gradient(135deg, #c9a962, #e8d5a3)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CB
            </span>
          </div>
        )}
      </Link>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-primary/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </div>
  );
});

const LuxuryProductCard = memo(function LuxuryProductCard({ product, className, compact = false }) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const hoverCapable = useHoverCapable();
  const readOnly = useStoreReadOnly();
  const { addItem } = useCart();
  const { success, error: toastError } = useToast();

  const [adding, setAdding] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);

  const productId = getProductId(product);
  const name = getProductName(product, locale);
  const categoryName = getProductCategoryName(product, locale);
  const href = buildProductPath(product);
  const inStock = isProductInStock(product);
  const discount = getDiscountPercent(product);

  const labels = useMemo(
    () => ({
      quickView: locale === "ar" ? "عرض سريع" : "Quick View",
      viewProduct: locale === "ar" ? "عرض المنتج" : "View Product",
      addToCart: locale === "ar" ? "أضف للسلة" : "Add to Cart",
      soldOut: locale === "ar" ? "نفد" : "Sold Out",
      added: locale === "ar" ? "أُضيف إلى السلة" : "Added to cart",
      outOfStock: locale === "ar" ? "غير متوفر" : "Out of stock",
      addFailed: locale === "ar" ? "فشل الإضافة" : "Could not add to cart",
      loadFailed: locale === "ar" ? "تعذر تحميل المنتج" : "Could not load product",
    }),
    [locale]
  );

  const handleQuickView = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      navigate(href);
    },
    [href, navigate]
  );

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
      <article className={cn("group relative flex h-full flex-col", className)}>
        <div
          className={cn(
            "relative flex flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-brand-border bg-brand-surface",
            "shadow-card transition-all duration-500 ease-out-expo",
            "group-hover:-translate-y-1.5 group-hover:border-brand-accent/45 group-hover:shadow-card-hover",
            "dark:border-brand-border dark:bg-brand-surface-dark"
          )}
        >
          <div
            className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-brand-accent/10 transition-all duration-700 ease-out-expo group-hover:scale-[2.2] group-hover:bg-brand-accent/18"
            aria-hidden="true"
          />

          <div className="relative block flex-1">
            <ProductCardImage
              product={product}
              name={name}
              href={href}
              hoverCapable={hoverCapable}
            />

            <div
              className={cn(
                "absolute inset-x-0 bottom-0 z-20 flex translate-y-0 flex-col gap-2 px-4 pb-4 opacity-100 transition-all duration-500 ease-out-expo",
                "sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100",
                compact && "px-3 pb-3"
              )}
            >
              {readOnly ? (
                <Button
                  type="button"
                  variant="accent"
                  size="sm"
                  className="w-full"
                  onClick={handleQuickView}
                >
                  {labels.viewProduct}
                </Button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-brand-secondary/30 bg-brand-surface/95 text-brand-text backdrop-blur-sm hover:border-brand-accent hover:bg-brand-surface"
                    onClick={handleQuickView}
                  >
                    {labels.quickView}
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    loading={adding}
                    disabled={adding || !inStock}
                    className="w-full"
                    onClick={handleAddToCart}
                  >
                    {inStock ? labels.addToCart : labels.soldOut}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="absolute start-3 top-3 z-20 flex flex-wrap gap-1.5">
            <ProductBadges product={product} showStock={false} />
            {discount ? <DiscountBadge product={product} /> : null}
          </div>

          <div className="absolute end-3 top-3 z-20">
            {!readOnly ? (
              <WishlistButton
                productId={productId}
                className="transition-all duration-300 group-hover:scale-105 sm:group-hover:scale-110"
              />
            ) : null}
          </div>

          <div
            className={cn(
              "relative z-10 border-t border-brand-border/70 bg-brand-surface px-4 py-4 transition-all duration-500 ease-out-expo dark:bg-brand-surface-dark",
              "group-hover:pb-5",
              compact ? "px-3 py-3" : "px-4 py-4"
            )}
          >
            <Link to={href} className="block space-y-2">
              {categoryName ? (
                <p className="text-[10px] font-medium tracking-[0.22em] text-brand-accent uppercase">
                  {categoryName}
                </p>
              ) : null}

              <h3 className="font-display text-base font-medium leading-snug text-brand-text transition-colors duration-300 group-hover:text-brand-accent md:text-lg">
                {name}
              </h3>

              <ProductRatingLine product={product} size="xs" linkToReviews={`${href}#reviews`} />
              <ProductPrice product={product} size="sm" />
              <ColorVariants product={product} className="sm:opacity-80 sm:group-hover:opacity-100" />
            </Link>

            <div className="mt-3 flex items-center justify-between gap-2">
              <Badge variant={inStock ? "success" : "outline"} size="sm">
                {inStock
                  ? locale === "ar"
                    ? "متوفر"
                    : "In Stock"
                  : locale === "ar"
                    ? "نفد"
                    : "Sold Out"}
              </Badge>
            </div>
          </div>
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

export const ProductCard = memo(function ProductCard({ product, className, variant = "store" }) {
  return (
    <LuxuryProductCard
      product={product}
      className={className}
      compact={variant === "landing"}
    />
  );
});
