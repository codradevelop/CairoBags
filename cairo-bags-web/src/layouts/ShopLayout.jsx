import { ShopHeader } from "../components/layout/ShopHeader.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { AdminPreviewBanner } from "../components/store/AdminPreviewBanner.jsx";
import { ScrollToTop } from "../components/layout/ScrollToTop.jsx";

export function ShopLayout({ children }) {
  return (
    <div className="cb-shop-page flex min-h-screen flex-col">
      <ShopHeader />
      <AdminPreviewBanner />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
