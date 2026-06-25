import { Skeleton } from "../ui/Skeleton.jsx";
import { cn } from "../../utils/cn.js";

export function ProductSkeleton({ className, compact = false }) {
  return (
    <article
      className={cn("relative flex h-full flex-col", className)}
      aria-hidden="true"
    >
      <div
        className={cn(
          "relative flex flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-brand-border bg-brand-surface shadow-card",
          "dark:bg-brand-surface-dark dark:border-brand-border"
        )}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-brand-secondary">
          <Skeleton className="absolute inset-0 rounded-none" />

          <div className="absolute start-3 top-3 z-10 flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-10 rounded-full" />
          </div>

          <div className="absolute end-3 top-3 z-10">
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 px-4 pb-4",
              compact && "px-3 pb-3"
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-9 w-full rounded-md sm:flex-1" />
              <Skeleton className="h-9 w-full rounded-md sm:flex-1" />
            </div>
          </div>
        </div>

        <div
          className={cn(
            "relative z-10 border-t border-brand-border/70 bg-brand-surface px-4 py-4 dark:bg-brand-surface-dark",
            compact ? "px-3 py-3" : "px-4 py-4"
          )}
        >
          <div className="space-y-2">
            <Skeleton className="mx-auto h-2.5 w-20 sm:mx-0" />
            <Skeleton className="h-5 w-4/5" />
            <div className="flex items-center gap-1.5 pt-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-3 w-3 rounded-sm" />
              ))}
              <Skeleton className="ms-1 h-3 w-10" />
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3.5 w-14" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-3 w-8" />
              <div className="flex gap-1.5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-3.5 w-3.5 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8, className, compact = false }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} compact={compact} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 4, className }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="aspect-[4/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton({ className }) {
  return (
    <div className={cn("grid gap-8 lg:grid-cols-2", className)}>
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-6 h-12 w-full" />
      </div>
    </div>
  );
}
