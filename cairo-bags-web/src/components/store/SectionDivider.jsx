import { cn } from "../../utils/cn.js";

export function SectionDivider({ className, label }) {
  return (
    <div className={cn("relative py-2 md:py-4", className)} aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-brand-border/80 to-transparent" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-brand-accent/25 to-transparent" />
      {label ? (
        <div className="relative mx-auto flex w-fit items-center gap-3 bg-brand-background px-4">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-brand-accent/50" />
          <span className="text-[9px] font-medium tracking-luxury text-brand-accent/70 uppercase">{label}</span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-brand-accent/50" />
        </div>
      ) : (
        <div className="relative mx-auto h-1 w-1 rounded-full bg-brand-accent/40" />
      )}
    </div>
  );
}

export function FloatingBackground({ className }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute -start-24 top-20 h-64 w-64 rounded-full bg-brand-accent/[0.04] blur-3xl" />
      <div className="absolute -end-16 bottom-32 h-72 w-72 rounded-full bg-brand-secondary/30 blur-3xl" />
      <div className="cb-grain absolute inset-0 opacity-[0.35]" />
    </div>
  );
}
