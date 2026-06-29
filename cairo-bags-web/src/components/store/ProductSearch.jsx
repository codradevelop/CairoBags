import { useNavigate } from "react-router-dom";
import { Input } from "../ui/Input.jsx";
import { Button } from "../ui/Button.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
  variant = "default",
}) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const placeholder = locale === "ar" ? "ابحث عن حقائب..." : "Search bags...";
  const isHeader = variant === "header";

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = String(formData.get("q") ?? "").trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    onSubmit?.(query);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative flex gap-2", isHeader && "cb-header-search-form", className)}
      role="search"
    >
      <div className="relative min-w-0 flex-1">
        <span
          className={cn(
            "pointer-events-none absolute start-3 top-1/2 -translate-y-1/2",
            isHeader ? "text-brand-accent" : "text-brand-muted"
          )}
        >
          <SearchIcon />
        </span>
        <Input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cn("ps-10", isHeader && "cb-header-search-input")}
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
