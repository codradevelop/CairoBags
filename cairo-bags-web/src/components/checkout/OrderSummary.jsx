import { useCart } from "../../context/CartContext.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { CartItem } from "../cart/CartItem.jsx";
import { CartSummary } from "../cart/CartSummary.jsx";
import { getCartItems } from "../../utils/cartHelpers.js";
import { cn } from "../../utils/cn.js";

export function OrderSummary({
  className,
  subTotal,
  shippingFee,
  discountAmount,
  totalAmount,
  couponCode,
  showItems = true,
  showEstimateNote = false,
}) {
  const { cart, itemsCount, subTotal: cartSubTotal } = useCart();
  const { locale } = useLocale();
  const items = getCartItems(cart);

  return (
    <div className={cn("space-y-4", className)}>
      {showItems && items.length > 0 ? (
        <div className="rounded-lg border border-brand-border bg-brand-surface p-4">
          <h3 className="mb-3 font-display text-lg font-medium text-brand-text">
            {locale === "ar" ? "المنتجات" : "Items"}
          </h3>
          {items.map((item) => (
            <CartItem key={item.variantId ?? item.VariantId} item={item} compact />
          ))}
        </div>
      ) : null}

      <CartSummary
        subTotal={subTotal ?? cartSubTotal}
        shippingFee={shippingFee}
        discountAmount={discountAmount}
        totalAmount={totalAmount}
        itemCount={itemsCount}
        showEstimateNote={showEstimateNote}
        couponCode={couponCode}
      />
    </div>
  );
}
