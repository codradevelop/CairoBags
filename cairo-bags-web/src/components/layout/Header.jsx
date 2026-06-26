import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  const text =
    message ||
    (locale === "ar"
      ? messageAr || "شحن مجاني للطلبات فوق ٢٠٠٠ جنيه — تسوق الآن"
      : "Complimentary shipping on orders over EGP 2,000 — Shop Now");

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

export function Header({ className, showAnnouncement = true, announcement }) {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();
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
    <header
      className={cn(
        "cb-header-floating cb-glass transition-all duration-500",
        scrolled && "cb-header-scrolled cb-header-compact",
        className
      )}
    >
      {showAnnouncement ? <AnnouncementBar {...announcement} /> : null}

      <div className="cb-container">
        <div className="cb-header-inner flex h-16 items-center justify-between gap-3 transition-all duration-500 md:h-[4.5rem] md:gap-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label={locale === "ar" ? "فتح القائمة" : "Open menu"}
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </Button>

            <Link
              to="/"
              className="group shrink-0 font-display text-lg font-medium tracking-tight text-brand-primary transition-colors duration-300 hover:text-brand-accent sm:text-xl md:text-[1.35rem]"
              style={{ letterSpacing: "-0.03em" }}
            >
              <span className="relative">
                Cairo Bags
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-brand-accent transition-all duration-500 group-hover:w-full" />
              </span>
            </Link>
          </div>

          <Navbar className="mx-2 hidden flex-1 justify-center lg:flex xl:mx-6" />

          <div className="hidden max-w-xs flex-1 lg:block xl:max-w-sm">
            <ProductSearch compact />
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={searchPlaceholder}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
            >
              <SearchIcon />
            </Button>
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <NotificationDropdown />
            {!readOnly ? <WishlistHeaderButton /> : null}
            {!readOnly ? <CartButton /> : null}
            <UserDropdown />
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
                <ProductSearch autoFocus onSubmit={() => setSearchOpen(false)} />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
