import { Button } from "../ui/Button.jsx";
import { getNavLabel, adminNavLinks } from "./navConfig.js";
import { useLocale } from "./LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

const navIcons = {
  dashboard: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  categories: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h10M4 18h7" />
    </svg>
  ),
  products: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1z"/>
      <path d="M16 7V5a2 2 0 0 0-4 0v2"/>
    </svg>
  ),
  inventory: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 8h14M5 8a2 2 0 1 0-4 0 2 2 0 0 0 4 0zm14 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM3 8v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8M10 12h4"/>
    </svg>
  ),
  orders: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="M9 12h6M9 16h4"/>
    </svg>
  ),
  coupons: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6" />
      <path d="M4 9h16" />
      <path d="M9 3h6l1 6H8l1-6z" />
    </svg>
  ),
  newsletter: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  payments: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <path d="M1 10h22"/>
    </svg>
  ),
  settings: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </svg>
  ),
};

function ChevronIcon({ collapsed }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn("transition-transform duration-fast", collapsed && "rotate-180")}
    >
      <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminSidebar({
  className,
  activeKey,
  collapsed = false,
  onToggleCollapse,
  mobile = false,
}) {
  const { locale } = useLocale();

  return (
    <aside
      className={cn(
        "flex flex-col",
        mobile
          ? "h-full w-full"
          : "fixed inset-y-0 start-0 z-30 hidden h-svh lg:flex",
        !mobile && (collapsed ? "w-[4.5rem]" : "w-64"),
        className
      )}
      style={{ background: "#0d0d0b", borderInlineEnd: "1px solid rgba(255,255,255,0.07)" }}
      aria-label={locale === "ar" ? "قائمة الإدارة" : "Admin navigation"}
    >
      {/* Logo area */}
      <div
        className={cn(
          "flex items-center",
          collapsed ? "justify-center p-3" : "justify-between px-5 py-5"
        )}
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {!collapsed || mobile ? (
          <a
            href="/admin"
            className="font-display text-lg font-semibold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #c9a962 0%, #e8d5a3 50%, #a8853e 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {locale === "ar" ? "إدارة القاهرة" : "Cairo Admin"}
          </a>
        ) : (
          <span
            className="font-display text-base font-bold"
            style={{
              background: "linear-gradient(135deg, #c9a962, #e8d5a3)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            CB
          </span>
        )}
        {!mobile && onToggleCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/40 hover:bg-white/8 hover:text-white/80"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronIcon collapsed={collapsed} />
          </Button>
        ) : null}
      </div>

      {/* Gold divider */}
      <div
        style={{
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(201,169,98,0.3), transparent)",
        }}
      />

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-3 cb-scrollbar-thin">
        {!collapsed && !mobile && (
          <p
            className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {locale === "ar" ? "القائمة" : "Menu"}
          </p>
        )}
        <ul className="space-y-0.5">
          {adminNavLinks.map((link) => {
            const active = activeKey === link.key;
            const icon = navIcons[link.key];
            return (
              <li key={link.key}>
                <a
                  href={link.href}
                  title={collapsed && !mobile ? getNavLabel(link, locale) : undefined}
                  className={cn(
                    "flex items-center rounded-lg text-sm font-medium transition-all duration-fast",
                    collapsed && !mobile ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"
                  )}
                  style={
                    active
                      ? {
                          background: "linear-gradient(135deg, rgba(201,169,98,0.2) 0%, rgba(201,169,98,0.08) 100%)",
                          color: "#c9a962",
                          borderLeft: locale !== "ar" ? "2px solid #c9a962" : undefined,
                          borderRight: locale === "ar" ? "2px solid #c9a962" : undefined,
                        }
                      : {
                          color: "rgba(245,241,232,0.55)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "rgba(245,241,232,0.9)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "";
                      e.currentTarget.style.color = "rgba(245,241,232,0.55)";
                    }
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  {icon ? (
                    <span className="flex-shrink-0">{icon}</span>
                  ) : (
                    <span
                      className="flex h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: active ? "#c9a962" : "currentColor", opacity: 0.6 }}
                    />
                  )}
                  {(!collapsed || mobile) && (
                    <span>{getNavLabel(link, locale)}</span>
                  )}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div
        className={cn("p-4", collapsed && !mobile && "text-center")}
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <a
          href="/"
          className="flex items-center gap-2 text-xs transition-colors"
          style={{ color: "rgba(245,241,232,0.3)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#c9a962")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,241,232,0.3)")}
        >
          {collapsed && !mobile ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="m12 19-7-7 7-7M5 12h14" />
            </svg>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="m12 19-7-7 7-7M5 12h14" />
              </svg>
              <span>{locale === "ar" ? "العودة للمتجر" : "Back to Store"}</span>
            </>
          )}
        </a>
      </div>
    </aside>
  );
}

export function AdminTopbar({
  className,
  title,
  breadcrumbs,
  onOpenMobileNav,
  actions,
}) {
  const { locale } = useLocale();

  return (
    <div
      className={cn("sticky top-0 z-40 overflow-visible cb-glass", className)}
      style={{ borderBottom: "1px solid rgba(216,208,194,0.15)" }}
    >
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {onOpenMobileNav ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onOpenMobileNav}
              aria-label={locale === "ar" ? "فتح القائمة" : "Open navigation"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Button>
          ) : null}
          <div className="min-w-0">
            {breadcrumbs}
            {title ? (
              <h1
                className="truncate font-display text-xl font-medium text-brand-text"
                style={{ letterSpacing: "-0.02em" }}
              >
                {title}
              </h1>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
