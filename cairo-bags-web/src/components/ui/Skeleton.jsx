import { cn } from "../../utils/cn.js";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn("cb-shimmer rounded-[var(--cb-radius-control)] bg-brand-secondary/80", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-4", index === lines - 1 ? "w-4/5" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("space-y-4 rounded-lg border border-brand-border p-4", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-md" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-10" />
      </div>
    </div>
  );
}

export function SkeletonAvatar({ size = "md", className }) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  return <Skeleton className={cn("rounded-full", sizes[size], className)} />;
}

export function SkeletonTableRow({ columns = 4, className }) {
  return (
    <div className={cn("flex items-center gap-4 py-3", className)}>
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} className={cn("h-4", index === 0 ? "w-1/4" : "flex-1")} />
      ))}
    </div>
  );
}
