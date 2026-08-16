// Matches ProcessingNode.tsx's own rendered size (`w-56` = 224px; height is
// intrinsic there, this is a close-enough constant for layout math, not a
// pixel-exact one). Shared by event-containers.ts and node-overlap.ts so the
// two stay consistent with each other.
export const NODE_WIDTH = 224;
export const NODE_HEIGHT = 64;
export const NODE_PADDING = 24;
export const EVENT_CONTAINER_HEADER_HEIGHT = 32;
/** Minimum gap between two processing-node cards — they must never share pixels. */
export const NODE_GAP = 16;
