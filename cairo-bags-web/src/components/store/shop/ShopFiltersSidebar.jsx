import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { getCategoryId, getCategoryName } from "../../../utils/productHelpers.js";
import { cn } from "../../../utils/cn.js";

const COLOR_SWATCHES = [
  { id: "black", color: "#1b1b1b", label: "Black" },
  { id: "brown", color: "#5c4033", label: "Dark Brown" },
  { id: "tan", color: "#c4a574", label: "Tan" },
  { id: "cream", color: "#f0e6d6", label: "Cream" },
  { id: "white", color: "#ffffff", label: "White" },
];

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

export function ShopFiltersSidebar({
  categories = [],
  filters,
  onChange,
  onApply,
  onReset,
  className,
}) {
  const { locale } = useLocale();

  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function toggleCategory(categoryId) {
    update("categoryId", filters.categoryId === categoryId ? "" : categoryId);
  }

  return (
    <aside className={cn("cb-shop-filters", className)}>
      <div className="cb-shop-filters-header">
        <h2 className="cb-shop-filters-title">{locale === "ar" ? "تصفية" : "Filters"}</h2>
        <span className="text-brand-muted" aria-hidden="true">
          <FilterIcon />
        </span>
      </div>

      <div className="cb-shop-filters-section">
        <h3 className="cb-shop-filters-section-title">{locale === "ar" ? "التصنيف" : "Category"}</h3>
        <ul className="cb-shop-filters-list">
          <li>
            <label className="cb-shop-filter-option">
              <input
                type="checkbox"
                checked={!filters.categoryId}
                onChange={() => update("categoryId", "")}
                className="cb-shop-checkbox"
              />
              <span>{locale === "ar" ? "الكل" : "All"}</span>
            </label>
          </li>
          {categories.map((cat) => {
            const id = String(getCategoryId(cat));
            return (
              <li key={id}>
                <label className="cb-shop-filter-option">
                  <input
                    type="checkbox"
                    checked={filters.categoryId === id}
                    onChange={() => toggleCategory(id)}
                    className="cb-shop-checkbox"
                  />
                  <span>{getCategoryName(cat, locale)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="cb-shop-filters-section">
        <div className="cb-shop-price-row">
          <h3 className="cb-shop-filters-section-title !mb-0">
            {locale === "ar" ? "نطاق السعر" : "Price Range"}
          </h3>
          <button
            type="button"
            className="cb-shop-filters-clear"
            onClick={() => onChange({ ...filters, minPrice: "", maxPrice: "" })}
          >
            {locale === "ar" ? "مسح" : "Clear"}
          </button>
        </div>
        <div className="cb-shop-price-inputs">
          <input
            id="shop-filter-min"
            type="number"
            min="0"
            placeholder="EGP 0"
            value={filters.minPrice ?? ""}
            onChange={(e) => update("minPrice", e.target.value)}
            className="cb-shop-price-field"
            aria-label={locale === "ar" ? "أقل سعر" : "Min price"}
          />
          <input
            id="shop-filter-max"
            type="number"
            min="0"
            placeholder="EGP 20,000+"
            value={filters.maxPrice ?? ""}
            onChange={(e) => update("maxPrice", e.target.value)}
            className="cb-shop-price-field"
            aria-label={locale === "ar" ? "أعلى سعر" : "Max price"}
          />
        </div>
      </div>

      <div className="cb-shop-filters-section">
        <h3 className="cb-shop-filters-section-title">{locale === "ar" ? "اللون" : "Color"}</h3>
        <div className="cb-shop-color-swatches" role="list" aria-label={locale === "ar" ? "الألوان" : "Colors"}>
          {COLOR_SWATCHES.map((swatch, index) => (
            <button
              key={swatch.id}
              type="button"
              role="listitem"
              className={cn("cb-shop-color-swatch", index === 0 && "cb-shop-color-swatch-active")}
              style={{ backgroundColor: swatch.color }}
              aria-label={swatch.label}
              aria-pressed={index === 0}
            />
          ))}
          <button
            type="button"
            className="cb-shop-color-swatch flex items-center justify-center text-xs text-brand-muted"
            style={{ backgroundColor: "#f5f1eb" }}
            aria-label={locale === "ar" ? "المزيد" : "More colors"}
          >
            +
          </button>
        </div>
      </div>

      <div className="cb-shop-filters-section">
        <label className="cb-shop-filter-option">
          <input
            type="checkbox"
            checked={filters.inStock === true}
            onChange={(e) => update("inStock", e.target.checked ? true : "")}
            className="cb-shop-checkbox"
          />
          <span>{locale === "ar" ? "متوفر فقط" : "In stock only"}</span>
        </label>
      </div>

      <div className="cb-shop-filters-actions">
        <button type="button" className="cb-shop-btn-apply" onClick={onApply}>
          {locale === "ar" ? "تطبيق" : "Apply"}
        </button>
        <button type="button" className="cb-shop-btn-reset" onClick={onReset}>
          {locale === "ar" ? "إعادة" : "Reset"}
        </button>
      </div>
    </aside>
  );
}
