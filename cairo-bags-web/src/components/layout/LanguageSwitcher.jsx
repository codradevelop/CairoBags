import { Button } from "../ui/Button.jsx";
import { cn } from "../../utils/cn.js";
import { useLocale } from "../../context/LocaleContext.jsx";

export { useLocale };

export function LanguageSwitcher({ className, variant = "ghost", size = "sm", unstyled = false }) {
  const { locale, toggleLocale } = useLocale();

  if (unstyled) {
    return (
      <button
        type="button"
        onClick={toggleLocale}
        className={className}
        aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
      >
        {locale === "ar" ? "English" : "عربي"}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleLocale}
      className={cn("min-w-[4.5rem] font-medium tracking-wide", className)}
      aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
    >
      {locale === "ar" ? "English" : "عربي"}
    </Button>
  );
}
