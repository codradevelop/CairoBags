export function isStoreNavLinkActive(link, { pathname, hash }) {
  if (link.key === "shop") {
    return pathname === "/shop" || pathname.startsWith("/shop/");
  }

  if (link.homeSection) {
    return pathname === "/" && hash === `#${link.homeSection}`;
  }

  if (link.href) {
    return pathname === link.href || pathname.startsWith(`${link.href}/`);
  }

  return false;
}
