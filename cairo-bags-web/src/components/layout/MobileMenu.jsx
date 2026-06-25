import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { Navbar } from "./Navbar.jsx";
import { getNavLabel, storeNavLinks } from "./navConfig.js";
import { useLocale } from "./LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";
import { getStoreNavHref, handleStoreNavClick } from "../../utils/homeNav.js";

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function MobileMenu({ open, onClose, links = storeNavLinks }) {
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();

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

  if (!open) return null;

  const searchPlaceholder = locale === "ar" ? "ابحث عن حقائب..." : "Search bags...";

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 backdrop-blur-[3px]"
        style={{ background: "rgba(17,17,17,0.6)" }}
        aria-label={locale === "ar" ? "إغلاق القائمة" : "Close menu"}
        onClick={onClose}
      />

      {/* Panel — glassmorphism */}
      <aside
        className={cn(
          "absolute inset-y-0 start-0 flex w-[min(100vw-3rem,22rem)] flex-col",
          "animate-slide-in-left cb-glass-card shadow-modal",
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
          <ul className="space-y-0.5">
            {links.map((link) => (
              <li key={link.key}>
                <a
                  href={getStoreNavHref(link, location.pathname)}
                  className="group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-brand-text transition-all duration-fast hover:bg-brand-accent/8 hover:text-brand-accent"
                  onClick={(event) => {
                    if (link.key === "shop" || link.homeSection) {
                      event.preventDefault();
                      handleStoreNavClick(link, {
                        pathname: location.pathname,
                        navigate,
                        onDone: onClose,
                      });
                      return;
                    }
                    onClose();
                  }}
                >
                  {/* Gold bullet dot */}
                  <span
                    className="h-1 w-1 rounded-full flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ background: "#c9a962" }}
                  />
                  {getNavLabel(link, locale)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer accent */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--cb-glass-border)" }}>
          <div className="cb-gold-line" />
          <p className="mt-3 text-xs" style={{ color: "rgba(102,102,102,0.7)" }}>
            {locale === "ar" ? "حقائب فاخرة • تصميم مصري" : "Luxury Bags • Egyptian Craft"}
          </p>
        </div>
      </aside>
    </div>
  );
}
