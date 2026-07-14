import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { formatPrice, getProductComparePrice, getProductPriceRange } from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";

export function ProductPrice({
  product,
  price,
  comparePrice,
  className,
  size = "md",
}) {
  const { locale } = useLocale();
  const range = product ? getProductPriceRange(product) : null;
  const displayPrice = price ?? range?.low;
  const displayCompare =
    comparePrice ?? (product ? getProductComparePrice(product) : null);

  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
    detail: "cb-product-detail-price-value",
  };

  if (displayPrice == null) return null;

  const showRange = range?.low != null && range?.high != null && range.low !== range.high;
  const priceLabel = showRange
    ? `${formatPrice(range.low, locale)} – ${formatPrice(range.high, locale)}`
    : formatPrice(displayPrice, locale);

  const hasCompare = displayCompare != null && Number(displayCompare) > Number(displayPrice);

  return (
    <div className={cn("cb-product-price", size === "detail" && "cb-product-price--detail", className)}>
      <span className={cn("font-medium text-brand-primary", sizes[size])}>{priceLabel}</span>
      {hasCompare ? (
        <span className={cn("text-brand-muted line-through", size === "detail" ? "cb-product-detail-compare" : "text-sm")}>
          {formatPrice(displayCompare, locale)}
        </span>
      ) : null}
    </div>
  );
}
