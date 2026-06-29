import { useLocale } from "../layout/LanguageSwitcher.jsx";
import { ORDER_STATUS } from "../../constants/orderStatus.js";
import { getCodStatusDotClass, getCodStatusLabel } from "../../constants/codOrderStatus.js";
import {
  getCodHistoryChangedBy,
  getCodHistoryNewStatus,
  getCodHistoryOldStatus,
} from "../../utils/codOrderHelpers.js";
import { formatOrderDate } from "../../utils/orderHelpers.js";
import { cn } from "../../utils/cn.js";

export function CodAdminAuditLog({ history = [], orderNumber, className }) {
  const { locale } = useLocale();

  const entries = history
    .filter((entry) => getCodHistoryChangedBy(entry))
    .filter((entry) => getCodHistoryNewStatus(entry) !== ORDER_STATUS.AT_LOCAL_HUB)
    .slice()
    .sort(
      (a, b) =>
        new Date(a.createdAt ?? a.CreatedAt).getTime() -
        new Date(b.createdAt ?? b.CreatedAt).getTime()
    );

  if (!entries.length) {
    return (
      <p className={cn("text-sm text-brand-muted", className)}>
        {locale === "ar" ? "لا يوجد سجل تدقيق بعد" : "No admin audit entries yet"}
      </p>
    );
  }

  return (
    <ol className={cn("space-y-3", className)}>
      {entries.map((entry, index) => {
        const oldStatus = getCodHistoryOldStatus(entry);
        const newStatus = getCodHistoryNewStatus(entry);
        const changedBy = getCodHistoryChangedBy(entry);
        const createdAt = entry.createdAt ?? entry.CreatedAt;

        return (
          <li
            key={`${createdAt}-${newStatus}-${index}`}
            className="rounded-xl border border-brand-border/70 bg-brand-surface/80 px-4 py-3 transition-all duration-300"
          >
            <p className="text-sm text-brand-text">
              <span className="font-medium">{locale === "ar" ? "المشرف" : "Admin"}</span>{" "}
              <span className="font-semibold text-brand-primary">{changedBy}</span>{" "}
              <span className="text-brand-muted">
                {locale === "ar" ? "غيّر الطلب" : "changed order"}
              </span>{" "}
              {orderNumber ? (
                <span className="font-medium text-brand-text">{orderNumber}</span>
              ) : null}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              {oldStatus ? (
                <>
                  <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-700">
                    <span
                      className={cn("h-2 w-2 shrink-0 rounded-full", getCodStatusDotClass(oldStatus))}
                      aria-hidden="true"
                    />
                    {getCodStatusLabel(oldStatus, locale)}
                  </span>
                  <span className="text-brand-muted" aria-hidden="true">
                    ↓
                  </span>
                </>
              ) : null}
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-accent/10 px-2.5 py-1 font-medium text-brand-text">
                <span
                  className={cn("h-2 w-2 shrink-0 rounded-full", getCodStatusDotClass(newStatus))}
                  aria-hidden="true"
                />
                {getCodStatusLabel(newStatus, locale)}
              </span>
            </div>
            <p className="mt-2 text-xs text-brand-muted">{formatOrderDate(createdAt, locale)}</p>
          </li>
        );
      })}
    </ol>
  );
}
