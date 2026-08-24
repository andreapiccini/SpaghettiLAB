import type { FieldKind } from "./field-kind.js";

export type HandleDirection = "input" | "output";

/**
 * One connectable point on a node — a Block/Module input or output. Nothing
 * here is a hardcoded device concept: every field is declared per node type
 * by whatever produced the `NodeTypeDescriptor` (S042 point 1).
 */
export type HandleDescriptor = {
  readonly handleId: string;
  readonly direction: HandleDirection;
  readonly valueType: FieldKind;
  readonly unit?: string;
  readonly semanticGroup?: string;
  readonly referenceGroup?: string;
  readonly flowId?: number;
  /**
   * Opt-in: only when a handle's own descriptor sets this does
   * `checkHandleCompatibility` require both ends to share the same
   * `flowId`. There is no blanket "edges must stay within one Flow" rule —
   * a Rule commonly reads a sensor on one Flow and commands an actuator on
   * another — so this stays a declared, per-handle constraint rather than
   * an invented global one.
   */
  readonly requireSameFlow?: boolean;
  readonly requiredCapabilities?: readonly string[];
};
