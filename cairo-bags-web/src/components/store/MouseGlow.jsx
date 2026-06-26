import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn.js";

export function MouseGlow({ className }) {
  const ref = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(finePointer.matches && !reduced.matches);
    update();
    finePointer.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      finePointer.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const onMove = (event) => {
      const bounds = ref.current?.getBoundingClientRect();
      if (!bounds) return;
      setPos({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled]);

  if (!enabled) return <div ref={ref} className={cn("pointer-events-none absolute inset-0", className)} />;

  return (
    <div ref={ref} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div
        className="absolute h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full will-change-transform"
        style={{
          left: pos.x,
          top: pos.y,
          background:
            "radial-gradient(circle, rgba(201,169,98,0.14) 0%, rgba(201,169,98,0.04) 35%, transparent 70%)",
          transition: "left 0.15s ease-out, top 0.15s ease-out",
        }}
      />
    </div>
  );
}
