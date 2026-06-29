import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { Input, Label, FieldError } from "../ui/Input.jsx";
import { cn } from "../../utils/cn.js";
import {
  getGovernorateLabel,
  getGovernorateValue,
} from "../../utils/shippingHelpers.js";

export function GovernorateSelect({
  governorates,
  value,
  onChange,
  error,
  disabled = false,
  required = true,
  className,
}) {
  const { locale } = useLocale();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const selected = useMemo(
    () =>
      governorates.find(
        (g) => getGovernorateValue(g) === value || (g.nameAr ?? g.NameAr) === value
      ) ?? null,
    [governorates, value]
  );

  const displayValue = selected
    ? getGovernorateLabel(selected, locale)
    : value || "";

  useEffect(() => {
    if (!isSearching) {
      setQuery(displayValue);
    }
  }, [displayValue, isSearching]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setIsSearching(false);
        setQuery(displayValue);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [displayValue]);

  const filtered = useMemo(() => {
    if (!isSearching || !query.trim()) return governorates;
    const term = query.trim().toLowerCase();
    return governorates.filter((g) => {
      const en = (g.nameEn ?? g.NameEn ?? "").toLowerCase();
      const ar = g.nameAr ?? g.NameAr ?? "";
      return en.includes(term) || ar.includes(term);
    });
  }, [governorates, query, isSearching]);

  function handleOpen() {
    setOpen(true);
    setIsSearching(false);
    setQuery(displayValue);
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function handleSelect(governorate) {
    onChange(getGovernorateValue(governorate));
    setQuery(getGovernorateLabel(governorate, locale));
    setIsSearching(false);
    setOpen(false);
  }

  const placeholder =
    locale === "ar" ? "ابحث عن المحافظة..." : "Search governorate...";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Label required={required}>{locale === "ar" ? "المحافظة" : "Governorate"}</Label>
      <Input
        ref={inputRef}
        value={query}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        variant={error ? "error" : "default"}
        onFocus={handleOpen}
        onClick={handleOpen}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsSearching(true);
          setOpen(true);
          if (!e.target.value.trim()) onChange("");
        }}
      />
      {open && filtered.length > 0 ? (
        <ul
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-brand-border bg-brand-surface py-1 shadow-card"
          role="listbox"
        >
          {filtered.map((governorate) => {
            const id = governorate.id ?? governorate.Id;
            const label = getGovernorateLabel(governorate, locale);
            const fee = governorate.shippingFee ?? governorate.ShippingFee;
            const isSelected = getGovernorateValue(governorate) === value;
            return (
              <li key={id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-start text-sm transition-colors hover:bg-brand-secondary",
                    isSelected && "bg-brand-accent/10 text-brand-accent"
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(governorate)}
                >
                  <span>{label}</span>
                  <span className="shrink-0 text-xs text-brand-muted">
                    {fee} {locale === "ar" ? "ج.م" : "EGP"}{" "}
                    <span className="text-brand-muted/90">
                      {locale === "ar" ? "شحن" : "shipping"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      {open && query.trim() && filtered.length === 0 ? (
        <p className="absolute z-30 mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-muted shadow-card">
          {locale === "ar" ? "لا توجد نتائج" : "No matches found"}
        </p>
      ) : null}
      <FieldError>{error}</FieldError>
    </div>
  );
}
