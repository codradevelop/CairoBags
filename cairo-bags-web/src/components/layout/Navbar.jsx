import { motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn.js";
import { getNavLabel, storeNavLinks } from "./navConfig.js";
import { useLocale } from "./LanguageSwitcher.jsx";
import { getStoreNavHref, handleStoreNavClick } from "../../utils/homeNav.js";
import { isStoreNavLinkActive } from "../../utils/navActive.js";

export function Navbar({
  className,
  links = storeNavLinks,
  orientation = "horizontal",
  onNavigate,
}) {
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const isVertical = orientation === "vertical";

  return (
    <nav
      className={cn(
        isVertical
          ? "flex flex-col gap-1"
          : "cb-nav-cluster hidden items-center lg:flex",
        className
      )}
      aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}
    >
      {links.map((link, index) => {
        const active = isStoreNavLinkActive(link, location);
        const label = getNavLabel(link, locale);

        return (
          <motion.a
            key={link.key}
            href={getStoreNavHref(link, location.pathname)}
            className={cn(
              isVertical ? "cb-nav-link-mobile" : "cb-nav-link",
              active && (isVertical ? "cb-nav-link-mobile-active" : "cb-nav-link-active")
            )}
            initial={isVertical && !reduceMotion ? { opacity: 0, x: -12 } : false}
            animate={isVertical && !reduceMotion ? { opacity: 1, x: 0 } : undefined}
            transition={
              isVertical && !reduceMotion
                ? { delay: index * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] }
                : undefined
            }
            onClick={(event) => {
              if (link.key === "shop" || link.homeSection) {
                event.preventDefault();
                handleStoreNavClick(link, {
                  pathname: location.pathname,
                  navigate,
                  onDone: onNavigate,
                });
                return;
              }
              onNavigate?.();
            }}
          >
            {active && !isVertical ? (
              <motion.span
                layoutId="cb-nav-active-pill"
                className="cb-nav-active-pill"
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 34 }
                }
              />
            ) : null}
            <span className="cb-nav-link-text">{label}</span>
          </motion.a>
        );
      })}
    </nav>
  );
}
