import { useState } from "react";
import { Header } from "../components/layout/Header.jsx";
import { Footer } from "../components/layout/Footer.jsx";
import {
  AccountSidebar,
  AccountMobileNav,
} from "../components/layout/AccountSidebar.jsx";
import { Link } from "react-router-dom";
import { getAccountNavLinks, getNavLabel } from "../components/layout/navConfig.js";
import { useLocale } from "../components/layout/LanguageSwitcher.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "../components/ui/Button.jsx";
import { cn } from "../utils/cn.js";

function AccountDrawer({ open, onClose, activeKey }) {
  const { locale } = useLocale();
  const { isAdmin } = useAuth();
  const links = getAccountNavLinks(isAdmin);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-brand-primary/40 backdrop-blur-[2px]"
        aria-label={locale === "ar" ? "إغلاق" : "Close"}
        onClick={onClose}
      />
      <aside
        className="absolute inset-y-0 start-0 w-[min(100vw-3rem,18rem)] border-e border-brand-border bg-brand-surface shadow-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-brand-border px-4 py-4">
          <span className="font-display text-lg">{locale === "ar" ? "حسابي" : "My Account"}</span>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>
        <nav className="p-3">
          {links.map((link) => (
            <Link
              key={link.key}
              to={link.href}
              onClick={onClose}
              className={cn(
                "mb-1 block rounded-md px-3 py-3 text-sm font-medium",
                activeKey === link.key
                  ? "bg-brand-primary text-brand-secondary"
                  : "text-brand-text hover:bg-brand-secondary"
              )}
            >
              {getNavLabel(link, locale)}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}

export function AccountLayout({
  children,
  activeKey,
  title,
  className,
  contentClassName,
}) {
  const { locale } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className={cn("flex min-h-screen flex-col bg-brand-background", className)}>
      <Header />

      <div className="cb-container flex-1 py-6 md:py-10">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-muted">
              {locale === "ar" ? "الحساب" : "Account"}
            </p>
            {title ? <h1 className="font-display text-2xl font-medium text-brand-text">{title}</h1> : null}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
            {locale === "ar" ? "القائمة" : "Menu"}
          </Button>
        </div>

        <AccountMobileNav activeKey={activeKey} className="mb-6 hidden sm:flex lg:hidden" />

        <div className="flex gap-10">
          <AccountSidebar activeKey={activeKey} />
          <div className={cn("min-w-0 flex-1", contentClassName)}>
            {title ? (
              <h1 className="mb-6 hidden font-display text-3xl font-medium text-brand-text lg:block">
                {title}
              </h1>
            ) : null}
            {children}
          </div>
        </div>
      </div>

      <Footer />
      <AccountDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} activeKey={activeKey} />
    </div>
  );
}
