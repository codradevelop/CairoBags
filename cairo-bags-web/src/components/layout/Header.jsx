import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "./Navbar.jsx";
import { MobileMenu } from "./MobileMenu.jsx";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";
import { UserDropdown } from "./UserDropdown.jsx";
import { NotificationDropdown } from "./NotificationDropdown.jsx";
import { CartButton } from "./CartButton.jsx";
import { WishlistHeaderButton } from "./WishlistButton.jsx";
import { ProductSearch } from "../store/ProductSearch.jsx";
import { useLocale } from "./LanguageSwitcher.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { cn } from "../../utils/cn.js";

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Header({ className }) {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();
  const headerRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [glowVisible, setGlowVisible] = useState(false);

  const searchPlaceholder = locale === "ar" ? "ابحث عن حقائب..." : "Search bags...";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onHeaderMouseMove = useCallback((e) => {
    const el = headerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--header-glow-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--header-glow-y", `${e.clientY - rect.top}px`);
    setGlowVisible(true);
  }, []);

  const onHeaderMouseLeave = useCallback(() => {
    setGlowVisible(false);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "cb-header-premium cb-header-floating",
          scrolled && "cb-header-scrolled",
          className
        )}
        onMouseMove={onHeaderMouseMove}
        onMouseLeave={onHeaderMouseLeave}
      >
      <div
        className={cn(
          "cb-header-premium__cursor-glow",
          glowVisible && "cb-header-premium__cursor-glow--visible"
        )}
        aria-hidden="true"
      />
      <div className="cb-header-premium__container">
        <div className="cb-header-premium__inner">
          <div className="cb-header-premium__left">
            <button
              type="button"
              className="cb-header-icon-btn cb-header-premium__menu-btn"
              aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </button>

            <Link to="/" className="cb-header-premium__brand-link">
              <span className="cb-header-premium__monogram" aria-hidden="true">
                CB
              </span>
              <span className="cb-header-premium__brand-name">Cairo Bags</span>
            </Link>
          </div>

          <Navbar className="cb-header-premium__nav" />

          <div className="cb-header-premium__search">
            <ProductSearch compact className="cb-header-search" />
          </div>

          <div className="cb-header-premium__actions">
            <button
              type="button"
              className="cb-header-icon-btn lg:hidden"
              aria-label={searchPlaceholder}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <SearchIcon />
            </button>
            <LanguageSwitcher
              unstyled
              className="cb-header-icon-btn cb-header-lang-btn hidden sm:inline-flex"
            />
            <NotificationDropdown triggerClassName="cb-header-icon-btn cb-header-icon-btn--notify" />
            {!readOnly ? <WishlistHeaderButton className="cb-header-icon-btn" /> : null}
            {!readOnly ? <CartButton className="cb-header-icon-btn" /> : null}
            <UserDropdown triggerClassName="cb-header-user-btn" />
          </div>
        </div>

        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="cb-header-premium__search-mobile lg:hidden"
            >
              <ProductSearch autoFocus className="cb-header-search" onSubmit={() => setSearchOpen(false)} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
    <div className="cb-header-premium__spacer" aria-hidden="true" />
    </>
  );
}
