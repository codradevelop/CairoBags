import { useEffect, useState } from "react";
import { cn } from "../../utils/cn.js";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 end-6 z-40 flex h-11 w-11 items-center justify-center rounded-full",
        "border border-brand-border/80 bg-brand-surface/95 text-brand-text backdrop-blur-sm",
        "transition-all duration-300 hover:border-brand-accent hover:text-brand-accent",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2",
        "motion-reduce:transition-none"
      )}
      style={{ boxShadow: "var(--cb-shadow-elevated)" }}
      aria-label="Scroll to top"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
