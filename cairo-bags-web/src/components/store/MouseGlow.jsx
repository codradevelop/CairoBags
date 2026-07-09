import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn.js";

const SMOOTHING = 0.065;

export function MouseGlow({ className }) {
  const ref = useRef(null);
  const glowRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const [enabled, setEnabled] = useState(false);

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
      targetRef.current = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };
    };

    const tick = () => {
      const target = targetRef.current;
      const pos = posRef.current;
      pos.x += (target.x - pos.x) * SMOOTHING;
      pos.y += (target.y - pos.y) * SMOOTHING;

      const glow = glowRef.current;
      if (glow) {
        glow.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  if (!enabled) return <div ref={ref} className={cn("pointer-events-none absolute inset-0", className)} />;

  return (
    <div ref={ref} className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div
        ref={glowRef}
        className="cb-mouse-glow__spot"
        style={{
          transform: "translate3d(0, 0, 0) translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
