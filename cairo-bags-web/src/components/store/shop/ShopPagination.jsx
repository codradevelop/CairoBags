import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { cn } from "../../../utils/cn.js";

function buildPageList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push("ellipsis");
    result.push(sorted[i]);
  }
  return result;
}

export function ShopPagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  className,
}) {
  const { locale } = useLocale();
  const safeTotal = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotal);
  const pages = buildPageList(safePage, safeTotal);
  const atFirst = safePage <= 1;
  const atLast = safePage >= safeTotal;

  return (
    <nav
      className={cn("cb-shop-pagination", className)}
      aria-label={locale === "ar" ? "ترقيم الصفحات" : "Pagination"}
    >
      <button
        type="button"
        className="cb-shop-pagination-btn cb-shop-pagination-arrow"
        onClick={() => onPageChange?.(safePage - 1)}
        disabled={atFirst}
        aria-label={locale === "ar" ? "الصفحة السابقة" : "Previous page"}
      >
        {locale === "ar" ? "→" : "←"}
      </button>

      <ul className="cb-shop-pagination-pages">
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <li key={`e-${index}`} className="cb-shop-pagination-ellipsis" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                className={cn(
                  "cb-shop-pagination-btn",
                  item === safePage && "cb-shop-pagination-btn-active"
                )}
                onClick={() => onPageChange?.(item)}
                aria-current={item === safePage ? "page" : undefined}
                aria-label={
                  locale === "ar" ? `الصفحة ${item}` : `Page ${item}`
                }
              >
                {item}
              </button>
            </li>
          )
        )}
      </ul>

      <button
        type="button"
        className="cb-shop-pagination-btn cb-shop-pagination-arrow"
        onClick={() => onPageChange?.(safePage + 1)}
        disabled={atLast}
        aria-label={locale === "ar" ? "الصفحة التالية" : "Next page"}
      >
        {locale === "ar" ? "←" : "→"}
      </button>
    </nav>
  );
}
