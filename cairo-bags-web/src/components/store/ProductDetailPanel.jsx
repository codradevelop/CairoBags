import { memo, useMemo } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { ProductPrice } from "./ProductPrice.jsx";
import { ProductBadges } from "./ProductBadges.jsx";
import { AdminPreviewBadge } from "./AdminPreviewBanner.jsx";
import { ProductRatingLine } from "../reviews/ProductRatingLine.jsx";
import { QuantitySelector } from "../cart/QuantitySelector.jsx";
import { Button } from "../ui/Button.jsx";
import { getColorFromName, isLightSwatch } from "../../utils/colorSwatchUtils.js";
import {
  formatPrice,
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

  const colorSwatches = useMemo(() => {
    return colorOptions.map((color) => {
      const imageUrl = getVariantImageForColor(variants, color, locale, productImages);
      const hex = getColorFromName(color);
      return { color, imageUrl, hex, light: isLightSwatch(hex) };
    });
  }, [colorOptions, variants, locale, productImages]);

  const selectionParts = useMemo(() => {
    const parts = [];
    if (selectedColor) parts.push(selectedColor);
    if (hasSizes && selectedSize) parts.push(selectedSize);
    if (quantity > 1) {
      parts.push(
        locale === "ar" ? `×${quantity}` : `Qty ${quantity}`
      );
    }
    return parts;
  }, [selectedColor, selectedSize, hasSizes, quantity, locale]);

  const variantPrice = selectedVariant ? getVariantPrice(selectedVariant) : null;
  const variantCompare = selectedVariant ? getVariantComparePrice(selectedVariant) : null;
  const discount = getDiscountPercent(variantPrice, variantCompare);

  const optionLabels = {
    color: locale === "ar" ? "اللون" : "Color",
    size: locale === "ar" ? "المقاس" : "Size",
    quantity: locale === "ar" ? "الكمية" : "Quantity",
    yourSelection: locale === "ar" ? "اختيارك" : "Your selection",
    selectOptions: locale === "ar" ? "اختر اللون والمقاس" : "Select color & size",
    inStock: locale === "ar" ? "متوفر — جاهز للشحن" : "In stock — ready to ship",
    outOfStock: locale === "ar" ? "غير متوفر حالياً" : "Currently unavailable",
    maxQty: locale === "ar" ? "الحد الأقصى" : "Max",
  };

  const quantityDisabled = !selectedVariantId || !inStock || readOnly;

  return (
    <div className="cb-product-detail-panel">
      <header className="cb-product-detail-header">
        <div className="cb-product-detail-badges">
          <ProductBadges product={product} showStock={false} />
          <AdminPreviewBadge />
        </div>

        <h1 className="cb-product-detail-title">{productName}</h1>

        <ProductRatingLine
          product={product}
          size="sm"
          className="cb-product-detail-rating"
          onReviewsClick={onScrollToReviews}
        />
      </header>

      <div className="cb-product-detail-price-block" key={selectedVariantId ?? "range"}>
        <ProductPrice
          className="cb-product-detail-price"
          size="detail"
          price={variantPrice ?? undefined}
          comparePrice={variantCompare ?? undefined}
          product={!selectedVariant ? product : undefined}
        />
        {discount ? (
          <span className="cb-product-detail-save">
            {locale === "ar" ? `وفّر ${discount}%` : `Save ${discount}%`}
          </span>
        ) : null}
      </div>

      {description ? <p className="cb-product-detail-description">{description}</p> : null}

      <div className="cb-product-detail-purchase">
        {colorOptions.length > 0 ? (
          <div className="cb-product-detail-option">
            <div className="cb-product-detail-option-head">
              <span className="cb-product-detail-option-label">{optionLabels.color}</span>
              {selectedColor ? (
                <span className="cb-product-detail-option-value">{selectedColor}</span>
              ) : null}
            </div>
            <div className="cb-color-options" role="listbox" aria-label={optionLabels.color}>
              {colorSwatches.map(({ color, imageUrl, hex, light }) => {
                const selected = color === selectedColor;
                const colorInStock = variants
                  .filter((v) => getVariantColorName(v, locale) === color)
                  .some((v) => isVariantInStock(v));
                return (
                  <button
                    key={color}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    aria-label={color}
                    disabled={!colorInStock}
                    onClick={() => onColorChange(color)}
                    className={cn(
                      "cb-color-option",
                      selected && "cb-color-option-active",
                      !colorInStock && "cb-color-option-disabled"
                    )}
                    title={color}
                  >
                    <span
                      className={cn(
                        "cb-color-swatch",
                        light && "cb-color-swatch-light",
                        imageUrl && "cb-color-swatch-image"
                      )}
                      style={
                        imageUrl
                          ? { backgroundImage: `url(${imageUrl})` }
                          : { backgroundColor: hex }
                      }
                      aria-hidden="true"
                    />
                    <span className="cb-color-name">{color}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {hasSizes && sizeOptions.length > 0 ? (
          <div className="cb-product-detail-option">
            <div className="cb-product-detail-option-head">
              <span className="cb-product-detail-option-label">{optionLabels.size}</span>
              {selectedSize ? (
                <span className="cb-product-detail-option-value">{selectedSize}</span>
              ) : null}
            </div>
            <div className="cb-size-grid" role="listbox" aria-label={optionLabels.size}>
              {sizeOptions.map((size) => {
                const selected = size === selectedSize;
                const matchingVariant = variants.find(
                  (v) =>
                    (!selectedColor || getVariantColorName(v, locale) === selectedColor) &&
                    getVariantSizeName(v, locale) === size
                );
                const sizeInStock = matchingVariant ? isVariantInStock(matchingVariant) : false;
                const sizePrice = matchingVariant ? getVariantPrice(matchingVariant) : null;
                return (
                  <button
                    key={size}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    disabled={!sizeInStock}
                    onClick={() => onSizeChange(size)}
                    className={cn(
                      "cb-size-option",
                      selected && "cb-size-option-active",
                      !sizeInStock && "cb-size-option-disabled"
                    )}
                  >
                    <span className="cb-size-option-label">{size}</span>
                    {sizePrice != null ? (
                      <span className="cb-size-option-price">{formatPrice(sizePrice, locale)}</span>
                    ) : null}
                    {!sizeInStock ? (
                      <span className="cb-size-option-sold">
                        {locale === "ar" ? "نفد" : "Sold out"}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="cb-product-detail-option cb-product-detail-quantity-row">
          <div className="cb-product-detail-option-head">
            <span className="cb-product-detail-option-label">{optionLabels.quantity}</span>
            {maxQuantity > 0 && inStock ? (
              <span className="cb-product-detail-option-value">
                {optionLabels.maxQty}: {maxQuantity}
              </span>
            ) : null}
          </div>
          <QuantitySelector
            value={quantity}
            min={1}
            max={maxQuantity > 0 ? maxQuantity : 1}
            disabled={quantityDisabled}
            onChange={onQuantityChange}
            className="cb-product-detail-quantity"
          />
        </div>

        <div className="cb-product-detail-summary" aria-live="polite">
          <span className="cb-product-detail-summary-label">{optionLabels.yourSelection}</span>
          <span className="cb-product-detail-summary-value">
            {selectionParts.length > 0 ? selectionParts.join(" · ") : optionLabels.selectOptions}
          </span>
        </div>

        <div
          className={cn(
            "cb-product-detail-stock",
            inStock ? "cb-product-detail-stock--in" : "cb-product-detail-stock--out"
          )}
        >
          <span className="cb-product-detail-stock-dot" aria-hidden="true" />
          <span>{inStock ? optionLabels.inStock : optionLabels.outOfStock}</span>
        </div>

        {!readOnly ? (
          <div className="cb-product-detail-actions">
            <Button
              type="button"
              variant="accent"
              size="lg"
              className="cb-product-detail-btn cb-product-detail-btn-primary"
              disabled={!selectedVariantId || !inStock}
              loading={buying}
              onClick={onBuyNow}
            >
              {labels.buyNow}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="cb-product-detail-btn cb-product-detail-btn-secondary"
              disabled={!selectedVariantId || !inStock}
              loading={adding && !buying}
              onClick={onAddToCart}
            >
              {labels.addToCart}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
});
