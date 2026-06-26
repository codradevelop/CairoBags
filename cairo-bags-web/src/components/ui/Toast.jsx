import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "../../utils/cn.js";
import { EASE_LUXURY } from "./motion.jsx";
import { DURATION } from "./animation.jsx";

const ToastContext = createContext(null);

let toastId = 0;

const variantStyles = {
  default:
    "border-brand-accent/35 bg-brand-surface/90 text-brand-text backdrop-blur-md dark:bg-brand-surface-dark/92",
  success:
    "border-brand-accent/40 bg-brand-surface/90 text-brand-text backdrop-blur-md dark:bg-brand-surface-dark/92",
  warning:
    "border-gold-500/40 bg-brand-surface/90 text-brand-text backdrop-blur-md dark:bg-brand-surface-dark/92",
  error:
    "border-red-700/35 bg-brand-surface/90 text-brand-text backdrop-blur-md dark:bg-brand-surface-dark/92",
  info:
    "border-brand-accent/35 bg-brand-surface/90 text-brand-text backdrop-blur-md dark:bg-brand-surface-dark/92",
};

const iconStyles = {
  default: "bg-brand-accent/15 text-brand-accent ring-1 ring-brand-accent/20",
  success: "bg-brand-accent/20 text-brand-accent-deep ring-1 ring-brand-accent/25",
  warning: "bg-gold-600/15 text-gold-700",
  error: "bg-red-700/10 text-red-800",
  info: "bg-brand-accent/15 text-brand-accent",
};

const icons = {
  success: "✓",
  warning: "!",
  error: "×",
  info: "i",
  default: "•",
};

function ToastItem({ toast, onDismiss, prefersReduced }) {
  const variant = toast.variant || "default";

  return (
    <motion.div
      layout
      role="status"
      initial={prefersReduced ? false : { opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReduced ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: DURATION.base, ease: EASE_LUXURY }}
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border px-5 py-3.5",
        variantStyles[variant]
      )}
      style={{ boxShadow: "var(--cb-shadow-dropdown)" }}
    >
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          iconStyles[variant]
        )}
        aria-hidden="true"
      >
        {icons[variant]}
      </span>
      <div className="min-w-0 flex-1 text-center sm:text-start">
        {toast.title ? <p className="text-sm font-medium leading-snug">{toast.title}</p> : null}
        {toast.message ? (
          <p
            className={cn(
              "text-sm leading-snug",
              toast.title ? "mt-0.5 text-brand-muted" : "font-medium"
            )}
          >
            {toast.message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-lg p-1.5 text-brand-muted transition-colors hover:bg-brand-secondary/80 hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
        aria-label="Dismiss"
      >
        ×
      </button>
    </motion.div>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  const prefersReduced = useReducedMotion();

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-24 z-[70] flex flex-col items-center gap-3 px-4 sm:top-28"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={onDismiss}
            prefersReduced={prefersReduced}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export function ToastProvider({ children, defaultDuration = 4000 }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, message, variant = "default", duration = defaultDuration }) => {
      const id = ++toastId;
      setToasts((current) => [{ id, title, message, variant }, ...current]);

      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [defaultDuration, dismiss]
  );

  const value = useMemo(
    () => ({
      toast,
      dismiss,
      success: (message, title) => toast({ title, message, variant: "success" }),
      error: (message, title) => toast({ title, message, variant: "error" }),
      warning: (message, title) => toast({ title, message, variant: "warning" }),
      info: (message, title) => toast({ title, message, variant: "info" }),
    }),
    [toast, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
