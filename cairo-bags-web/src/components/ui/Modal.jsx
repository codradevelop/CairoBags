import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "../../utils/cn.js";
import { Button } from "./Button.jsx";
import { EASE_LUXURY } from "./motion.jsx";
import { DURATION } from "./animation.jsx";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlay = true,
  className,
}) {
  const panelRef = useRef(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[calc(100vw-2rem)]",
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
          <motion.div
            initial={prefersReduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_LUXURY }}
            className="absolute inset-0 bg-brand-primary/35 backdrop-blur-md"
            onClick={closeOnOverlay ? onClose : undefined}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-description" : undefined}
            tabIndex={-1}
            initial={prefersReduced ? false : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReduced ? undefined : { opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: DURATION.slow, ease: EASE_LUXURY }}
            className={cn(
              "relative z-[61] w-full rounded-2xl border border-brand-border/80 bg-brand-surface/95 backdrop-blur-xl outline-none",
              sizes[size],
              className
            )}
            style={{ boxShadow: "var(--cb-shadow-modal)" }}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 border-b border-brand-border/70 px-6 py-5">
                <div>
                  {title ? (
                    <h2 id="modal-title" className="font-display text-xl font-light text-brand-text">
                      {title}
                    </h2>
                  ) : null}
                  {description ? (
                    <p id="modal-description" className="mt-1 text-[13px] text-brand-muted">
                      {description}
                    </p>
                  ) : null}
                </div>
                {onClose ? (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-brand-muted transition-colors hover:bg-brand-secondary hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                    aria-label="Close"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M5 5l10 10M15 5L5 15"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                ) : null}
              </div>
            )}
            <div className="px-6 py-5">{children}</div>
            {footer ? (
              <div className="flex items-center justify-end gap-3 border-t border-brand-border/70 px-6 py-4">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  variant = "danger",
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
