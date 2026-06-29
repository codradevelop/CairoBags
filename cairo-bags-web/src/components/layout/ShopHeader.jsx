import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";
import { UserDropdown } from "./UserDropdown.jsx";
import { NotificationDropdown } from "./NotificationDropdown.jsx";
import { CartButton } from "./CartButton.jsx";
import { WishlistHeaderButton } from "./WishlistButton.jsx";
import { MobileMenu } from "./MobileMenu.jsx";
import { Navbar } from "./Navbar.jsx";
import { Button } from "../ui/Button.jsx";
import { useLocale } from "./LanguageSwitcher.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { filtersToSearchParams, parseShopFilters } from "../../utils/shopFilters.js";
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

function ShopHeaderSearch() {
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseShopFilters(searchParams);
  const placeholder =
    locale === "ar" ? "ابحث عن حقائب، مجموعات..." : "Search for bags, collections...";

  function handleSubmit(event) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    const next = { ...filters, searchTerm: query };
    setSearchParams(filtersToSearchParams(next));
  }

  return (
    <div className="cb-shop-header-search">
      <form onSubmit={handleSubmit} role="search">
        <div className="cb-shop-header-search-wrap">
          <span className="cb-shop-header-search-icon">
            <SearchIcon />
          </span>
          <input
            type="search"
            name="q"
            key={filters.searchTerm}
            defaultValue={filters.searchTerm}
            placeholder={placeholder}
            aria-label={placeholder}
            className="cb-shop-header-search-input"
          />
        </div>
      </form>
    </div>
  );
}

export function ShopHeader() {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();
  const reduceMotion = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setCompact(window.scrollY > 16);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      className={cn("cb-shop-header cb-header-premium", compact && "cb-shop-header-compact")}
      initial={reduceMotion ? false : { y: -8, opacity: 0 }}
      animate={reduceMotion ? undefined : { y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="cb-shop-header-main">
        <div className="cb-shop-header-row">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="cb-header-icon-btn lg:hidden"
            aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </Button>

          <Link to="/" className="cb-shop-logo cb-header-logo">
            Cairo Bags
          </Link>

          <Navbar className="cb-shop-nav-integrated" />

          <ShopHeaderSearch />

          <div className="cb-header-actions cb-shop-header-actions">
            <LanguageSwitcher className="cb-header-lang hidden sm:inline-flex" />
            <NotificationDropdown />
            {!readOnly ? <WishlistHeaderButton className="cb-header-icon-btn" /> : null}
            {!readOnly ? <CartButton className="cb-header-icon-btn" /> : null}
            <UserDropdown className="cb-header-user" />
          </div>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </motion.header>
  );
}
