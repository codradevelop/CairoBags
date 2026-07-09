import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { Navbar } from "./Navbar.jsx";
import { useLocale } from "./LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MobileMenu({ open, onClose, links }) {
  const { locale } = useLocale();

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const searchPlaceholder = locale === "ar" ? "ابحث عن حقائب..." : "Search bags...";

  return (
    <AnimatePresence>
      {open ? (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      {/* Backdrop */}
      <motion.button
        type="button"
        className="absolute inset-0 backdrop-blur-[3px]"
        style={{ background: "rgba(17,17,17,0.6)" }}
        aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* Panel — glassmorphism */}
      <motion.aside
        className={cn(
          "absolute inset-y-0 start-0 flex w-[min(100vw-3rem,22rem)] flex-col",
          "cb-glass-card shadow-modal",
        )}
        style={{
          background: "var(--cb-glass-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderInlineEnd: "1px solid var(--cb-glass-border)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={locale === "ar" ? "قائمة الجوال" : "Mobile menu"}
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--cb-glass-border)" }}
        >
          <span className="cb-text-gradient-gold font-display text-lg font-semibold">
            Cairo Bags
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full"
          >
            <CloseIcon />
          </Button>
        </div>

        {/* Search */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--cb-glass-border)" }}>
          <Input
            type="search"
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 cb-scrollbar-thin">
          <Navbar orientation="vertical" links={links} onNavigate={onClose} />
        </nav>

        {/* Footer accent */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--cb-glass-border)" }}>
          <div className="cb-gold-line" />
          <p className="mt-3 text-xs" style={{ color: "rgba(102,102,102,0.7)" }}>
            {locale === "ar" ? "حقائب فاخرة • تصميم مصري" : "Luxury Bags • Egyptian Craft"}
          </p>
        </div>
      </motion.aside>
    </div>
      ) : null}
    </AnimatePresence>
  );
}
