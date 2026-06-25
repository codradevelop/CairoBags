import { Skeleton } from "../ui/Skeleton.jsx";
import { cn } from "../../utils/cn.js";

export function ReviewSummarySkeleton({ className }) {
  return (
    <div className={cn("rounded-2xl border border-brand-border bg-brand-surface p-6 md:p-8", className)}>
      <div className="grid gap-8 md:grid-cols-[minmax(0,220px)_1fr]">
        <div className="space-y-3 text-center md:text-start">
          <Skeleton className="mx-auto h-14 w-24 md:mx-0" />
          <Skeleton className="mx-auto h-7 w-36 md:mx-0" />
          <Skeleton className="mx-auto h-4 w-32 md:mx-0" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReviewCardSkeleton({ className }) {
  return (
    <div className={cn("rounded-2xl border border-brand-border bg-brand-surface p-5 md:p-6", className)}>
      <div className="flex gap-4">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );
}

export function ReviewListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <ReviewCardSkeleton key={i} />
      ))}
    </div>
  );
}
