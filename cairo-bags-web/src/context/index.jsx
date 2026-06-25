export { AuthProvider, useAuth } from "./AuthContext.jsx";
export { CartProvider, useCart } from "./CartContext.jsx";
export { NotificationProvider, useNotifications } from "./NotificationContext.jsx";
export { LocaleProvider, useLocale } from "./LocaleContext.jsx";
export { WishlistProvider, useWishlist } from "./WishlistContext.jsx";

import { AuthProvider } from "./AuthContext.jsx";
import { CartProvider } from "./CartContext.jsx";
import { NotificationProvider } from "./NotificationContext.jsx";
import { LocaleProvider } from "./LocaleContext.jsx";
import { WishlistProvider } from "./WishlistContext.jsx";
import { ToastProvider } from "../components/ui/Toast.jsx";

export function AppProviders({ children }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <ToastProvider>
          <WishlistProvider>
            <CartProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </CartProvider>
          </WishlistProvider>
        </ToastProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
