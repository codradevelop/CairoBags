import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { useStoreReadOnly } from "../../hooks/useStoreReadOnly.js";
import { cn } from "../../utils/cn.js";

export function AdminPreviewBanner({ className }) {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();

  if (!readOnly) return null;

  return (
    <div
      className={cn(
        "border-b border-brand-accent/25 bg-brand-primary px-4 py-2 text-center text-xs font-medium tracking-wide text-brand-secondary",
        className
      )}
      role="status"
    >
      {locale === "ar"
        ? "وضع معاينة الإدارة — التسوق معطّل"
        : "Admin Preview Mode — Shopping is disabled."}
    </div>
  );
}

export function AdminPreviewBadge({ className }) {
  const { locale } = useLocale();
  const readOnly = useStoreReadOnly();

  if (!readOnly) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-brand-accent/40 bg-brand-accent/10 px-3 py-1 text-xs font-medium text-brand-accent",
        className
      )}
    >
      {locale === "ar" ? "وضع معاينة الإدارة" : "Admin Preview Mode"}
    </span>
  );
}
