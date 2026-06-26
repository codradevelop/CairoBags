import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import { getNavLabel, storeNavLinks } from "./navConfig.js";
import { useLocale } from "./LanguageSwitcher.jsx";
import { getStoreNavHref, handleStoreNavClick } from "../../utils/homeNav.js";

export function Navbar({ className, links = storeNavLinks, orientation = "horizontal" }) {
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className={cn(
        orientation === "horizontal"
          ? "hidden items-center gap-1 lg:flex xl:gap-2"
          : "flex flex-col gap-0.5",
        className
      )}
      aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}
    >
      {links.map((link) => (
        <a
          key={link.key}
          href={getStoreNavHref(link, location.pathname)}
          className={cn(
            "relative px-3 py-2 text-[13px] font-medium tracking-wide text-brand-text transition-colors duration-300",
            "hover:text-brand-accent",
            orientation === "horizontal" && "cb-underline-reveal",
            orientation === "vertical" && "rounded-lg px-3 py-2.5 hover:bg-brand-secondary/60"
          )}
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
          {getNavLabel(link, locale)}
        </a>
      ))}
    </nav>
  );
}
