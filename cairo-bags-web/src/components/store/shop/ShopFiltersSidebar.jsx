import { useMemo } from "react";
import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { getCategoryId, getCategoryName } from "../../../utils/productHelpers.js";
import { getColorFromName, isLightSwatch } from "../../../utils/colorSwatchUtils.js";
import { cn } from "../../../utils/cn.js";

function formatColorLabel(color, locale) {
  return locale === "ar" ? (color.nameAr || color.name) : (color.name || color.nameAr);
}

function formatColorCountLabel(count, locale) {
  if (locale === "ar") {
    return `${count} ${count === 1 ? "منتج" : "منتجات"}`;
  }
  return `${count} ${count === 1 ? "Product" : "Products"}`;
}

function formatUnavailableLabel(locale) {
  return locale === "ar" ? "غير متاح حالياً" : "Currently unavailable";
}

function formatColorAriaLabel(color, locale) {
  const label = formatColorLabel(color, locale);
  const inStockCount = color.inStockCount ?? 0;
  const available = inStockCount > 0;
  if (locale === "ar") {
    if (!available) return `${label}، ${formatUnavailableLabel(locale)}`;
    return `${label}، ${inStockCount} ${inStockCount === 1 ? "منتج" : "منتجات"}`;
  }
  if (!available) return `${label}, ${formatUnavailableLabel(locale)}`;
  return `${label}, ${inStockCount} ${inStockCount === 1 ? "product" : "products"}`;
}

function sortColorsForLocale(colors, locale) {
  return [...colors]
    .filter((color) => color.count > 0)
    .sort((a, b) => {
      const aAvailable = (a.inStockCount ?? 0) > 0;
      const bAvailable = (b.inStockCount ?? 0) > 0;
      if (aAvailable !== bAvailable) return aAvailable ? -1 : 1;

      const aLabel = formatColorLabel(a, locale);
      const bLabel = formatColorLabel(b, locale);
      return aLabel.localeCompare(bLabel, locale === "ar" ? "ar" : "en", { sensitivity: "base" });
    });
}

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

  const visibleColors = useMemo(
    () => sortColorsForLocale(availableColors, locale),
    [availableColors, locale]
  );

  const selectedColor = visibleColors.find((color) => color.key === filters.color);

  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function toggleCategory(categoryId) {
    update("categoryId", filters.categoryId === categoryId ? "" : categoryId);
  }

  function toggleColor(colorKey, isAvailable) {
    if (!isAvailable) return;
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

      {/* ── Color (database-driven) ── */}
      {visibleColors.length > 0 ? (
        <div className="cb-shop-filters-section">
          <div className="cb-shop-price-row">
            <h3 className="cb-shop-filters-section-title !mb-0">
              {locale === "ar" ? "اللون" : "Color"}
            </h3>
            {filters.color ? (
              <button
                type="button"
                className="cb-shop-filters-clear"
                onClick={() => update("color", "")}
              >
                {locale === "ar" ? "مسح" : "Clear"}
              </button>
            ) : null}
          </div>
          <div className="cb-shop-color-swatches" role="list" aria-label={locale === "ar" ? "الألوان" : "Colors"}>
            {visibleColors.map((color) => {
              const label = formatColorLabel(color, locale);
              const hex = color.hex || getColorFromName(color.name || color.nameAr);
              const light = isLightSwatch(hex);
              const inStockCount = color.inStockCount ?? 0;
              const isAvailable = inStockCount > 0;
              const selected = isAvailable && filters.color === color.key;
              const displayCount = isAvailable ? inStockCount : 0;

              return (
                <div
                  key={color.key}
                  className={cn("cb-shop-color-swatch-wrap", !isAvailable && "cb-shop-color-swatch-wrap-disabled")}
                  role="listitem"
                >
                  <button
                    type="button"
                    onClick={() => toggleColor(color.key, isAvailable)}
                    disabled={!isAvailable}
                    className={cn(
                      "cb-shop-color-swatch",
                      light && "cb-shop-color-swatch-light",
                      selected && "cb-shop-color-swatch-active",
                      !isAvailable && "cb-shop-color-swatch-disabled"
                    )}
                    style={{ backgroundColor: hex }}
                    aria-label={formatColorAriaLabel(color, locale)}
                    aria-pressed={selected}
                    aria-disabled={!isAvailable}
                  />
                  <span className="cb-shop-color-tooltip" role="tooltip" aria-hidden="true">
                    <span className="cb-shop-color-tooltip-name">
                      {isAvailable ? `${label} (${displayCount})` : label}
                    </span>
                    <span
                      className={cn(
                        "cb-shop-color-tooltip-count",
                        !isAvailable && "cb-shop-color-tooltip-count-muted"
                      )}
                    >
                      {isAvailable
                        ? formatColorCountLabel(inStockCount, locale)
                        : formatUnavailableLabel(locale)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          {filters.color ? (
            <p className="cb-shop-color-selected-label">
              {locale === "ar" ? "اللون: " : "Color: "}
              <strong>
                {formatColorLabel(
                  selectedColor ?? { name: filters.color, nameAr: filters.color, count: 0 },
                  locale
                )}
                {selectedColor?.inStockCount ? (
                  <span className="cb-shop-color-selected-count">
                    {" "}({selectedColor.inStockCount})
                  </span>
                ) : null}
              </strong>
            </p>
          ) : null}
        </div>
      ) : null}

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
