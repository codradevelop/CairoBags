import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useCatalogRefresh } from "../../hooks/useCatalogRefresh.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import * as productService from "../../services/productService.js";
import {
  ProductGallery,
  ProductDetailPanel,
  ProductDetailSkeleton,
  EmptyState,
} from "../../components/store/index.js";
import {
  getProductDescription,
  getProductImages,
  getProductName,
  getProductSlug,
  buildProductPath,
  getProductVariants,
  getVariantColorName,
  getVariantId,
  getVariantAvailableStock,
  isVariantInStock,
} from "../../utils/productHelpers.js";
import {
  getCartItemQuantity,
  getCartItemVariantId,
  getCartItems,
} from "../../utils/cartHelpers.js";
import { Button } from "../../components/ui/index.js";
import { ReviewSection } from "../../components/reviews/index.js";
import {
  requestReviewsHighlight,
  scrollToReviewsSection,
} from "../../utils/reviewScrollUtils.js";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { normalizeSlug } from "../../utils/slugHelper.js";

// ── Size helper (mirrors QuickAddModal) ───────────────────────────────────────
function getVariantSizeName(variant, locale) {
  if (!variant) return "";
  return locale === "ar"
    ? variant.sizeNameAr ?? variant.SizeNameAr ?? variant.sizeNameEn ?? variant.SizeNameEn ?? ""
    : variant.sizeNameEn ?? variant.SizeNameEn ?? variant.sizeNameAr ?? variant.SizeNameAr ?? "";
}

export function ProductDetailsPage() {
  const { slug: slugParam } = useParams();
  const identifier = decodeURIComponent(slugParam ?? "");
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { addItem, updateItem, cart } = useCart();
  const { success, error: toastError } = useToast();
  const readOnly = useStoreReadOnly();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [ratingStats, setRatingStats] = useState(null);

  const productName = product ? getProductName(product, locale) : "";
  usePageTitle(productName || (locale === "ar" ? "المنتج" : "Product"));

  const loadProduct = useCallback(async (options = {}) => {
    const background = options?.background === true;
    if (!background) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await productService.getProductByIdentifier(identifier);
      setProduct(data);
      const variants = getProductVariants(data);
      const defaultVariant =
        variants.find((v) => v.isDefault ?? v.IsDefault) ?? variants[0] ?? null;
      if (defaultVariant && !background) {
        setSelectedColor(getVariantColorName(defaultVariant, locale) || null);
        setSelectedSize(getVariantSizeName(defaultVariant, locale) || null);
      }
    } catch (err) {
      if (!background) {
        setError(err);
        setProduct(null);
      }
    } finally {
      if (!background) setLoading(false);
    }
  }, [identifier, locale]);

  useEffect(() => {
    loadProduct();
    setRatingStats(null);
  }, [loadProduct]);

  useCatalogRefresh(loadProduct, {
    entity: "product",
    id: product ? (product.id ?? product.Id) : undefined,
  });

  useEffect(() => {
    if (!product) return;
    const canonicalSlug = getProductSlug(product, locale);
    if (!canonicalSlug || normalizeSlug(canonicalSlug) === normalizeSlug(identifier)) return;
    navigate(`${buildProductPath(product, locale)}${window.location.hash}`, { replace: true });
  }, [product, locale, identifier, navigate]);

  useEffect(() => {
    if (loading || !product) return;
    if (window.location.hash !== "#reviews") return;
    requestReviewsHighlight();
    const timer = window.setTimeout(() => {
      scrollToReviewsSection();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [loading, product]);

  const scrollToReviews = useCallback(() => {
    requestReviewsHighlight();
    scrollToReviewsSection();
    window.history.replaceState(null, "", `${window.location.pathname}#reviews`);
  }, []);

  const variants = useMemo(
    () => (product ? getProductVariants(product) : []),
    [product]
  );

  // ── Derived selections ────────────────────────────────────────────────────
  // Unique color names
  const colorOptions = useMemo(() => {
    const seen = new Set();
    return variants
      .map((v) => getVariantColorName(v, locale))
      .filter((c) => c && !seen.has(c) && seen.add(c));
  }, [variants, locale]);

  // Does this product use sizes at all?
  const hasSizes = useMemo(
    () => variants.some((v) => getVariantSizeName(v, locale) !== ""),
    [variants, locale]
  );

  // Sizes available for the currently-selected color
  const sizeOptions = useMemo(() => {
    if (!hasSizes) return [];
    const filtered = selectedColor
      ? variants.filter((v) => getVariantColorName(v, locale) === selectedColor)
      : variants;
    const seen = new Set();
    return filtered
      .map((v) => getVariantSizeName(v, locale))
      .filter((s) => s && !seen.has(s) && seen.add(s));
  }, [hasSizes, variants, locale, selectedColor]);

  // Which variant matches the current color + size selection?
  const selectedVariant = useMemo(() => {
    return (
      variants.find((v) => {
        const colorMatch = !selectedColor || getVariantColorName(v, locale) === selectedColor;
        const sizeMatch = !hasSizes || !selectedSize || getVariantSizeName(v, locale) === selectedSize;
        return colorMatch && sizeMatch;
      }) ?? null
    );
  }, [variants, selectedColor, selectedSize, hasSizes, locale]);

  const selectedVariantId = selectedVariant ? getVariantId(selectedVariant) : null;
  const maxQuantity = selectedVariant ? Math.max(getVariantAvailableStock(selectedVariant), 0) : 0;

  useEffect(() => {
    setQuantity(1);
  }, [selectedVariantId]);

  useEffect(() => {
    if (maxQuantity > 0 && quantity > maxQuantity) {
      setQuantity(maxQuantity);
    }
  }, [maxQuantity, quantity]);

  // When color changes, reset size to the first available for that color
  function handleColorChange(color) {
    setSelectedColor(color);
    setQuantity(1);
    if (hasSizes) {
      const firstForColor = variants.find(
        (v) => getVariantColorName(v, locale) === color && getVariantSizeName(v, locale) !== ""
      );
      setSelectedSize(firstForColor ? getVariantSizeName(firstForColor, locale) : null);
    }
  }

  const images = product ? getProductImages(product) : [];
  const description = product ? getProductDescription(product, locale) : "";
  const inStock = selectedVariant ? isVariantInStock(selectedVariant) : false;

  const labels = useMemo(
    () => ({
      buyNow: locale === "ar" ? "اشترِ الآن" : "Buy Now",
      addToCart: locale === "ar" ? "أضف إلى السلة" : "Add to Cart",
      selectVariant: locale === "ar" ? "اختر المتغير" : "Please select a variant",
      outOfStock: locale === "ar" ? "غير متوفر" : "Out of stock",
      added: locale === "ar" ? "أُضيف إلى السلة" : "Added to cart",
      addFailed: locale === "ar" ? "فشل الإضافة" : "Could not add to cart",
    }),
    [locale]
  );

  const addOrUpdateCartItem = useCallback(
    async (variantId, quantity) => {
      const items = getCartItems(cart);
      const existing = items.find((item) => getCartItemVariantId(item) === variantId);

      if (existing) {
        await updateItem(variantId, {
          quantity: getCartItemQuantity(existing) + quantity,
        });
      } else {
        await addItem({ productVariantId: variantId, quantity });
      }
    },
    [addItem, cart, updateItem]
  );

  async function validateSelection() {
    if (!selectedVariantId) {
      toastError(labels.selectVariant);
      return false;
    }
    if (!inStock) {
      toastError(labels.outOfStock);
      return false;
    }
    return true;
  }

  async function handleAddToCart() {
    if (readOnly) return;
    if (!(await validateSelection())) return;

    setAdding(true);
    try {
      await addOrUpdateCartItem(selectedVariantId, quantity);
      success(labels.added);
    } catch (err) {
      toastError(err.message || labels.addFailed);
    } finally {
      setAdding(false);
    }
  }

  async function handleBuyNow() {
    if (readOnly) return;
    if (!(await validateSelection())) return;

    setBuying(true);
    try {
      await addOrUpdateCartItem(selectedVariantId, quantity);
      navigate("/checkout");
    } catch (err) {
      toastError(err.message || labels.addFailed);
    } finally {
      setBuying(false);
    }
  }

  return (
    <StoreLayout contentClassName="!py-6 md:!py-12">
      <nav className="cb-store-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">{locale === "ar" ? "الرئيسية" : "Home"}</Link>
        <span className="cb-store-breadcrumbs-sep">/</span>
        <Link to="/shop">{locale === "ar" ? "تسوق" : "Shop"}</Link>
        {productName ? (
          <>
            <span className="cb-store-breadcrumbs-sep">/</span>
            <span className="line-clamp-1 text-brand-text">{productName}</span>
          </>
        ) : null}
      </nav>

      {loading ? <ProductDetailSkeleton /> : null}

      {!loading && error ? (
        <EmptyState
          variant="error"
          title={locale === "ar" ? "المنتج غير موجود" : "Product not found"}
          description={error.message}
          action={
            <Link to="/shop">
              <Button variant="accent">{locale === "ar" ? "العودة للتسوق" : "Back to Shop"}</Button>
            </Link>
          }
        />
      ) : null}

      {!loading && !error && product ? (
        <div className="cb-product-detail-grid">
          <ProductGallery images={images} productName={productName} className="cb-product-detail-gallery" />

          <ProductDetailPanel
            product={product}
            productName={productName}
            description={description}
            productImages={images}
            variants={variants}
            colorOptions={colorOptions}
            sizeOptions={sizeOptions}
            hasSizes={hasSizes}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            selectedVariant={selectedVariant}
            inStock={inStock}
            quantity={quantity}
            maxQuantity={maxQuantity}
            readOnly={readOnly}
            labels={labels}
            adding={adding}
            buying={buying}
            onColorChange={handleColorChange}
            onSizeChange={(size) => {
              setSelectedSize(size);
              setQuantity(1);
            }}
            onQuantityChange={setQuantity}
            onScrollToReviews={scrollToReviews}
            onBuyNow={handleBuyNow}
            onAddToCart={handleAddToCart}
          />
        </div>
      ) : null}

      {!loading && !error && product ? (
        <ReviewSection
          productId={product.id ?? product.Id ?? identifier}
          onStatsChange={setRatingStats}
          className="mt-16 border-t border-brand-border/60 pt-16 md:mt-20 md:pt-20"
        />
      ) : null}
    </StoreLayout>
  );
}
