import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn.js";

const ToastContext = createContext(null);

let toastId = 0;

const variantStyles = {
  default:
    "border-brand-accent/50 bg-brand-primary text-brand-secondary shadow-glow-gold dark:border-brand-accent/45 dark:bg-brand-surface dark:text-brand-text",
  success:
    "border-brand-accent/60 bg-brand-primary text-brand-secondary shadow-glow-gold dark:border-brand-accent/50 dark:bg-brand-surface dark:text-brand-text",
  warning:
    "border-gold-500/55 bg-brand-primary text-brand-secondary shadow-glow-gold dark:border-gold-500/45 dark:bg-brand-surface dark:text-brand-text",
  error:
    "border-[#C45C5C]/55 bg-brand-primary text-brand-secondary shadow-[0_12px_40px_-8px_rgba(155,34,38,0.25)] dark:border-[#C45C5C]/45 dark:bg-brand-surface dark:text-brand-text",
  info:
    "border-brand-accent/50 bg-brand-primary text-brand-secondary shadow-glow-gold dark:border-brand-accent/45 dark:bg-brand-surface dark:text-brand-text",
};

const iconStyles = {
  default: "bg-brand-accent/25 text-brand-accent",
  success: "bg-brand-accent/30 text-brand-accent-muted ring-1 ring-brand-accent/30",
  warning: "bg-gold-600/30 text-gold-200",
  error: "bg-[#9B2226]/35 text-[#F8C4C4]",
  info: "bg-brand-accent/25 text-brand-accent",
};

const icons = {
  success: "✓",
  warning: "!",
  error: "×",
  info: "i",
  default: "•",
};

function ToastItem({ toast, onDismiss }) {
  const variant = toast.variant || "default";

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border px-5 py-3.5",
        "animate-slide-down",
        variantStyles[variant]
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
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
              toast.title
                ? "mt-0.5 text-brand-secondary/90 dark:text-brand-muted"
                : "font-medium text-brand-secondary dark:text-brand-text"
            )}
          >
            {toast.message}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-brand-accent-muted transition-opacity hover:text-brand-accent dark:text-brand-muted dark:hover:text-brand-text"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-24 z-[70] flex flex-col items-center gap-3 px-4 sm:top-28"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
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
