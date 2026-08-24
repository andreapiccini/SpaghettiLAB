import type { CoreBindingId, CoreBindingRecord } from "@spaghettilab/domain";

/** `ux/screens/S110-cross-core-automation/visual.md` § Palette Core — fixed 6-color rotation, all already used elsewhere in the app (never new colors), assigned in `coreBindings` order. Repeats past 6 Core — a documented edge case, not solved here. */
const CORE_COLORS = ["#3F77DA", "#7C5CFC", "#0EA5A0", "#B36B00", "#1F9D55", "#00C4CC"] as const;

export function coreColor(bindings: readonly CoreBindingRecord[], coreBinding: CoreBindingId): string {
  const index = bindings.findIndex((b) => b.bindingId === coreBinding);
  return CORE_COLORS[index >= 0 ? index % CORE_COLORS.length : 0]!;
}
