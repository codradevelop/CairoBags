import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { EASE_LUXURY } from "./motion.jsx";

export const DURATION = {
  fast: 0.2,
  base: 0.35,
  slow: 0.5,
  slower: 0.65,
};

export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE_LUXURY } },
  exit: { opacity: 0, y: -6, transition: { duration: DURATION.fast, ease: EASE_LUXURY } },
};

export function PageTransition({ children, className }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

function parseDisplayValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { numeric: value, suffix: "", decimals: Number.isInteger(value) ? 0 : 1 };
  }

  const text = String(value ?? "");
  const match = text.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (!match) return { numeric: 0, suffix: text, decimals: 0 };

  const numeric = Number(match[1]);
  const suffix = match[2] ?? "";
  const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;
  return { numeric, suffix, decimals };
}

export function AnimatedCounter({
  value,
  className,
  duration = 1.4,
  once = true,
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: 0.45 });
  const prefersReduced = useReducedMotion();
  const { numeric, suffix, decimals } = parseDisplayValue(value);
  const [display, setDisplay] = useState(prefersReduced ? numeric : 0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(numeric);
      return;
    }

    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;

    const start = performance.now();
    const from = 0;
    const to = numeric;

    let frameId;
    const tick = (now) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (to - from) * eased;
      setDisplay(next);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [inView, numeric, duration, prefersReduced]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : String(Math.round(display));

  return (
    <span ref={ref} className={className}>
      {formatted}
      {suffix}
    </span>
  );
}
