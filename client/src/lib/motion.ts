/**
 * Procure Logic — Awwwards-Caliber Motion System
 *
 * A unified physical motion and interaction language derived from high-end
 * creative agency websites and Swiss editorial systems.
 *
 * Core Tenets:
 *  1. Physical Continuity: Views transform dimensionally rather than flat-fading.
 *  2. Weight & Precision: Cubic-bezier curves and bounceless springs feel grounded.
 *  3. Orchestration: Child elements reveal in coordinated, deliberate cascades.
 *  4. Performance: Pure GPU transforms (`translate3d`, `scale`, `opacity`, `clip-path`).
 *  5. Accessibility: Strict suppression under `prefers-reduced-motion`.
 */

import type { Variants, Transition } from "framer-motion";

/** The signature cinematic easing family (weighty, editorial, fluid). */
export const EASE_CINEMATIC = [0.19, 1, 0.22, 1] as const;

/** Crisp, responsive cubic bezier for micro-interactions and buttons. */
export const EASE_PRECISE = [0.16, 1, 0.3, 1] as const;

/** Smooth deceleration for exits and fades. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Legacy alias for backwards compatibility. */
export const EASE = EASE_PRECISE;

/** Humanized durations (in seconds). */
export const DURATION = {
  micro: 0.16,
  quick: 0.24,
  base: 0.42,
  editorial: 0.58,
  slow: 0.72,
  exit: 0.2,
} as const;

/** Spring configurations tuned for tactile weight without cartoon bounciness. */
export const SPRING_TACTILE = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.8,
} as const;

export const SPRING_PILL = {
  type: "spring",
  stiffness: 440,
  damping: 34,
  mass: 0.7,
} as const;

export const SPRING_DRAWER = {
  type: "spring",
  stiffness: 320,
  damping: 35,
  mass: 0.85,
} as const;

export const SPRING_CARD = {
  type: "spring",
  stiffness: 300,
  damping: 28,
  mass: 0.8,
} as const;

/**
 * View-to-view transition primitives.
 *
 * Each view transforms along customized coordinate planes so switching views
 * feels like an architectural shift in space.
 */
export function viewTransition(opts: {
  enterY?: number;
  enterX?: number;
  enterScale?: number;
  exitX?: number;
  exitY?: number;
  exitScale?: number;
  flatExit?: boolean;
}): Variants {
  const {
    enterY = 24,
    enterX = 0,
    enterScale = 0.984,
    exitX = -24,
    exitY = 0,
    exitScale = 0.988,
    flatExit,
  } = opts;

  return {
    enter: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        duration: DURATION.base,
        ease: EASE_CINEMATIC,
      },
    },
    initial: {
      opacity: 0,
      x: enterX,
      y: enterY,
      scale: enterScale,
      filter: "blur(2px)",
    },
    exit: {
      opacity: 0,
      x: flatExit ? 0 : exitX,
      y: flatExit ? 0 : exitY,
      scale: flatExit ? 0.988 : exitScale,
      filter: "blur(2px)",
      transition: {
        duration: DURATION.exit,
        ease: EASE_OUT,
      },
    },
  };
}

/** Pre-configured semantic view transition presets. */
export const VIEW_TRANSITIONS = {
  overview: viewTransition({ enterY: 28, enterScale: 0.982, exitX: -28 }),
  compare: viewTransition({ enterX: 32, enterY: 0, enterScale: 0.99, exitX: -30 }),
  requirements: viewTransition({ enterY: 24, enterX: -16, exitX: -20, exitY: -8 }),
  risks: viewTransition({ enterY: 24, enterScale: 0.978, exitX: 24, exitY: -6 }),
  documents: viewTransition({ enterY: 20, enterX: 16, enterScale: 0.986, exitX: -22 }),
  audit: viewTransition({ enterY: 16, exitY: -12, flatExit: true }),
} as const;

/** Stagger parent container for coordinated reveals. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.04,
    },
  },
};

/** Faster stagger container for dense data grids and table rows. */
export const listContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

/** Metric cells stagger cascade. */
export const metricContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Standard fade-up item with subtle blur filter removal. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: DURATION.base,
      ease: EASE_CINEMATIC,
    },
  },
};

/** High-priority editorial element reveal with dimensional settle. */
export const editorialItem: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DURATION.editorial,
      ease: EASE_CINEMATIC,
    },
  },
};

/** Masked word container for editorial headlines. */
export const maskHeadline: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

/** Masked word reveal: rises from below its overflow-hidden clipping mask. */
export const maskWord: Variants = {
  hidden: { y: "115%", opacity: 0 },
  show: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: EASE_CINEMATIC,
    },
  },
};

/** Precision status beacon pulse. */
export const beaconPulse: Variants = {
  animate: {
    scale: [1, 1.35, 1],
    opacity: [0.75, 0.25, 0.75],
    transition: {
      duration: 2.2,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

/** Tab indicator spring layout physics. */
export const tabIndicator = SPRING_PILL;

/** Physical drawer panel slide-in with coordinated tension. */
export const drawerPanel = {
  initial: { x: "100%" },
  animate: { x: "0%" },
  exit: { x: "100%" },
  transition: SPRING_DRAWER,
} as const;

/** Modal open choreography with scale, dimensional lift, and fade. */
export const modalPanel = {
  initial: { opacity: 0, scale: 0.95, y: 14 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
  transition: { duration: DURATION.quick, ease: EASE_CINEMATIC },
} as const;

/** Overlay background dim and blur. */
export const overlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.22, ease: EASE_OUT },
} as const;

/** Card hover micro-interaction preset. */
export const cardHoverDynamics = {
  whileHover: {
    y: -3,
    scale: 1.006,
    transition: { duration: 0.2, ease: EASE_PRECISE },
  },
  whileTap: {
    y: 0,
    scale: 0.992,
    transition: { duration: 0.1, ease: EASE_PRECISE },
  },
};

/** Button hover micro-interaction preset. */
export const buttonHoverDynamics = {
  whileHover: {
    y: -1.5,
    scale: 1.015,
    transition: { duration: 0.16, ease: EASE_PRECISE },
  },
  whileTap: {
    y: 0.5,
    scale: 0.975,
    transition: { duration: 0.08, ease: EASE_PRECISE },
  },
};

/** Primary CTA magnetic button micro-interaction preset. */
export const buttonMagneticDynamics = {
  whileHover: {
    y: -2,
    scale: 1.02,
    boxShadow: "0 8px 24px -4px rgba(27, 99, 87, 0.28)",
    transition: { duration: 0.18, ease: EASE_PRECISE },
  },
  whileTap: {
    y: 0.5,
    scale: 0.975,
    transition: { duration: 0.08, ease: EASE_PRECISE },
  },
};

/** Fast dense grid stagger cascade. */
export const staggerDense: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02,
    },
  },
};

/** Icon forward nudge on hover. */
export const iconForwardDynamics = {
  whileHover: { x: 3 },
  transition: { duration: 0.18, ease: EASE_PRECISE },
};

/**
 * Converts a `useReducedMotion()` boolean into a set of overrides that collapse
 * every above variant onto a near-instant, non-translating state.
 */
export function reducedMotionVariants(reduce: boolean): Variants {
  if (!reduce) return {};
  return {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0 } },
  };
}
