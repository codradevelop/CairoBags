import { useId, useRef } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { Button } from "../ui/Button.jsx";
import { cn } from "../../utils/cn.js";

function formatFileSize(bytes, locale = "en") {
  if (!Number.isFinite(bytes) || bytes <= 0) return locale === "ar" ? "—" : "—";
  if (bytes < 1024) return `${bytes} ${locale === "ar" ? "بايت" : "B"}`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} ${locale === "ar" ? "ك.ب" : "KB"}`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${locale === "ar" ? "م.ب" : "MB"}`;
}

export function PaymentProofPreview({ file, previewUrl, onChange, onRemove, className }) {
  const { locale } = useLocale();
  const inputId = useId();
  const inputRef = useRef(null);

  if (!file || !previewUrl) return null;

  const labels =
    locale === "ar"
      ? {
          title: "معاينة إثبات الدفع",
          fileName: "اسم الملف",
          fileSize: "الحجم",
          change: "تغيير الصورة",
          remove: "إزالة الصورة",
          alt: "معاينة إثبات الدفع",
        }
      : {
          title: "Payment Proof Preview",
          fileName: "File name",
          fileSize: "File size",
          change: "Change Image",
          remove: "Remove Image",
          alt: "Payment proof preview",
        };

  function openPicker() {
    inputRef.current?.click();
  }

  function handleFileChange(event) {
    onChange?.(event);
    event.target.value = "";
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-brand-accent/20 bg-gradient-to-br from-brand-surface via-brand-surface to-brand-accent/5 shadow-[0_12px_40px_-20px_rgba(201,169,98,0.45)]",
        className
      )}
    >
      <div className="border-b border-brand-border/70 px-4 py-3 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">
          {labels.title}
        </p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="overflow-hidden rounded-xl border border-brand-border/80 bg-brand-secondary/30 shadow-soft">
          <img
            src={previewUrl}
            alt={labels.alt}
            loading="lazy"
            decoding="async"
            className="mx-auto max-h-72 w-full object-contain sm:max-h-80"
          />
        </div>

        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-brand-border/70 bg-brand-surface/80 px-3 py-2.5">
            <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">{labels.fileName}</p>
            <p className="mt-1 truncate font-medium text-brand-text">{file.name}</p>
          </div>
          <div className="rounded-lg border border-brand-border/70 bg-brand-surface/80 px-3 py-2.5">
            <p className="text-xs uppercase tracking-[0.12em] text-brand-muted">{labels.fileSize}</p>
            <p className="mt-1 font-medium text-brand-text">{formatFileSize(file.size, locale)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-brand-accent/40 hover:border-brand-accent hover:text-brand-accent"
            onClick={openPicker}
          >
            {labels.change}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            {labels.remove}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { formatFileSize };
