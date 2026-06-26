import { Link } from "react-router-dom";
import { EmptyState, EmptyStateAction } from "../store/EmptyState.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

export function EmptyCart({ className, onContinue }) {
  const { locale } = useLocale();

  return (
    <EmptyState
      className={cn("max-w-lg", className)}
      variant="cart"
      title={locale === "ar" ? "سلتك فارغة" : "Your bag is empty"}
      description={
        locale === "ar"
          ? "اكتشف مجموعتنا الفاخرة من الحقائب"
          : "Discover our luxury handbag collection"
      }
      action={
        onContinue ? (
          <EmptyStateAction type="button" onClick={onContinue}>
            {locale === "ar" ? "تسوق الآن" : "Shop Now"}
          </EmptyStateAction>
        ) : (
          <Link to="/shop">
            <EmptyStateAction>{locale === "ar" ? "تسوق الآن" : "Shop Now"}</EmptyStateAction>
          </Link>
        )
      }
    />
  );
}
