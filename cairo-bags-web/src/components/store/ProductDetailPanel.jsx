import { memo, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { ProductPrice } from "./ProductPrice.jsx";
import { ProductBadges } from "./ProductBadges.jsx";
import { AdminPreviewBadge } from "./AdminPreviewBanner.jsx";
import { ProductRatingLine } from "../reviews/ProductRatingLine.jsx";
import { QuantitySelector } from "../cart/QuantitySelector.jsx";
import { Button } from "../ui/Button.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../ui/Toast.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { getColorFromName, isLightSwatch } from "../../utils/colorSwatchUtils.js";
import {
  formatPrice,
  getCategoryName,
  getProductId,
  getProductShortDescription,
  getVariantColorName,
  getVariantId,
  getVariantPrice,
  getVariantComparePrice,
  getVariantImageForColor,
  isVariantInStock,
} from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";

function getVariantSizeName(variant, locale) {
  if (!variant) return "";
  return locale === "ar"
    ? variant.sizeNameAr ?? variant.SizeNameAr ?? variant.sizeNameEn ?? variant.SizeNameEn ?? ""
    : variant.sizeNameEn ?? variant.SizeNameEn ?? variant.sizeNameAr ?? variant.SizeNameAr ?? "";
}

function getDiscountPercent(price, compare) {
  if (compare == null || price == null) return null;
  if (Number(compare) <= Number(price)) return null;
  return Math.round(((Number(compare) - Number(price)) / Number(compare)) * 100);
}

/* ── Feature bullets from short description ── */
function FeatureBullets({ text }) {
  if (!text) return null;
  const lines = text.split(/\n|•|·/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  return (
    <ul className="zpdp-bullets">
      {lines.map((line, i) => (
        <li key={i} className="zpdp-bullet">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="4 10 8 14 16 6" />
          </svg>
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Wishlist text-link ── */
function WishlistLink({ productId }) {
  const readOnly = useStoreReadOnly();
  if (readOnly) return null;
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { error: toastError } = useToast();
  const [pending, setPending] = useState(false);
  const active = isInWishlist(productId);

  async function handle(e) {
    e.preventDefault();
    if (!isAuthenticated) { navigate("/login", { state: { from: window.location.pathname } }); return; }
    setPending(true);
    try { await toggleWishlist(productId); }
    catch (err) { toastError(err.message || "Could not update wishlist"); }
    finally { setPending(false); }
  }

  return (
    <button type="button" onClick={handle} disabled={pending}
      className={cn("zpdp-meta-link", active && "zpdp-meta-link--active")} aria-pressed={active}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
      {active ? (locale === "ar" ? "في المفضلة" : "In wishlist") : (locale === "ar" ? "أضف للمفضلة" : "Add to wishlist")}
    </button>
  );
}

/* ── Main panel ── */
export const ProductDetailPanel = memo(function ProductDetailPanel({
  product,
  productName,
  description,
  productImages = [],
  variants,
  colorOptions,
  sizeOptions,
  hasSizes,
  selectedColor,
  selectedSize,
  selectedVariant,
  inStock,
  quantity,
  maxQuantity,
  readOnly,
  labels,
  adding,
  buying,
  onColorChange,
  onSizeChange,
  onQuantityChange,
  onScrollToReviews,
  onBuyNow,
  onAddToCart,
}) {
  const { locale } = useLocale();
  const selectedVariantId = selectedVariant ? getVariantId(selectedVariant) : null;
  const productId = getProductId(product);

  const categoryObj = product?.category ?? product?.Category;
  const categoryName = categoryObj ? getCategoryName(categoryObj, locale) : null;

  const colorSwatches = useMemo(() => colorOptions.map((color) => {
    const imageUrl = getVariantImageForColor(variants, color, locale, productImages);
    const hex = getColorFromName(color);
    return { color, imageUrl, hex, light: isLightSwatch(hex) };
  }), [colorOptions, variants, locale, productImages]);

  const variantPrice = selectedVariant ? getVariantPrice(selectedVariant) : null;
  const variantCompare = selectedVariant ? getVariantComparePrice(selectedVariant) : null;
  const discount = getDiscountPercent(variantPrice, variantCompare);

  const shortDesc = product ? getProductShortDescription(product, locale) : "";

  const t = {
    color: locale === "ar" ? "اللون" : "Color",
    size: locale === "ar" ? "المقاس" : "Size",
    inStock: locale === "ar" ? "متوفر" : "In stock",
    outOfStock: locale === "ar" ? "غير متوفر" : "Out of stock",
    category: locale === "ar" ? "الفئة" : "Category",
  };

  const qtyDisabled = !selectedVariantId || !inStock || readOnly;

  return (
    <div className="zpdp">

      {/* ══════════════════ HEADER BLOCK ══════════════════ */}
      <div className="zpdp-header">
        {/* brand / category */}
        {categoryName && <p className="zpdp-brand">{categoryName}</p>}

        {/* badges */}
        <div className="zpdp-badges">
          <ProductBadges product={product} showStock={false} />
          <AdminPreviewBadge />
        </div>

        {/* title */}
        <h1 className="zpdp-title">{productName}</h1>

        {/* rating */}
        <ProductRatingLine product={product} size="sm" className="zpdp-rating" onReviewsClick={onScrollToReviews} />

        {/* feature bullets */}
        <FeatureBullets text={shortDesc || description} />

        {/* price */}
        <div className="zpdp-price-row" key={selectedVariantId ?? "range"}>
          <ProductPrice
            size="detail"
            price={variantPrice ?? undefined}
            comparePrice={variantCompare ?? undefined}
            product={!selectedVariant ? product : undefined}
          />
          {discount && (
            <span className="zpdp-save">Save {discount}%</span>
          )}
        </div>

        {/* stock pill */}
        <div className={cn("zpdp-stock", inStock ? "zpdp-stock--in" : "zpdp-stock--out")}>
          {inStock ? t.inStock : t.outOfStock}
        </div>
      </div>

      {/* ══════════════════ COLOR ══════════════════ */}
      {colorOptions.length > 0 && (
        <div className="zpdp-section">
          <p className="zpdp-section-label">
            {t.color}
            {selectedColor && <span className="zpdp-section-val">{selectedColor}</span>}
          </p>
          <div className="cb-color-options" role="listbox" aria-label={t.color}>
            {colorSwatches.map(({ color, imageUrl, hex, light }) => {
              const selected = color === selectedColor;
              const colorInStock = variants
                .filter(v => getVariantColorName(v, locale) === color)
                .some(v => isVariantInStock(v));
              return (
                <button key={color} type="button" role="option" aria-selected={selected}
                  aria-label={color} disabled={!colorInStock} onClick={() => onColorChange(color)}
                  className={cn("cb-color-option", selected && "cb-color-option-active", !colorInStock && "cb-color-option-disabled")}
                  title={color}>
                  <span
                    className={cn("cb-color-swatch", light && "cb-color-swatch-light", imageUrl && "cb-color-swatch-image")}
                    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : { backgroundColor: hex }}
                    aria-hidden="true"
                  />
                  <span className="cb-color-name">{color}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════ SIZE ══════════════════ */}
      {hasSizes && sizeOptions.length > 0 && (
        <div className="zpdp-section">
          <p className="zpdp-section-label">
            {t.size}
            {selectedSize && <span className="zpdp-section-val">{selectedSize}</span>}
          </p>
          <div className="cb-size-grid" role="listbox" aria-label={t.size}>
            {sizeOptions.map((size) => {
              const selected = size === selectedSize;
              const mv = variants.find(v =>
                (!selectedColor || getVariantColorName(v, locale) === selectedColor) &&
                getVariantSizeName(v, locale) === size
              );
              const sizeInStock = mv ? isVariantInStock(mv) : false;
              const sizePrice = mv ? getVariantPrice(mv) : null;
              return (
                <button key={size} type="button" role="option" aria-selected={selected}
                  disabled={!sizeInStock} onClick={() => onSizeChange(size)}
                  className={cn("cb-size-option", selected && "cb-size-option-active", !sizeInStock && "cb-size-option-disabled")}>
                  <span className="cb-size-option-label">{size}</span>
                  {sizePrice != null && <span className="cb-size-option-price">{formatPrice(sizePrice, locale)}</span>}
                  {!sizeInStock && <span className="cb-size-option-sold">{locale === "ar" ? "نفد" : "Sold out"}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════ ACTION ROW ══════════════════ */}
      {!readOnly && (
        <div className="zpdp-action-row">
          <QuantitySelector
            value={quantity}
            min={1}
            max={maxQuantity > 0 ? maxQuantity : 1}
            disabled={qtyDisabled}
            onChange={onQuantityChange}
            className="zpdp-qty"
          />
          <Button type="button" variant="outline" size="lg"
            className="zpdp-btn zpdp-btn-cart"
            disabled={!selectedVariantId || !inStock}
            loading={adding && !buying}
            onClick={onAddToCart}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {labels.addToCart}
          </Button>
          <Button type="button" variant="accent" size="lg"
            className="zpdp-btn zpdp-btn-buy"
            disabled={!selectedVariantId || !inStock}
            loading={buying}
            onClick={onBuyNow}>
            {labels.buyNow}
          </Button>
        </div>
      )}

      {/* ══════════════════ WISHLIST LINK ══════════════════ */}
      {!readOnly && (
        <div className="zpdp-links">
          <WishlistLink productId={productId} />
        </div>
      )}

      {/* ══════════════════ META (category) ══════════════════ */}
      {categoryName && (
        <div className="zpdp-meta">
          <div className="zpdp-meta-row">
            <span className="zpdp-meta-key">{t.category}:</span>
            <span className="zpdp-meta-val zpdp-meta-link-text">{categoryName}</span>
          </div>
        </div>
      )}
    </div>
  );
});
