import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function shouldDeferScrollForHash({ pathname, hash }) {
  if (!hash) return false;
  if (pathname === "/") return true;
  if (pathname.startsWith("/products/") && hash === "#reviews") return true;
  if (/^\/account\/orders\/[^/]+$/.test(pathname) && hash === "#payment") return true;
  return false;
}

function scrollPageToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

/**
 * Scroll to top on route changes. Preserves intentional same-page hash scrolling
 * (home sections, product reviews, order payment) handled by page-level effects.
 */
export function ScrollRestoration() {
  const location = useLocation();
  const previousLocation = useRef(location);

  useEffect(() => {
    const previous = previousLocation.current;
    const pathnameChanged = previous.pathname !== location.pathname;
    const searchChanged = previous.search !== location.search;
    const hashOnlyChange =
      !pathnameChanged && !searchChanged && previous.hash !== location.hash;

    if (hashOnlyChange) {
      previousLocation.current = location;
      return;
    }

    if (pathnameChanged || searchChanged) {
      if (!shouldDeferScrollForHash(location)) {
        scrollPageToTop();
      }
    }

    previousLocation.current = location;
  }, [location]);

  return null;
}
