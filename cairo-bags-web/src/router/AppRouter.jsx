import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { AdminRoute } from "./AdminRoute.jsx";
import { AdminShoppingBlockRoute } from "./AdminShoppingBlockRoute.jsx";
import { GuestRoute } from "./GuestRoute.jsx";
import { HomePage } from "../pages/store/HomePage.jsx";
import { ShopPage } from "../pages/store/ShopPage.jsx";
import { CategoryPage } from "../pages/store/CategoryPage.jsx";
import { ProductDetailsPage } from "../pages/store/ProductDetailsPage.jsx";
import { SearchResultsPage } from "../pages/store/SearchResultsPage.jsx";
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { RegisterPage } from "../pages/auth/RegisterPage.jsx";
import { ForgotPasswordPage } from "../pages/auth/ForgotPasswordPage.jsx";
import { AccountDashboardPage } from "../pages/account/AccountDashboardPage.jsx";
import { ProfilePage } from "../pages/account/ProfilePage.jsx";
import { OrdersPage } from "../pages/account/OrdersPage.jsx";
import { OrderDetailsPage } from "../pages/account/OrderDetailsPage.jsx";
import { NotificationsPage } from "../pages/account/NotificationsPage.jsx";
import { DashboardPage } from "../pages/admin/DashboardPage.jsx";
import { ProductsPage } from "../pages/admin/ProductsPage.jsx";
import { ProductFormPage } from "../pages/admin/ProductFormPage.jsx";
import { CategoriesPage } from "../pages/admin/CategoriesPage.jsx";
import { CategoryFormPage } from "../pages/admin/CategoryFormPage.jsx";
import { OrdersPage as AdminOrdersPage } from "../pages/admin/OrdersPage.jsx";
import { OrderDetailsPage as AdminOrderDetailsPage } from "../pages/admin/OrderDetailsPage.jsx";
import { InventoryPage } from "../pages/admin/InventoryPage.jsx";
import { PaymentsPage } from "../pages/admin/PaymentsPage.jsx";
import { SettingsPage } from "../pages/admin/SettingsPage.jsx";
import { CartPage } from "../pages/cart/CartPage.jsx";
import { CheckoutPage } from "../pages/checkout/CheckoutPage.jsx";
import { OrderSuccessPage } from "../pages/checkout/OrderSuccessPage.jsx";
import { PaymentUploadPage } from "../pages/checkout/PaymentUploadPage.jsx";
import { WishlistPage } from "../pages/store/WishlistPage.jsx";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/categories/:slug" element={<CategoryPage />} />
      <Route path="/products/:slug" element={<ProductDetailsPage />} />
      <Route path="/search" element={<SearchResultsPage />} />

      <Route element={<AdminShoppingBlockRoute />}>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/payment" element={<Navigate to="/admin" replace />} />
        <Route path="/payment/*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminShoppingBlockRoute />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<OrderSuccessPage />} />
          <Route path="/checkout/payment/:orderId" element={<PaymentUploadPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Route>
        <Route path="/account" element={<AccountDashboardPage />} />
        <Route path="/account/profile" element={<ProfilePage />} />
        <Route path="/account/orders" element={<OrdersPage />} />
        <Route path="/account/orders/:id" element={<OrderDetailsPage />} />
        <Route path="/account/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<DashboardPage />} />
        <Route path="/admin/products" element={<ProductsPage />} />
        <Route path="/admin/products/new" element={<ProductFormPage />} />
        <Route path="/admin/products/:id/edit" element={<ProductFormPage />} />
        <Route path="/admin/categories" element={<CategoriesPage />} />
        <Route path="/admin/categories/new" element={<CategoryFormPage />} />
        <Route path="/admin/categories/:id/edit" element={<CategoryFormPage />} />
        <Route path="/admin/orders" element={<AdminOrdersPage />} />
        <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
        <Route path="/admin/inventory" element={<InventoryPage />} />
        <Route path="/admin/payments" element={<PaymentsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
