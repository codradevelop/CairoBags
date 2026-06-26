import { forwardRef } from "react";
import { cn } from "../../utils/cn.js";

const variants = {
  primary:
    "bg-brand-primary text-brand-secondary border border-brand-primary hover:bg-[#1a1a1a] hover:border-[#1a1a1a] disabled:opacity-50",
  secondary:
    "bg-brand-secondary text-brand-text border border-brand-border hover:bg-brand-background disabled:opacity-50",
  outline:
    "bg-transparent text-brand-text border border-brand-border hover:border-brand-accent hover:text-brand-accent disabled:opacity-50",
  ghost:
    "bg-transparent text-brand-text border border-transparent hover:bg-brand-secondary/60 disabled:opacity-50",
  accent: "cb-btn-accent disabled:opacity-50",
  danger:
    "bg-red-800 text-white border border-red-800 hover:bg-red-900 disabled:opacity-50",
};

const sizes = {
  sm: "h-8 min-h-8 px-3.5 text-[11px] tracking-wide",
  md: "h-10 min-h-10 px-5 text-xs tracking-wide",
  lg: "h-11 min-h-11 px-7 text-sm tracking-wide",
  icon: "h-10 min-h-10 w-10 min-w-10 p-0",
};

export const Button = forwardRef(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    type = "button",
    loading = false,
    disabled,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={cn("cb-btn", variants[variant], sizes[size], className)}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          <span className="sr-only">Loading</span>
        </>
      ) : null}
      {children}
    </button>
  );
});
