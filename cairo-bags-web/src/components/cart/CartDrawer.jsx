import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { Button } from "../ui/Button.jsx";
import { CartItem } from "./CartItem.jsx";
import { CartSummary } from "./CartSummary.jsx";
import { EmptyCart } from "./EmptyCart.jsx";
import { getCartItems } from "../../utils/cartHelpers.js";
import { EASE_LUXURY } from "../ui/motion.jsx";
import { DURATION } from "../ui/animation.jsx";
import { cn } from "../../utils/cn.js";

export function CartDrawer({ open, onClose, className }) {
  const { cart, itemsCount, subTotal, loading } = useCart();
  const { isAuthenticated } = useAuth();
  const { locale } = useLocale();
  const prefersReduced = useReducedMotion();
  const items = getCartItems(cart);

  return (
    <AnimatePresence>
      {open ? (
        <div className={cn("fixed inset-0 z-50", className)} role="presentation">
          <motion.button
            type="button"
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_LUXURY }}
            className="absolute inset-0 bg-brand-primary/35 backdrop-blur-md"
            aria-label={locale === "ar" ? "إغلاق" : "Close"}
            onClick={onClose}
          />
          <motion.aside
            initial={prefersReduced ? false : { x: "100%" }}
            animate={{ x: 0 }}
            exit={prefersReduced ? undefined : { x: "100%" }}
            transition={{ duration: DURATION.slow, ease: EASE_LUXURY }}
            className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col border-s border-brand-border/70 bg-brand-surface/95 backdrop-blur-xl"
            style={{ boxShadow: "var(--cb-shadow-modal)" }}
            role="dialog"
            aria-modal="true"
            aria-label={locale === "ar" ? "سلة التسوق" : "Shopping bag"}
          >
            <div className="flex items-center justify-between border-b border-brand-border/70 px-4 py-4">
              <h2 className="font-display text-lg font-light">
                {locale === "ar" ? "سلة التسوق" : "Shopping Bag"}
                {itemsCount > 0 ? ` (${itemsCount})` : ""}
              </h2>
              <Button type="button" variant="ghost" size="icon" onClick={onClose}>
                ×
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 cb-scrollbar-thin">
              <motion.div
                initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DURATION.base, delay: 0.05, ease: EASE_LUXURY }}
              >
                {items.length === 0 ? (
                  <EmptyCart onContinue={onClose} />
                ) : (
                  items.map((item) => (
                    <CartItem
                      key={item.variantId ?? item.VariantId}
                      item={item}
                      compact
                    />
                  ))
                )}
              </motion.div>
            </div>

            {items.length > 0 ? (
              <div className="border-t border-brand-border/70 p-4">
                <CartSummary subTotal={subTotal} itemCount={itemsCount} className="mb-4 border-0 shadow-none" />
                <div className="flex flex-col gap-2">
                  <Link to="/cart" onClick={onClose}>
                    <Button variant="outline" className="w-full">
                      {locale === "ar" ? "عرض السلة" : "View Cart"}
                    </Button>
                  </Link>
                  <Link
                    to={isAuthenticated ? "/checkout" : "/login"}
                    state={isAuthenticated ? undefined : { from: "/checkout" }}
                    onClick={onClose}
                  >
                    <Button variant="accent" className="w-full" disabled={loading}>
                      {locale === "ar" ? "إتمام الشراء" : "Checkout"}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
