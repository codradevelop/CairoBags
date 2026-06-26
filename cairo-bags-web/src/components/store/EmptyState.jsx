import { Button } from "../ui/Button.jsx";
import { getEmptyStateIcon } from "../ui/EmptyStateIcons.jsx";
import { cn } from "../../utils/cn.js";

export function EmptyState({
  title,
  description,
  action,
  className,
  variant = "products",
  icon,
  compact = false,
}) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center rounded-2xl border border-brand-border/60 bg-brand-surface px-6 text-center",
        compact ? "py-10" : "py-14 md:py-16",
        className
      )}
      style={{ boxShadow: "var(--cb-shadow-card)" }}
      role="status"
    >
      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-brand-accent/25 bg-brand-accent/5 text-brand-accent"
        aria-hidden="true"
      >
        {icon ?? getEmptyStateIcon(variant)}
      </div>
      <h3 className="font-display text-xl font-light tracking-tight text-brand-text md:text-2xl">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-brand-muted md:text-sm">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

export function EmptyStateAction({ children, className, ...props }) {
  return (
    <Button variant="accent" size="md" className={cn("min-w-[9rem] rounded-xl", className)} {...props}>
      {children}
    </Button>
  );
}
