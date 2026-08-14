import type { DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import { Clock, GitBranch, Radio, SlidersHorizontal, type LucideIcon } from "lucide-react";

/**
 * `ux/screens/S070-processing-graph-editor/visual.md`'s "Set di blocchi placeholder"
 * (Trigger/Lettura/Elaborazione/Logica/Uscita, 11 fake blocks) is explicitly fake —
 * that prototype's own header says so ("tutti finti"). The real domain
 * (`@spaghettilab/device-processing-graph-model`) has exactly four node kinds,
 * grounded in firmware structs, not the UX taxonomy: `schedule`/`event-source`
 * collapse the UX's Trigger+Read into one node (no separate read-node/edge exists in
 * firmware), `block` is Elaborazione/Uscita depending on its (currently unexposed)
 * port descriptor, `rule` is always Logica/Uscita — a Rule has no output port at all,
 * structurally. Colors below are chosen to stay recognizable against the original
 * palette without claiming a five-category taxonomy the backend doesn't have.
 */
export const PROCESSING_NODE_KIND_CONFIG: Record<DeviceProcessingNodeData["kind"], { readonly label: string; readonly colorVar: string; readonly icon: LucideIcon }> = {
  schedule: { label: "Schedule", colorVar: "#7C5CFC", icon: Clock },
  "event-source": { label: "Event source", colorVar: "#3F77DA", icon: Radio },
  block: { label: "Block", colorVar: "#0EA5A0", icon: SlidersHorizontal },
  rule: { label: "Rule", colorVar: "#B36B00", icon: GitBranch },
};
