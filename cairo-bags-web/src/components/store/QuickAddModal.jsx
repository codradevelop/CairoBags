import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/Button.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { ProductPrice } from "./ProductPrice.jsx";
import {
  getProductImageUrl,
  getProductName,
  getProductVariants,
  getVariantColorName,
  getVariantComparePrice,
  getVariantId,
  getVariantPrice,
  isVariantInStock,
} from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getVariantSizeName(variant, locale) {
  if (!variant) return "";
  return locale === "ar"
    ? variant.sizeNameAr ?? variant.SizeNameAr ?? variant.sizeNameEn ?? variant.SizeNameEn ?? ""
    : variant.sizeNameEn ?? variant.SizeNameEn ?? variant.sizeNameAr ?? variant.SizeNameAr ?? "";
}

function QuantityStepper({ value, onChange, min = 1, max = 99, disabled }) {
  return (
    <div className="inline-flex items-center rounded-lg border border-brand-border bg-brand-surface">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-10 w-10 items-center justify-center text-brand-text transition-colors hover:bg-brand-secondary disabled:opacity-40"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-[2.5rem] text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-10 w-10 items-center justify-center text-brand-text transition-colors hover:bg-brand-secondary disabled:opacity-40"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export function QuickAddModal({ open, product, onClose }) {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();
  const { addItem } = useCart();
  const { success, error: toastError } = useToast();

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const name = product ? getProductName(product, locale) : "";
  const imageUrl = product ? getProductImageUrl(product) : null;
  const variants = useMemo(() => (product ? getProductVariants(product) : []), [product]);

  const labels = useMemo(
    () => ({
      title: locale === "ar" ? "إضافة سريعة" : "Quick Add",
      color: locale === "ar" ? "اللون" : "Color",
      size: locale === "ar" ? "المقاس" : "Size",
      quantity: locale === "ar" ? "الكمية" : "Quantity",
      addToCart: locale === "ar" ? "أضف إلى السلة" : "Add to Cart",
      inStock: locale === "ar" ? "متوفر" : "In Stock",
      outOfStock: locale === "ar" ? "غير متوفر" : "Out of Stock",
      added: locale === "ar" ? "أُضيف إلى السلة" : "Added to cart",
      addFailed: locale === "ar" ? "فشل الإضافة" : "Could not add to cart",
      selectVariant: locale === "ar" ? "اختر المتغير" : "Select a variant",
    }),
    [locale]
  );

  // ── Derived data ──────────────────────────────────────────────────────────
  const colorOptions = useMemo(() => {
    const seen = new Set();
    return variants
      .map((v) => getVariantColorName(v, locale))
      .filter((c) => c && !seen.has(c) && seen.add(c));
  }, [variants, locale]);

  const hasSizes = useMemo(
    () => variants.some((v) => getVariantSizeName(v, locale) !== ""),
    [variants, locale]
  );

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

  const selectedVariant = useMemo(() => {
    return (
      variants.find((v) => {
        const colorMatch = !selectedColor || getVariantColorName(v, locale) === selectedColor;
        const sizeMatch = !hasSizes || !selectedSize || getVariantSizeName(v, locale) === selectedSize;
        return colorMatch && sizeMatch;
      }) ?? null
    );
  }, [variants, selectedColor, selectedSize, hasSizes, locale]);

  const inStock = selectedVariant ? isVariantInStock(selectedVariant) : false;
  const selectedVariantId = selectedVariant ? getVariantId(selectedVariant) : null;

  // ── Reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !product) return;
    // Pick best default: in-stock default → in-stock first → first
    const purchasable =
      variants.find((v) => isVariantInStock(v) && (v.isDefault ?? v.IsDefault)) ??
      variants.find((v) => isVariantInStock(v)) ??
      variants[0] ??
      null;

    if (purchasable) {
      setSelectedColor(getVariantColorName(purchasable, locale) || null);
      setSelectedSize(hasSizes ? getVariantSizeName(purchasable, locale) || null : null);
    } else {
      setSelectedColor(null);
      setSelectedSize(null);
    }
    setQuantity(1);
    setAdding(false);
  }, [open, product, variants, locale, hasSizes]);

  // When color changes reset size
  function handleColorChange(color) {
    setSelectedColor(color);
    if (hasSizes) {
      const firstForColor = variants.find(
        (v) => getVariantColorName(v, locale) === color && getVariantSizeName(v, locale) !== ""
      );
      setSelectedSize(firstForColor ? getVariantSizeName(firstForColor, locale) : null);
    }
  }

  // ── Keyboard close ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  // ── Add to cart ───────────────────────────────────────────────────────────
  async function handleAddToCart() {
    if (readOnly) return;
    if (!selectedVariantId) {
      toastError(labels.selectVariant);
      return;
    }
    if (!inStock) {
      toastError(labels.outOfStock);
      return;
    }

    setAdding(true);
    try {
      await addItem({ productVariantId: selectedVariantId, quantity });
      success(labels.added);
      onClose?.();
    } catch (err) {
      toastError(err.message || labels.addFailed);
    } finally {
      setAdding(false);
    }
  }

  if (!open || !product || readOnly) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="presentation">
      <div
        className="absolute inset-0 bg-brand-primary/45 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className={cn(
          "fixed z-[61] flex max-h-[92vh] w-full flex-col overflow-hidden border border-brand-border bg-brand-surface shadow-modal outline-none",
          "animate-slide-up motion-reduce:animate-none",
          "inset-x-0 bottom-0 rounded-t-[1.25rem]",
          "md:inset-auto md:left-1/2 md:top-1/2 md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.25rem]",
          "ease-out-expo"
        )}
        style={{ animationDuration: "420ms" }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4 md:px-6">
          <h2 id="quick-add-title" className="font-display text-lg font-medium text-brand-text md:text-xl">
            {labels.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-brand-muted transition-colors hover:bg-brand-secondary hover:text-brand-text"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 md:px-6">
          {/* Product info row */}
          <div className="flex gap-4">
            <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-brand-border bg-brand-secondary md:h-32 md:w-28">
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="h-full w-full object-cover object-center" />
              ) : (
                <div className="flex h-full items-center justify-center font-display text-brand-muted">CB</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-medium leading-snug text-brand-text md:text-lg">{name}</h3>
              <ProductPrice
                className="mt-2"
                size="sm"
                price={selectedVariant ? getVariantPrice(selectedVariant) : undefined}
                comparePrice={selectedVariant ? getVariantComparePrice(selectedVariant) : undefined}
                product={!selectedVariant ? product : undefined}
              />
              <p
                className={cn(
                  "mt-2 text-xs font-medium uppercase tracking-wide",
                  inStock ? "text-emerald-700" : "text-red-700"
                )}
              >
                {inStock ? labels.inStock : labels.outOfStock}
              </p>
            </div>
          </div>

          {/* ── Color selector ──────────────────────────────────────────── */}
          {colorOptions.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 text-xs font-medium tracking-[0.18em] text-brand-muted uppercase">
                {labels.color}
                {selectedColor ? <span className="ms-1 normal-case font-normal">— {selectedColor}</span> : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => {
                  const selected = color === selectedColor;
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
                        "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                        selected
                          ? "border-brand-primary bg-brand-primary text-brand-secondary shadow-sm"
                          : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-accent",
                        !hasStock && "cursor-not-allowed opacity-45"
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

          {/* ── Size selector ───────────────────────────────────────────── */}
          {hasSizes && sizeOptions.length > 0 ? (
            <div className="mt-5">
              <p className="mb-3 text-xs font-medium tracking-[0.18em] text-brand-muted uppercase">
                {labels.size}
                {selectedSize ? <span className="ms-1 normal-case font-normal">— {selectedSize}</span> : null}
              </p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => {
                  const selected = size === selectedSize;
                  const matchingVariant = variants.find(
                    (v) =>
                      (!selectedColor || getVariantColorName(v, locale) === selectedColor) &&
                      getVariantSizeName(v, locale) === size
                  );
                  const hasStock = matchingVariant ? isVariantInStock(matchingVariant) : false;
                  const sizePrice = matchingVariant ? getVariantPrice(matchingVariant) : null;
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!hasStock}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "flex min-w-[3.5rem] flex-col items-center rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200",
                        selected
                          ? "border-brand-primary bg-brand-primary text-brand-secondary shadow-sm"
                          : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-accent",
                        !hasStock && "cursor-not-allowed opacity-45"
                      )}
                      aria-pressed={selected}
                    >
                      <span>{size}</span>
                      {sizePrice != null ? (
                        <span className={cn("mt-0.5 text-xs opacity-75", selected ? "text-brand-secondary" : "text-brand-muted")}>
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

          {/* ── Quantity ─────────────────────────────────────────────────── */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-xs font-medium tracking-[0.18em] text-brand-muted uppercase">
              {labels.quantity}
            </p>
            <QuantityStepper value={quantity} onChange={setQuantity} disabled={adding || !inStock} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-brand-border px-5 py-4 md:px-6">
          <Button
            type="button"
            variant="accent"
            size="lg"
            className="w-full"
            loading={adding}
            disabled={adding || !inStock || !selectedVariantId}
            onClick={handleAddToCart}
          >
            {labels.addToCart}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
