import { useRef, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "../../utils/cn.js";

export function useCardTilt(enabled = true) {
  const ref = useRef(null);
  const prefersReduced = useReducedMotion();
  const [tilting, setTilting] = useState(false);

  const onMove = useCallback(
    (event) => {
      if (!enabled || prefersReduced || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      ref.current.style.transform = `perspective(900px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg) translateY(-2px)`;
      setTilting(true);
    },
    [enabled, prefersReduced]
  );

  const onLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "";
    setTilting(false);
  }, []);

  return { ref, onMove, onLeave, tilting, enabled: enabled && !prefersReduced };
}

export function CardTiltShell({ children, className, onMove, onLeave, shellRef }) {
  return (
    <div
      ref={shellRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn("will-change-transform transition-[box-shadow] duration-500", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}
