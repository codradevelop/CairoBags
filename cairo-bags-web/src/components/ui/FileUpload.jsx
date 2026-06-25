import { useId, useRef } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";
import { resolveMediaUrl } from "../../utils/mediaUrl.js";
import { Button } from "./Button.jsx";

function ImagePlaceholderIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <path d="m3 16 5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FileUpload({
  accept = "image/*",
  disabled = false,
  loading = false,
  multiple = false,
  previewUrl,
  fileName,
  onChange,
  className,
}) {
  const { locale } = useLocale();
  const inputId = useId();
  const inputRef = useRef(null);

  const chooseLabel = locale === "ar" ? "اختر صورة" : "Choose image";
  const hint =
    locale === "ar"
      ? "PNG أو JPG — اضغط لاختيار الصورة"
      : "PNG or JPG — click to browse";
  const emptyLabel = locale === "ar" ? "لم يتم اختيار ملف" : "No file chosen";

  function openPicker() {
    if (disabled || loading) return;
    inputRef.current?.click();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled || loading}
        onChange={onChange}
        className="sr-only"
      />

      <div
        role="button"
        tabIndex={disabled || loading ? -1 : 0}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        className={cn(
          "group relative flex flex-col gap-4 rounded-xl border border-dashed border-brand-border bg-brand-secondary/40 p-4 transition-all duration-fast sm:flex-row sm:items-center",
          "hover:border-brand-accent/60 hover:bg-brand-secondary/70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/30",
          (disabled || loading) && "cursor-not-allowed opacity-60"
        )}
      >
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-brand-surface text-brand-muted shadow-sm">
          {previewUrl ? (
            <img src={resolveMediaUrl(previewUrl)} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlaceholderIcon />
          )}
        </div>

        <div className="min-w-0 flex-1 text-start">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || loading}
              loading={loading}
              className="border-brand-accent/40 hover:border-brand-accent hover:text-brand-accent"
              onClick={(event) => {
                event.stopPropagation();
                openPicker();
              }}
            >
              {chooseLabel}
            </Button>
            <span className="truncate text-sm text-brand-muted">
              {fileName || emptyLabel}
            </span>
          </div>
          <p className="mt-2 text-xs text-brand-muted">{hint}</p>
        </div>
      </div>
    </div>
  );
}
