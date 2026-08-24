import type { Transition } from "motion/react";

/** UX_ARCHITECTURE.md § Sistema di animazione — every animation in the app uses one of these, never a one-off spring/duration typed inline. */
export const motionTokens = {
  spring: {
    snappy: { type: "spring", stiffness: 500, damping: 35 } satisfies Transition,
    smooth: { type: "spring", stiffness: 300, damping: 30 } satisfies Transition,
    bouncy: { type: "spring", stiffness: 400, damping: 18 } satisfies Transition,
  },
  duration: {
    fast: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
    base: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
  },
  stagger: {
    list: 0.03,
  },
} as const;
