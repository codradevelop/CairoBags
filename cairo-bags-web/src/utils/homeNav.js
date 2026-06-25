export function scrollToHomeSection(sectionId) {
  if (!sectionId) return;
  const element = document.getElementById(sectionId);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${sectionId}`);
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
