import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { AdminPreviewBanner } from "../components/store/AdminPreviewBanner.jsx";
import { cn } from "../utils/cn.js";

export function StoreLayout({ children, className, contentClassName, fullWidth = false }) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-brand-background", className)}>
      <Header />
      <AdminPreviewBanner />
      <main className={cn("flex-1", contentClassName)}>
        {fullWidth ? children : <div className="cb-container py-8 md:py-12">{children}</div>}
      </main>
      <Footer />
    </div>
  );
}
