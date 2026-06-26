import { forwardRef } from "react";
import { cn } from "../../utils/cn.js";

const variants = {
  default: "border-brand-border bg-brand-surface text-brand-text placeholder:text-brand-muted/80",
  error: "border-red-700/80 bg-brand-surface text-brand-text placeholder:text-brand-muted/80",
};

const sizes = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-4 text-sm",
};

export const Input = forwardRef(function Input(
  { className, variant = "default", size = "md", type = "text", ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn("cb-control w-full", variants[variant], sizes[size], className)}
      {...props}
    />
  );
});

export const Textarea = forwardRef(function Textarea(
  { className, variant = "default", rows = 4, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "cb-control w-full resize-y px-4 py-3 text-sm min-h-[6rem]",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

export function Label({ className, required, children, ...props }) {
  return (
    <label
      className={cn("mb-1.5 block text-xs font-medium tracking-wide text-brand-text", className)}
      {...props}
    >
      {children}
      {required ? <span className="ms-1 text-red-700">*</span> : null}
    </label>
  );
}

export function FieldError({ className, children, id }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={cn("mt-1.5 text-xs leading-relaxed text-red-700", className)}>
      {children}
    </p>
  );
}

export function InputGroup({ className, children }) {
  return <div className={cn("w-full", className)}>{children}</div>;
}
