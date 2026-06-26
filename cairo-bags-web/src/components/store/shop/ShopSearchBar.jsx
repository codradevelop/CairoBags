import { useLocale } from "../../layout/LanguageSwitcher.jsx";
import { cn } from "../../../utils/cn.js";

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ShopSearchBar({ defaultValue = "", onSubmit, className }) {
  const { locale } = useLocale();
  const placeholder =
    locale === "ar" ? "ابحث عن حقائب، مجموعات..." : "Search for bags, collections...";

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    onSubmit?.(query);
  }

  return (
    <form onSubmit={handleSubmit} className={cn("cb-shop-search", className)} role="search">
      <span className="cb-shop-search-icon">
        <SearchIcon />
      </span>
      <input
        type="search"
        name="q"
        key={defaultValue}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={placeholder}
        className="cb-shop-search-input"
      />
    </form>
  );
}
