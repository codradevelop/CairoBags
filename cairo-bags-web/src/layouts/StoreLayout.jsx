import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import { ScrollToTop } from "../components/layout/ScrollToTop.jsx";
import { AdminPreviewBanner } from "../components/store/AdminPreviewBanner.jsx";
import { PageTransition } from "../components/ui/animation.jsx";
import { cn } from "../utils/cn.js";

export function StoreLayout({ children, className, contentClassName, fullWidth = false }) {
  const location = useLocation();

  return (
    <div className={cn("flex min-h-screen flex-col overflow-x-hidden bg-brand-background", className)}>
      <Header />
      <AdminPreviewBanner />
      <main className={cn("flex-1", contentClassName)}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {fullWidth ? children : <div className="cb-container-wide py-8 md:py-12">{children}</div>}
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
