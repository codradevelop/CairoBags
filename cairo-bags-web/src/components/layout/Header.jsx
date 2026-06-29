import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "../ui/Button.jsx";
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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AnnouncementBar({ message, messageAr, href = "/shop", className }) {
  const { locale } = useLocale();
  const text = message || (locale === "ar" ? messageAr : messageAr) || "";
  if (!text) return null;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0 bg-brand-primary" />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background:
            "linear-gradient(105deg, transparent 30%, rgba(201,169,98,0.9) 50%, transparent 70%)",
          backgroundSize: "300% 100%",
          animation: "shimmer-gold 5s ease-in-out infinite",
        }}
      />
      <div className="cb-container relative">
        <Link
          to={href}
          className="flex min-h-9 items-center justify-center gap-3 px-4 py-2 text-center text-[10px] font-medium tracking-luxury uppercase transition-opacity hover:opacity-75 sm:text-[11px]"
          style={{ color: "#e8d5a3" }}
        >
          <span className="hidden h-px w-8 bg-gradient-to-r from-transparent to-brand-accent/70 sm:block" />
          {text}
          <span className="hidden h-px w-8 bg-gradient-to-l from-transparent to-brand-accent/70 sm:block" />
        </Link>
      </div>
    </div>
  );
}

export function Header({ className, showAnnouncement = false, announcement }) {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const searchPlaceholder = locale === "ar" ? "ابحث عن حقائب..." : "Search bags...";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      className={cn(
        "cb-header-floating cb-header-premium cb-glass transition-all duration-500",
        scrolled && "cb-header-scrolled cb-header-compact",
        className
      )}
      initial={reduceMotion ? false : { y: -8, opacity: 0 }}
      animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {showAnnouncement ? <AnnouncementBar {...announcement} /> : null}

      <div className="cb-container relative">
        <div className="cb-header-inner flex h-16 items-center justify-between gap-3 transition-all duration-500 md:h-[4.5rem] md:gap-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="cb-header-icon-btn shrink-0 lg:hidden"
              aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </Button>

            <Link to="/" className="cb-header-logo group shrink-0 sm:text-xl md:text-[1.35rem]">
              <span className="relative inline-block">
                Cairo Bags
                <span className="cb-header-logo-shine" aria-hidden="true" />
              </span>
            </Link>
          </div>

          <Navbar className="mx-2 flex-1 justify-center xl:mx-6" />

          <div className="cb-header-search-premium hidden max-w-xs flex-1 lg:block xl:max-w-sm">
            <ProductSearch compact variant="header" />
          </div>

          <div className="cb-header-actions shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="cb-header-icon-btn lg:hidden"
              aria-label={searchPlaceholder}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <SearchIcon />
            </Button>
            <LanguageSwitcher className="cb-header-lang hidden sm:inline-flex" />
            <NotificationDropdown />
            {!readOnly ? <WishlistHeaderButton className="cb-header-icon-btn" /> : null}
            {!readOnly ? <CartButton className="cb-header-icon-btn" /> : null}
            <UserDropdown className="cb-header-user" />
          </div>
        </div>

        <AnimatePresence>
          {searchOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="overflow-hidden border-t border-brand-border/40 lg:hidden"
            >
              <div className="py-3">
                <ProductSearch autoFocus variant="header" onSubmit={() => setSearchOpen(false)} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </motion.header>
  );
}
