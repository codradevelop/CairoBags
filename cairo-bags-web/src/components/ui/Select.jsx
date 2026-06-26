import { forwardRef } from "react";
import { cn } from "../../utils/cn.js";

export const Select = forwardRef(function Select(
  { className, size = "md", children, style, ...props },
  ref
) {
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-4 text-sm",
  };

  return (
    <select
      ref={ref}
      className={cn(
        "cb-control w-full cursor-pointer appearance-none",
        sizes[size],
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666666' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "calc(100% - 0.75rem) center",
        paddingRight: "2.5rem",
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export function Checkbox({ className, label, id, ...props }) {
  return (
    <label
      htmlFor={id}
      className={cn("flex cursor-pointer items-center gap-2.5 text-sm text-brand-text select-none", className)}
    >
      <input id={id} type="checkbox" className="sr-only" {...props} />
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all duration-300",
          props.checked
            ? "border-brand-accent bg-gradient-to-br from-brand-accent to-brand-accent-deep"
            : "border-brand-border bg-brand-surface"
        )}
        aria-hidden="true"
      >
        {props.checked ? (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {label}
    </label>
  );
}
