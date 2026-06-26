import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LanguageSwitcher } from "./LanguageSwitcher.jsx";
import { UserDropdown } from "./UserDropdown.jsx";
import { NotificationDropdown } from "./NotificationDropdown.jsx";
import { CartButton } from "./CartButton.jsx";
import { WishlistHeaderButton } from "./WishlistButton.jsx";
import { MobileMenu } from "./MobileMenu.jsx";
import { Button } from "../ui/Button.jsx";
import { useLocale } from "./LanguageSwitcher.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { storeNavLinks, getNavLabel } from "./navConfig.js";
import { getStoreNavHref, handleStoreNavClick } from "../../utils/homeNav.js";
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
  const location = useLocation();
  const navigate = useNavigate();
  const readOnly = useStoreReadOnly();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  const announcement =
    locale === "ar"
      ? "✧ شحن مجاني للطلبات فوق ٢٠٠٠ جنيه ✧"
      : "✧ COMPLIMENTARY SHIPPING ON ORDERS OVER EGP 2,000 ✧";

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
    <header className={cn("cb-shop-header", compact && "cb-shop-header-compact")}>
      <div className="cb-shop-announcement">{announcement}</div>

      <div className="cb-shop-header-main">
        <div className="cb-shop-header-row">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </Button>

          <Link to="/" className="cb-shop-logo">
            Cairo Bags
          </Link>

          <nav className="cb-shop-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
            {storeNavLinks.map((link) => {
              const isShop = link.key === "shop";
              const active = isShop && location.pathname === "/shop";
              return (
                <a
                  key={link.key}
                  href={getStoreNavHref(link, location.pathname)}
                  className={cn("cb-shop-nav-link", active && "cb-shop-nav-link-active")}
                  onClick={(event) => {
                    if (link.key === "shop" || link.homeSection) {
                      event.preventDefault();
                      handleStoreNavClick(link, { pathname: location.pathname, navigate });
                    }
                  }}
                >
                  {getNavLabel(link, locale)}
                </a>
              );
            })}
          </nav>

          <ShopHeaderSearch />

          <div className="cb-shop-header-actions">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <NotificationDropdown />
            {!readOnly ? <WishlistHeaderButton /> : null}
            {!readOnly ? <CartButton /> : null}
            <UserDropdown />
          </div>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
