import type { PhysicalCompositionNodeData } from "@spaghettilab/physical-composition-model";
import { Cpu, Plug, Rows3, Thermometer, Zap, type LucideIcon } from "lucide-react";

/**
 * `ux/screens/S050-physical-composition/visual.md` § Canvas — tipi di nodo hardware.
 * Only five kinds exist in `PhysicalCompositionNodeData` (`@spaghettilab/physical-
 * composition-model`) — the spec's table lists six ("Core", "Function Bay" as
 * separate node types), but neither is a real node kind in the domain model: the
 * Core is implicit (selected via the header `CoreSelector`, same pattern as
 * `UI-S040`), and a Function Bay is only ever a numeric `bayId` referenced by a
 * Module's fields, never its own authoring entity — the same "no separate Port row"
 * gap already documented for `UI-S040`'s topology view. This screen renders the five
 * kinds the domain model actually has.
 */
export const NODE_KIND_CONFIG: Record<PhysicalCompositionNodeData["kind"], { readonly label: string; readonly colorVar: string; readonly icon: LucideIcon }> = {
  backbone: { label: "Backbone", colorVar: "#8A8F99", icon: Rows3 },
  "power-source": { label: "Power", colorVar: "#B36B00", icon: Zap },
  connector: { label: "Connector", colorVar: "#0EA5A0", icon: Plug },
  "external-device": { label: "Dispositivo esterno", colorVar: "#1F9D55", icon: Thermometer },
  module: { label: "Module", colorVar: "#3F77DA", icon: Cpu },
};
