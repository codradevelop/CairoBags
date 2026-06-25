import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StoreLayout } from "../../layouts/StoreLayout.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useLocale } from "../../components/layout/LanguageSwitcher.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import * as productService from "../../services/productService.js";
import {
  ProductGallery,
  ProductPrice,
  ProductBadges,
  ProductDetailSkeleton,
  EmptyState,
} from "../../components/store/index.js";
import {
  getProductDescription,
  getProductImages,
  getProductName,
  getProductVariants,
  getVariantColorName,
  getVariantComparePrice,
  getVariantId,
  getVariantPrice,
  isVariantInStock,
} from "../../utils/productHelpers.js";
import { Button, Label } from "../../components/ui/index.js";
import { cn } from "../../utils/cn.js";

// ── Size helper (mirrors QuickAddModal) ───────────────────────────────────────
function getVariantSizeName(variant, locale) {
  if (!variant) return "";
  return locale === "ar"
    ? variant.sizeNameAr ?? variant.SizeNameAr ?? variant.sizeNameEn ?? variant.SizeNameEn ?? ""
    : variant.sizeNameEn ?? variant.SizeNameEn ?? variant.sizeNameAr ?? variant.SizeNameAr ?? "";
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const { locale } = useLocale();
  const { addItem, loading: cartLoading } = useCart();
  const { success, error: toastError } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [adding, setAdding] = useState(false);

  const productName = product ? getProductName(product, locale) : "";
  usePageTitle(productName || (locale === "ar" ? "المنتج" : "Product"));

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getProductById(id);
      setProduct(data);
      const variants = getProductVariants(data);
      const defaultVariant =
        variants.find((v) => v.isDefault ?? v.IsDefault) ?? variants[0] ?? null;
      if (defaultVariant) {
        setSelectedColor(getVariantColorName(defaultVariant, locale) || null);
        setSelectedSize(getVariantSizeName(defaultVariant, locale) || null);
      }
    } catch (err) {
      setError(err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [id, locale]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

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

  // When color changes, reset size to the first available for that color
  function handleColorChange(color) {
    setSelectedColor(color);
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

  async function handleAddToCart() {
    if (!selectedVariantId) {
      toastError(locale === "ar" ? "اختر المتغير" : "Please select a variant");
      return;
    }
    if (!inStock) {
      toastError(locale === "ar" ? "غير متوفر" : "Out of stock");
      return;
    }
    setAdding(true);
    try {
      await addItem({ productVariantId: selectedVariantId, quantity: 1 });
      success(locale === "ar" ? "أُضيف إلى السلة" : "Added to cart");
    } catch (err) {
      toastError(err.message || (locale === "ar" ? "فشل الإضافة" : "Could not add to cart"));
    } finally {
      setAdding(false);
    }
  }

  return (
    <StoreLayout contentClassName="!py-6 md:!py-10">
      <nav className="mb-6 text-sm text-brand-muted">
        <Link to="/" className="hover:text-brand-accent">
          {locale === "ar" ? "الرئيسية" : "Home"}
        </Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-brand-accent">
          {locale === "ar" ? "تسوق" : "Shop"}
        </Link>
        {productName ? (
          <>
            <span className="mx-2">/</span>
            <span className="text-brand-text">{productName}</span>
          </>
        ) : null}
      </nav>

      {loading ? <ProductDetailSkeleton /> : null}

      {!loading && error ? (
        <EmptyState
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
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <ProductGallery images={images} productName={productName} />

          <div>
            <ProductBadges product={product} className="mb-4" />
            <h1 className="font-display text-3xl font-medium text-brand-text md:text-4xl">
              {productName}
            </h1>

            <ProductPrice
              className="mt-4"
              size="lg"
              price={selectedVariant ? getVariantPrice(selectedVariant) : undefined}
              comparePrice={selectedVariant ? getVariantComparePrice(selectedVariant) : undefined}
              product={!selectedVariant ? product : undefined}
            />

            {description ? (
              <p className="mt-6 text-sm leading-relaxed text-brand-muted md:text-base">
                {description}
              </p>
            ) : null}

            {/* ── Color selector ─────────────────────────────────────────── */}
            {colorOptions.length > 0 ? (
              <div className="mt-8">
                <Label className="mb-3">
                  {locale === "ar" ? "اللون" : "Color"}
                  {selectedColor ? (
                    <span className="ms-2 font-normal text-brand-muted">— {selectedColor}</span>
                  ) : null}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => {
                    const selected = color === selectedColor;
                    // check if any variant with this color is in stock
                    const hasStock = variants
                      .filter((v) => getVariantColorName(v, locale) === color)
                      .some((v) => isVariantInStock(v));
                    return (
                      <button
                        key={color}
                        type="button"
                        disabled={!hasStock}
                        onClick={() => handleColorChange(color)}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          selected
                            ? "border-brand-primary bg-brand-primary text-brand-secondary"
                            : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-accent",
                          !hasStock && "cursor-not-allowed opacity-50"
                        )}
                        aria-pressed={selected}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* ── Size selector ──────────────────────────────────────────── */}
            {hasSizes && sizeOptions.length > 0 ? (
              <div className="mt-5">
                <Label className="mb-3">
                  {locale === "ar" ? "المقاس" : "Size"}
                  {selectedSize ? (
                    <span className="ms-2 font-normal text-brand-muted">— {selectedSize}</span>
                  ) : null}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((size) => {
                    const selected = size === selectedSize;
                    // stock for this specific color + size
                    const matchingVariant = variants.find(
                      (v) =>
                        (!selectedColor || getVariantColorName(v, locale) === selectedColor) &&
                        getVariantSizeName(v, locale) === size
                    );
                    const hasStock = matchingVariant ? isVariantInStock(matchingVariant) : false;
                    // price for this size
                    const sizePrice = matchingVariant ? getVariantPrice(matchingVariant) : null;
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!hasStock}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "relative flex min-w-[4rem] flex-col items-center rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                          selected
                            ? "border-brand-primary bg-brand-primary text-brand-secondary"
                            : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-accent",
                          !hasStock && "cursor-not-allowed opacity-50"
                        )}
                        aria-pressed={selected}
                      >
                        <span>{size}</span>
                        {sizePrice != null ? (
                          <span className={cn(
                            "mt-0.5 text-xs opacity-80",
                            selected ? "text-brand-secondary" : "text-brand-muted"
                          )}>
                            {new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
                              style: "currency",
                              currency: "EGP",
                              maximumFractionDigits: 0,
                            }).format(sizePrice)}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* ── Stock badge ────────────────────────────────────────────── */}
            <div className="mt-5">
              <p
                className={cn(
                  "text-sm font-medium",
                  inStock ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                )}
              >
                {inStock
                  ? locale === "ar" ? "متوفر" : "In stock"
                  : locale === "ar" ? "غير متوفر" : "Out of stock"}
              </p>
            </div>

            <Button
              type="button"
              variant="accent"
              size="lg"
              className="mt-8 w-full sm:w-auto"
              disabled={!inStock || !selectedVariantId}
              loading={adding || cartLoading}
              onClick={handleAddToCart}
            >
              {locale === "ar" ? "أضف إلى السلة" : "Add to Cart"}
            </Button>
          </div>
        </div>
      ) : null}
    </StoreLayout>
  );
}
