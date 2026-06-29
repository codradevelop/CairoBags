import { Link } from "react-router-dom";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../ui/Toast.jsx";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { QuantitySelector } from "./QuantitySelector.jsx";
import {
  getCartItemAvailableStock,
  getCartItemColor,
  getCartItemImage,
  getCartItemLineTotal,
  getCartItemMaxQuantity,
  getCartItemName,
  getCartItemProductPath,
  getCartItemQuantity,
  getCartItemUnitPrice,
  getCartItemVariantId,
  hasStockWarning,
} from "../../utils/cartHelpers.js";
import { formatPrice } from "../../utils/productHelpers.js";
import { cn } from "../../utils/cn.js";

export function CartItem({ item, className, compact = false, onUpdated }) {
  const { locale } = useLocale();
  const { updateItem, removeItem, loading } = useCart();
  const { error: toastError } = useToast();

  const variantId = getCartItemVariantId(item);
  const name = getCartItemName(item, locale);
  const color = getCartItemColor(item, locale);
  const imageUrl = getCartItemImage(item);
  const quantity = getCartItemQuantity(item);
  const maxQty = getCartItemMaxQuantity(item);
  const stockWarning = hasStockWarning(item);
  const available = getCartItemAvailableStock(item);
  const productHref = getCartItemProductPath(item, locale);

  async function handleQuantityChange(nextQty) {
    try {
      await updateItem(variantId, { quantity: nextQty });
      onUpdated?.();
    } catch (err) {
      toastError(err.message);
    }
  }

  async function handleRemove() {
    try {
      await removeItem(variantId);
      onUpdated?.();
    } catch (err) {
      toastError(err.message);
    }
  }

  return (
    <article
      className={cn(
        "flex gap-4 border-b border-brand-border py-4 last:border-b-0",
        compact && "py-3",
        className
      )}
    >
      <Link
        to={productHref}
        className="h-24 w-20 shrink-0 overflow-hidden rounded-md border border-brand-border bg-brand-secondary sm:h-28 sm:w-24"
      >
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-brand-muted">CB</div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={productHref} className="font-medium text-brand-text hover:text-brand-accent">
              {name}
            </Link>
            {color ? <p className="mt-0.5 text-xs text-brand-muted">{color}</p> : null}
            <p className="mt-1 text-sm text-brand-muted">
              {formatPrice(getCartItemUnitPrice(item), locale)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-brand-muted hover:text-red-700"
            onClick={handleRemove}
            disabled={loading}
          >
            {locale === "ar" ? "حذف" : "Remove"}
          </Button>
        </div>

        {stockWarning ? (
          <Badge variant="warning" size="sm" className="mt-2">
            {(item?.stockChanged ?? item?.StockChanged) === true
              ? locale === "ar"
                ? "تغيّر مخزون هذا المنتج."
                : "This product stock has changed."
              : available <= 0
                ? locale === "ar"
                  ? "غير متوفر"
                  : "Out of stock"
                : locale === "ar"
                  ? `متوفر ${available} فقط`
                  : `Only ${available} available`}
          </Badge>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3">
          <QuantitySelector
            value={quantity}
            max={maxQty || undefined}
            onChange={handleQuantityChange}
            disabled={loading || available <= 0}
          />
          <p className="font-medium text-brand-primary">
            {formatPrice(getCartItemLineTotal(item), locale)}
          </p>
        </div>
      </div>
    </article>
  );
}
