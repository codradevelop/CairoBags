import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { cn } from "../../../utils/cn.js";

function GridIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.15 : 0} />
    </svg>
  );
}

function ListIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

const SORT_OPTIONS = {
  en: [
    { value: "featured", label: "Featured" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "name", label: "Name: A–Z" },
  ],
  ar: [
    { value: "featured", label: "مميز" },
    { value: "price-asc", label: "السعر: من الأقل" },
    { value: "price-desc", label: "السعر: من الأعلى" },
    { value: "name", label: "الاسم: أ–ي" },
  ],
};

export function ShopToolbar({
  displayedCount = 0,
  totalCount = 0,
  loading = false,
  sortValue = "featured",
  onSortChange,
  viewMode = "grid",
  onViewModeChange,
  activeCategoryName = "",
  className,
}) {
  const { locale } = useLocale();
  const options = locale === "ar" ? SORT_OPTIONS.ar : SORT_OPTIONS.en;
  const shown = loading ? "—" : String(displayedCount);
  const total = loading ? "—" : String(totalCount);

  return (
    <div className={cn("cb-shop-toolbar", className)}>
      <div>
        <p className="cb-shop-product-count">
          {locale === "ar"
            ? loading
              ? "جاري التحميل…"
              : `عرض ${shown} من ${total} منتج`
            : loading
              ? "Loading…"
              : `Showing ${shown} of ${total} products`}
        </p>
        {activeCategoryName ? (
          <p className="mt-1 text-sm text-[var(--shop-text-muted)]">
            {locale === "ar" ? `في ${activeCategoryName}` : `in ${activeCategoryName}`}
          </p>
        ) : null}
      </div>

      <div className="cb-shop-toolbar-controls">
        <label className="cb-shop-sort">
          <span className="cb-shop-sort-label">{locale === "ar" ? "ترتيب:" : "Sort by:"}</span>
          <select
            value={sortValue}
            onChange={(e) => onSortChange?.(e.target.value)}
            className="cb-shop-sort-select"
            aria-label={locale === "ar" ? "ترتيب المنتجات" : "Sort products"}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="cb-shop-view-toggle" role="group" aria-label={locale === "ar" ? "طريقة العرض" : "View mode"}>
          <button
            type="button"
            className={cn("cb-shop-view-btn", viewMode === "grid" && "cb-shop-view-btn-active")}
            onClick={() => onViewModeChange?.("grid")}
            aria-pressed={viewMode === "grid"}
            aria-label={locale === "ar" ? "عرض شبكي" : "Grid view"}
          >
            <GridIcon active={viewMode === "grid"} />
          </button>
          <button
            type="button"
            className={cn("cb-shop-view-btn", viewMode === "list" && "cb-shop-view-btn-active")}
            onClick={() => onViewModeChange?.("list")}
            aria-pressed={viewMode === "list"}
            aria-label={locale === "ar" ? "عرض قائمة" : "List view"}
          >
            <ListIcon active={viewMode === "list"} />
          </button>
        </div>
      </div>
    </div>
  );
}
