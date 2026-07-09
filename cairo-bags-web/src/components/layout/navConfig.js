/** Static navigation labels for layout shells (no routing). */
export const storeNavLinks = [
  { key: "shop", href: "/shop", labelEn: "Shop", labelAr: "تسوق" },
  {
    key: "categories",
    homeSection: "categories",
    labelEn: "Categories",
    labelAr: "التصنيفات",
  },
  {
    key: "featured",
    homeSection: "features",
    labelEn: "Featured",
    labelAr: "مميز",
  },
  {
    key: "new",
    homeSection: "new-arrivals",
    labelEn: "New Arrivals",
    labelAr: "وصل حديثاً",
  },
];

export const accountNavLinks = [
  { key: "overview", href: "/account", labelEn: "Overview", labelAr: "نظرة عامة" },
  { key: "profile", href: "/account/profile", labelEn: "Profile", labelAr: "الملف الشخصي" },
  { key: "orders", href: "/account/orders", labelEn: "My Orders", labelAr: "طلباتي" },
  { key: "notifications", href: "/account/notifications", labelEn: "Notifications", labelAr: "الإشعارات" },
];

export function getAccountNavLinks(isAdmin = false) {
  if (!isAdmin) return accountNavLinks;
  return accountNavLinks.filter((link) => link.key !== "orders");
}

export const adminNavLinks = [
  { key: "dashboard", href: "/admin", labelEn: "Dashboard", labelAr: "لوحة التحكم" },
  { key: "categories", href: "/admin/categories", labelEn: "Categories", labelAr: "التصنيفات" },
  { key: "products", href: "/admin/products", labelEn: "Products", labelAr: "المنتجات" },
  { key: "inventory", href: "/admin/inventory", labelEn: "Inventory", labelAr: "المخزون" },
  { key: "orders", href: "/admin/orders", labelEn: "Orders", labelAr: "الطلبات" },
  { key: "coupons", href: "/admin/coupons", labelEn: "Coupons", labelAr: "أكواد الخصم" },
  { key: "newsletter", href: "/admin/newsletter", labelEn: "Newsletter", labelAr: "النشرة البريدية" },
  { key: "payments", href: "/admin/payments", labelEn: "Payments", labelAr: "المدفوعات" },
  { key: "settings", href: "/admin/settings", labelEn: "Settings", labelAr: "الإعدادات" },
];

export function getNavLabel(link, locale = "en") {
  return locale === "ar" ? link.labelAr : link.labelEn;
}
