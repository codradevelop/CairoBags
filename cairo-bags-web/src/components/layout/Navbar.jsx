import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import { getNavLabel, storeNavLinks } from "./navConfig.js";
import { useLocale } from "./LanguageSwitcher.jsx";
import { getStoreNavHref, handleStoreNavClick } from "../../utils/homeNav.js";

function isNavLinkActive(link, { pathname, hash }) {
  if (link.key === "shop") {
    return pathname === "/shop" || pathname.startsWith("/shop/");
  }
  if (link.homeSection) {
    if (pathname !== "/") return false;
    const section = hash.replace("#", "");
    return section === link.homeSection;
  }
  if (link.href) {
    return pathname === link.href;
  }
  return false;
}

function handleMagneticMove(event) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const offsetX = event.clientX - rect.left - rect.width / 2;
  const offsetY = event.clientY - rect.top - rect.height / 2;
  el.style.setProperty("--mx", `${Math.max(-4, Math.min(4, offsetX * 0.18))}px`);
  el.style.setProperty("--my", `${Math.max(-3, Math.min(3, offsetY * 0.18))}px`);
}

function handleMagneticLeave(event) {
  const el = event.currentTarget;
  el.style.setProperty("--mx", "0px");
  el.style.setProperty("--my", "0px");
}

export function Navbar({ className, links = storeNavLinks, orientation = "horizontal" }) {
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className={cn(
        orientation === "horizontal" ? "items-center" : "flex flex-col gap-0.5",
        className
      )}
      aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}
    >
      {links.map((link) => {
        const active = isNavLinkActive(link, {
          pathname: location.pathname,
          hash: location.hash,
        });

        return (
          <a
            key={link.key}
            href={getStoreNavHref(link, location.pathname)}
            className={cn(
              orientation === "horizontal" ? "cb-nav-link" : "rounded-lg px-3 py-2.5 hover:bg-brand-secondary/60",
              orientation === "horizontal" && active && "cb-nav-link--active",
              orientation === "vertical" &&
                "relative px-3 py-2 text-[13px] font-medium tracking-wide text-brand-text transition-colors duration-300 hover:text-brand-accent"
            )}
            aria-current={active ? "page" : undefined}
            onMouseMove={orientation === "horizontal" ? handleMagneticMove : undefined}
            onMouseLeave={orientation === "horizontal" ? handleMagneticLeave : undefined}
            onClick={(event) => {
              if (link.key === "shop" || link.homeSection) {
                event.preventDefault();
                handleStoreNavClick(link, {
                  pathname: location.pathname,
                  navigate,
                });
              }
            }}
          >
            {orientation === "horizontal" ? (
              <>
                <span className="cb-nav-link__glow" aria-hidden="true" />
                <span className="cb-nav-link__label">{getNavLabel(link, locale)}</span>
                <span className="cb-nav-link__line" aria-hidden="true" />
              </>
            ) : (
              getNavLabel(link, locale)
            )}
          </a>
        );
      })}
    </nav>
  );
}
