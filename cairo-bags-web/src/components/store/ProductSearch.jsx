import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ProductSearch({
  className,
  defaultValue = "",
  onSubmit,
  compact = false,
  autoFocus = false,
}) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const placeholder = locale === "ar" ? "ابحث عن حقائب..." : "Search bags...";
  const isHeaderSearch = className?.includes("cb-header-search");

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    onSubmit?.(query);
  }

  if (isHeaderSearch) {
    return (
      <form onSubmit={handleSubmit} className={cn("cb-header-search", className)} role="search">
        <div className="cb-header-search__field">
          <span className="cb-header-search__icon">
            <SearchIcon />
          </span>
          <input
            type="search"
            name="q"
            defaultValue={defaultValue}
            placeholder={placeholder}
            aria-label={placeholder}
            autoFocus={autoFocus}
          />
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("relative flex gap-2", className)} role="search">
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-brand-muted">
          <SearchIcon />
        </span>
        <input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="cb-control h-10 w-full border border-brand-border bg-brand-surface ps-10 text-sm text-brand-text placeholder:text-brand-muted/80"
          aria-label={placeholder}
          autoFocus={autoFocus}
        />
      </div>
      {compact ? null : (
        <Button type="submit" variant="accent" className="shrink-0">
          {locale === "ar" ? "بحث" : "Search"}
        </Button>
      )}
    </form>
  );
}
