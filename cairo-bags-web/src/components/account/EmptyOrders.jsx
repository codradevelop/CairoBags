import { Link } from "react-router-dom";
import { EmptyState, EmptyStateAction } from "../store/EmptyState.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

export function EmptyOrders({ className }) {
  const { locale } = useLocale();

  return (
    <EmptyState
      className={cn("max-w-lg", className)}
      variant="orders"
      title={locale === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}
      description={
        locale === "ar"
          ? "ابدأ التسوق لاكتشاف مجموعتنا الفاخرة"
          : "Start shopping to discover our luxury collection"
      }
      action={
        <Link to="/shop">
          <EmptyStateAction>{locale === "ar" ? "تسوق الآن" : "Shop Now"}</EmptyStateAction>
        </Link>
      }
    />
  );
}
