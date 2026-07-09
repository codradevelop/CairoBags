const HEADER_SCROLL_GAP = 12;
const CENTER_SECTIONS = new Set(["categories"]);

function getHeaderOffset() {
  const header = document.querySelector(".cb-header-premium");
  if (header) {
    return Math.ceil(header.getBoundingClientRect().height) + HEADER_SCROLL_GAP;
  }

  const raw = getComputedStyle(document.documentElement).getPropertyValue("--cb-header-height").trim();
  const parsed = Number.parseFloat(raw);
  return (Number.isFinite(parsed) ? parsed : 80) + HEADER_SCROLL_GAP;
}

function measureSection(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    height: rect.height,
  };
}

export function scrollToHomeSection(sectionId, options = {}) {
  if (!sectionId) return;

  const element = document.getElementById(sectionId);
  if (!element) return;

  const scroll = () => {
    const headerOffset = getHeaderOffset();
    const viewportH = window.innerHeight;
    const { top: sectionTop, height: sectionHeight } = measureSection(element);
    const available = Math.max(0, viewportH - headerOffset);
    const useCenter =
      options.block === "center" ||
      (options.block !== "start" && CENTER_SECTIONS.has(sectionId));

    let targetTop;
    if (useCenter) {
      const verticalPad = Math.max(0, (available - sectionHeight) / 2);
      targetTop = sectionTop - headerOffset - verticalPad;
    } else {
      targetTop = sectionTop - headerOffset;
    }

    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: options.behavior ?? "smooth",
    });
    window.history.replaceState(null, "", `#${sectionId}`);
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(scroll);
  });
}

export function handleStoreNavClick(link, { pathname, navigate, onDone }) {
  if (link.key === "shop") {
    navigate("/shop");
    onDone?.();
    return;
  }

  if (link.homeSection) {
    onDone?.();
    if (pathname === "/") {
      scrollToHomeSection(link.homeSection);
    } else {
      navigate(`/#${link.homeSection}`);
    }
    return;
  }

  if (link.href) {
    navigate(link.href);
    onDone?.();
  }
}

export function getStoreNavHref(link, pathname) {
  if (link.key === "shop") return "/shop";
  if (link.homeSection) {
    return pathname === "/" ? `#${link.homeSection}` : `/#${link.homeSection}`;
  }
  return link.href ?? "/";
}
