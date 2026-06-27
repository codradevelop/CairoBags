import { Skeleton } from "../ui/Skeleton.jsx";
import { cn } from "../../utils/cn.js";

export function ProductSkeleton({ className, compact = false }) {
  return (
    <article className={cn("relative flex h-full flex-col", className)} aria-hidden="true">
      <div
        className="flex h-full flex-col overflow-hidden rounded-xl border border-brand-border/70 bg-brand-surface"
        style={{ boxShadow: "var(--cb-shadow-card)" }}
      >
        <div className="cb-product-aspect relative overflow-hidden bg-brand-secondary">
          <Skeleton className="absolute inset-0 rounded-none" />
        </div>
        <div className={cn("cb-product-card-body", compact && "px-2.5 py-2.5")}>
          <Skeleton className="h-2.5 w-14" />
          <Skeleton className="cb-product-card-title mt-2 w-4/5" />
          <Skeleton className="cb-product-card-meta mt-2 h-3 w-20" />
          <Skeleton className="cb-product-card-price mt-1.5 h-4 w-16" />
          <Skeleton className="mt-auto h-4 w-14 rounded-full pt-2.5" />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 10, className, compact = false }) {
  return (
    <div className={cn(className || "cb-product-grid")}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} compact={compact} />
      ))}
    </div>
  );
}

export function CategoryGridSkeleton({ count = 4, className }) {
  return (
    <div className={cn("cb-category-grid", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="cb-category-aspect w-full rounded-xl" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton({ className }) {
  return (
    <div className={cn("cb-product-detail-grid", className)}>
      <Skeleton className="cb-product-detail-gallery cb-product-aspect w-full rounded-xl" />
      <div className="cb-product-detail-panel space-y-4">
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="space-y-3 rounded-xl border border-brand-border/60 p-4">
          <Skeleton className="h-3 w-16" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-14" />
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-14 rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
