export { CatalogRealtimeProvider } from "./CatalogRealtimeContext.jsx";
export { AuthProvider, useAuth } from "./AuthContext.jsx";
export { CartProvider, useCart } from "./CartContext.jsx";
export { NotificationProvider, useNotifications } from "./NotificationContext.jsx";
export { LocaleProvider, useLocale } from "./LocaleContext.jsx";
export { WishlistProvider, useWishlist } from "./WishlistContext.jsx";
export { ProductRatingProvider, useProductRatings, useProductRating } from "./ProductRatingContext.jsx";

import { CatalogRealtimeProvider } from "./CatalogRealtimeContext.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import { CartProvider } from "./CartContext.jsx";
import { NotificationProvider } from "./NotificationContext.jsx";
import { LocaleProvider } from "./LocaleContext.jsx";
import { WishlistProvider } from "./WishlistContext.jsx";
import { ProductRatingProvider } from "./ProductRatingContext.jsx";
import { ToastProvider } from "../components/ui/Toast.jsx";

export function AppProviders({ children }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <CatalogRealtimeProvider>
          <ToastProvider>
            <ProductRatingProvider>
              <WishlistProvider>
                <CartProvider>
                  <NotificationProvider>{children}</NotificationProvider>
                </CartProvider>
              </WishlistProvider>
            </ProductRatingProvider>
          </ToastProvider>
        </CatalogRealtimeProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
