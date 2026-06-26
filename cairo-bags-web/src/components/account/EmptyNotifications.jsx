import { Button } from "../ui/Button.jsx";
import { EmptyState } from "../store/EmptyState.jsx";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { cn } from "../../utils/cn.js";

export function EmptyNotifications({ onRefresh, className }) {
  const { locale } = useLocale();

  return (
    <EmptyState
      className={cn("max-w-lg", className)}
      variant="notifications"
      title={locale === "ar" ? "لا توجد إشعارات" : "No notifications"}
      description={
        locale === "ar" ? "ستظهر تحديثات طلباتك هنا" : "Order updates will appear here"
      }
      action={
        onRefresh ? (
          <Button type="button" variant="outline" onClick={onRefresh}>
            {locale === "ar" ? "تحديث" : "Refresh"}
          </Button>
        ) : null
      }
    />
  );
}
