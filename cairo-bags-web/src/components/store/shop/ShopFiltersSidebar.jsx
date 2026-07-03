import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { getCategoryId, getCategoryName } from "../../../utils/productHelpers.js";
import { getColorFromName } from "../../../utils/colorSwatchUtils.js";
import { cn } from "../../../utils/cn.js";

/* Fallback palette shown when no dynamic colors are loaded yet */
const FALLBACK_COLORS = [
  { en: "Black",  ar: "أسود",  key: "black"  },
  { en: "Brown",  ar: "بني",   key: "brown"  },
  { en: "Tan",    ar: "بيج",   key: "tan"    },
  { en: "Beige",  ar: "كريمي", key: "beige"  },
  { en: "White",  ar: "أبيض",  key: "white"  },
  { en: "Grey",   ar: "رمادي", key: "grey"   },
  { en: "Navy",   ar: "كحلي",  key: "navy"   },
  { en: "Green",  ar: "أخضر",  key: "green"  },
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
  availableColors = [],
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

  function toggleColor(colorKey) {
    update("color", filters.color === colorKey ? "" : colorKey);
  }

  return (
    <aside className={cn("cb-shop-filters", className)}>
      <div className="cb-shop-filters-header">
        <h2 className="cb-shop-filters-title">{locale === "ar" ? "تصفية" : "Filters"}</h2>
        <span className="text-brand-muted" aria-hidden="true">
          <FilterIcon />
        </span>
      </div>

      {/* ── Category ── */}
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

      {/* ── Price range ── */}
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

      {/* ── Color (dynamic from products, fallback to palette) ── */}
      {(() => {
        const colors = availableColors.length > 0 ? availableColors : FALLBACK_COLORS;
        return (
          <div className="cb-shop-filters-section">
            <div className="cb-shop-price-row">
              <h3 className="cb-shop-filters-section-title !mb-0">
                {locale === "ar" ? "اللون" : "Color"}
              </h3>
              {filters.color && (
                <button
                  type="button"
                  className="cb-shop-filters-clear"
                  onClick={() => update("color", "")}
                >
                  {locale === "ar" ? "مسح" : "Clear"}
                </button>
              )}
            </div>
            <div className="cb-shop-color-swatches" role="list" aria-label={locale === "ar" ? "الألوان" : "Colors"}>
              {colors.map(({ en, ar, key }) => {
                const label = locale === "ar" ? (ar || en) : (en || ar);
                const hex = getColorFromName(en || ar) || "#ccc";
                const selected = filters.color === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="listitem"
                    onClick={() => toggleColor(key)}
                    className={cn("cb-shop-color-swatch", selected && "cb-shop-color-swatch-active")}
                    style={{ backgroundColor: hex }}
                    aria-label={label}
                    aria-pressed={selected}
                    title={label}
                  />
                );
              })}
            </div>
            {filters.color && (
              <p className="cb-shop-color-selected-label">
                {locale === "ar" ? "اللون: " : "Color: "}
                <strong>
                  {colors.find(c => c.key === filters.color)?.[locale === "ar" ? "ar" : "en"] || filters.color}
                </strong>
              </p>
            )}
          </div>
        );
      })()}

      {/* ── In stock ── */}
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

      {/* ── Actions ── */}
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
