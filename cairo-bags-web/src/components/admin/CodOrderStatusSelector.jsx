import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "../layout/LanguageSwitcher.jsx";
import {
  COD_STATUS_META,
  COD_STATUS_SEQUENCE,
  getCodStatusLabel,
  getCodTerminalMessage,
  normalizeCodStatus,
} from "../../constants/codOrderStatus.js";
import { ORDER_STATUS } from "../../constants/orderStatus.js";
import { canTransitionCodStatus, isCodOrderTerminal } from "../../utils/codOrderHelpers.js";
import { cn } from "../../utils/cn.js";

function CodStatusPill({ status, locale, active = false, disabled = false, onClick, className }) {
  const normalizedStatus = normalizeCodStatus(status);
  const meta = COD_STATUS_META[normalizedStatus] ?? COD_STATUS_META[ORDER_STATUS.PENDING];
  const label = getCodStatusLabel(status, locale);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold tracking-[0.02em]",
        "transition-all duration-300 ease-out",
        disabled ? "cursor-not-allowed opacity-45" : "hover:-translate-y-0.5 hover:shadow-md",
        active && "ring-2 ring-brand-accent/30 ring-offset-1 ring-offset-brand-surface",
        meta.shell,
        className
      )}
    >
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] transition-colors duration-300",
          meta.dot
        )}
      />
      {label}
    </button>
  );
}

export function CodOrderStatusSelector({
  currentStatus,
  onStatusChange,
  loading = false,
  compact = false,
  className,
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [animatingStatus, setAnimatingStatus] = useState(currentStatus);
  const containerRef = useRef(null);

  const selectableStatuses = useMemo(() => {
    const options = COD_STATUS_SEQUENCE.filter((status) =>
      canTransitionCodStatus(currentStatus, status)
    );
    if (canTransitionCodStatus(currentStatus, ORDER_STATUS.CANCELLED)) {
      options.push(ORDER_STATUS.CANCELLED);
    }
    return options;
  }, [currentStatus]);

  useEffect(() => {
    setAnimatingStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  async function handleSelect(nextStatus) {
    if (loading || !canTransitionCodStatus(currentStatus, nextStatus)) return;
    setOpen(false);
    await onStatusChange?.(nextStatus);
  }

  const terminal = isCodOrderTerminal(currentStatus);
  const terminalMessage = getCodTerminalMessage(currentStatus, locale);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={loading || terminal || selectableStatuses.length === 0}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "group inline-flex items-center gap-2 rounded-xl border border-brand-border/70 bg-brand-surface px-2 py-1.5",
          "transition-all duration-300 hover:border-brand-accent/40 hover:shadow-sm",
          (loading || terminal || selectableStatuses.length === 0) && "cursor-default opacity-80"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CodStatusPill
          status={animatingStatus}
          locale={locale}
          active
          className={cn(
            "transition-all duration-500",
            loading && "animate-pulse",
            animatingStatus !== currentStatus && "scale-[0.98] opacity-80"
          )}
        />
        {!terminal && selectableStatuses.length > 0 ? (
          <span
            className={cn(
              "text-brand-muted transition-transform duration-300",
              open && "rotate-180",
              compact ? "text-xs" : "text-sm"
            )}
            aria-hidden="true"
          >
            ▾
          </span>
        ) : null}
      </button>

      {open && selectableStatuses.length > 0 ? (
        <div
          role="listbox"
            className={cn(
              "absolute z-30 mt-2 min-w-[12rem] rounded-xl border border-brand-border bg-brand-surface p-2 shadow-lg",
              "transition-all duration-200 opacity-100 translate-y-0",
              compact ? "end-0" : "start-0"
            )}
        >
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-muted">
            {locale === "ar" ? "تحديث الحالة" : "Update status"}
          </p>
          <div className="flex flex-col gap-1.5">
            {selectableStatuses.map((status) => (
              <button
                key={status}
                type="button"
                role="option"
                aria-selected={status === currentStatus}
                disabled={loading}
                onClick={() => handleSelect(status)}
                className="flex justify-start transition-transform duration-200 hover:scale-[1.01]"
              >
                <CodStatusPill status={status} locale={locale} className="w-full justify-center" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {terminalMessage ? (
        <p className="mt-2 text-xs font-medium text-brand-muted">{terminalMessage}</p>
      ) : null}
    </div>
  );
}
