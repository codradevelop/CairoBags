import { motion, useReducedMotion } from "framer-motion";

const EASE_LUXURY = [0.19, 1, 0.22, 1];

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_LUXURY } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_LUXURY } },
};

export const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE_LUXURY } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_LUXURY } },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const staggerItem = slideUp;

export function MotionDiv({ reducedMotion, ...props }) {
  const prefersReduced = useReducedMotion();
  const shouldReduce = reducedMotion ?? prefersReduced;

  if (shouldReduce) {
    const { initial, animate, whileInView, viewport, transition, variants, ...rest } = props;
    return <div {...rest} />;
  }

  return <motion.div {...props} />;
}

export function ScrollReveal({
  children,
  className,
  variant = slideUp,
  delay = 0,
  once = true,
  amount = 0.2,
  as: Component = motion.div,
  ...props
}) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={variant}
      transition={{ delay }}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerReveal({ children, className, once = true, amount = 0.15 }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, independent = false }) {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  if (independent) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        animate="visible"
        variants={staggerItem}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div className={className} variants={staggerItem}>
      {children}
    </motion.div>
  );
}

export { motion, EASE_LUXURY };
