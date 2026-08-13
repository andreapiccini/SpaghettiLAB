import { domainError, type DomainError, type GraphNode, type GraphState } from "@spaghettilab/domain";
import type { CanonicalConfig, PropertySet } from "@spaghettilab/config-compiler";
import { EdgeSourceKind } from "@spaghettilab/config-compiler";
import type { ModuleNodeData } from "@spaghettilab/physical-composition-model";
import type { BlockNodeData, DeviceProcessingNodeData, EventSourceNodeData, RuleNodeData, ScheduleNodeData } from "@spaghettilab/device-processing-graph-model";
import { ConfigDecompilerErrorCode } from "./errors.js";

type PhysicalNode = GraphNode<"physical-composition", string, ModuleNodeData>;
type ProcessingNode = GraphNode<"device-processing", string, DeviceProcessingNodeData>;

export type DecompileResult = {
  readonly physicalGraph: GraphState<"physical-composition">;
  readonly processingGraph: GraphState<"device-processing">;
  /**
   * Never silent: every field this decompiler could not recover, or had to
   * fill with a placeholder to satisfy a structurally-required field, is
   * reported here (S073 § Verifiche: "il decompiler non inventa mai
   * metadata di authoring che non può recuperare"). Severity follows
   * `@spaghettilab/domain`'s `DomainError.severity` — a `"warning"` marks a
   * placeholder that was still filled in (see `electricalMode` below);
   * an `"error"` marks a Module that could not be represented at all.
   */
  readonly issues: readonly DomainError[];
};

/** Zero-padded so lexicographic sort (what `compileConfig`'s key assignment uses) matches numeric key order regardless of how many entries exist — otherwise a decompile→recompile cycle could reassign different keys once a category passed 9 entries ("block-10" sorts before "block-2"). */
function padded(key: number): string {
  return String(key).padStart(5, "0");
}
function moduleNodeId(key: number): string {
  return `module-${padded(key)}`;
}
function blockNodeId(key: number): string {
  return `block-${padded(key)}`;
}
function ruleNodeId(key: number): string {
  return `rule-${padded(key)}`;
}
function scheduleNodeId(sourceKey: number): string {
  return `schedule-${padded(sourceKey)}`;
}
function eventSourceNodeId(sourceKey: number): string {
  return `event-source-${padded(sourceKey)}`;
}

function toRecord(properties: PropertySet): Record<string, unknown> {
  return { ...properties };
}

function issue(code: string, path: string[], target: string, remediation: string, severity: "error" | "warning" = "error"): DomainError {
  return domainError({ code, severity, path: ["config-decompiler", ...path], target, remediation });
}

/**
 * The inverse of `@spaghettilab/config-compiler`'s `compileConfig` — Config
 * → authoring graph. Synthesized node IDs (`module-<key>`, `block-<key>`,
 * ...) are stable across repeated decompiles of the same Config (needed for
 * a decompile→compile round trip to be reproducible), but they can never
 * match whatever UUID an original authoring session used — Config carries
 * no authoring identity at all, only integer keys. That is not "inventing
 * metadata": a graph needs *some* node ID to exist, and a deterministic one
 * derived from the only real identity Config has is the honest choice, not
 * a guess.
 *
 * Never produces `AuthoringMetadata` (position, viewport, selection, label,
 * grouping) — none of it exists in Config to recover, and this function
 * does not touch that store at all, matching S073 point 1 exactly.
 */
export function decompileConfig(
  config: CanonicalConfig,
  options?: {
    readonly resolveRuleActionFields?: (ruleTypeId: string) => { readonly targetKeyFieldId: number; readonly commandIdFieldId: number } | undefined;
    readonly resolveRuleSourceFields?: (ruleTypeId: string) => { readonly sourceKeyFieldId: number; readonly sourceFieldIdFieldId: number } | undefined;
  },
): DecompileResult {
  const issues: DomainError[] = [];
  const physicalNodes: PhysicalNode[] = [];

  for (const m of config.modules) {
    const id = moduleNodeId(m.key);
    if (m.bayId === undefined || m.powerRailId === undefined) {
      issues.push(
        issue(
          ConfigDecompilerErrorCode.UNSUPPORTED_PROPERTY_VALUE,
          ["modules", String(m.key)],
          id,
          `Module key ${m.key} has no bay_id/power_rail_id in this Config — cannot represent it as a physical-composition Module node without inventing one`,
        ),
      );
      continue;
    }
    issues.push(
      issue(
        ConfigDecompilerErrorCode.UNSUPPORTED_PROPERTY_VALUE,
        ["modules", String(m.key), "electricalMode"],
        id,
        `electricalMode is not part of struct spaghetti_module_config — it never survives compilation. Defaulted to "input-output" (the least presumptive choice); confirm the real value before deploying.`,
        "warning",
      ),
    );
    issues.push(
      issue(
        ConfigDecompilerErrorCode.MISSING_PROFILE,
        ["modules", String(m.key), "profileId"],
        id,
        `profileId is not recoverable from Config — the generic "declarative-device" driver's typeId doesn't distinguish which Device Profile is installed`,
        "warning",
      ),
    );
    physicalNodes.push({
      layer: "physical-composition",
      id,
      data: {
        kind: "module",
        driverTypeId: m.typeId,
        portId: m.portId,
        bayId: m.bayId,
        railId: m.powerRailId,
        electricalMode: "input-output",
        properties: toRecord(m.properties),
      },
    });
  }

  const processingNodes: ProcessingNode[] = [];
  const scheduledModuleKeys = new Set(config.schedules.map((s) => s.sourceKey));
  for (const s of config.schedules) {
    const data: ScheduleNodeData = { kind: "schedule", moduleNodeId: moduleNodeId(s.sourceKey), periodMs: s.periodMs, enabled: s.enabled };
    processingNodes.push({ layer: "device-processing", id: scheduleNodeId(s.sourceKey), data });
  }
  // A MODULE-kind edge source with no matching schedule entry must be an
  // Event-source trigger — Config's edges[] doesn't distinguish the two
  // (both are just "sourceKind: MODULE, sourceKey"), so this is inferred
  // from which module keys never registered a schedule, the only signal
  // available; never guessed beyond that. Deduplicated since one Module can
  // feed several edges.
  const inferredEventSourceKeys = new Set(
    config.edges.filter((e) => e.sourceKind === EdgeSourceKind.MODULE && !scheduledModuleKeys.has(e.sourceKey)).map((e) => e.sourceKey),
  );
  for (const moduleKey of inferredEventSourceKeys) {
    const data: EventSourceNodeData = { kind: "event-source", moduleNodeId: moduleNodeId(moduleKey) };
    processingNodes.push({ layer: "device-processing", id: eventSourceNodeId(moduleKey), data });
  }
  for (const b of config.blocks) {
    const data: BlockNodeData = { kind: "block", blockTypeId: b.typeId, minVersion: b.minVersion, exactVersion: b.exactVersion, properties: toRecord(b.properties) };
    processingNodes.push({ layer: "device-processing", id: blockNodeId(b.key), data });
  }
  for (const r of config.rules) {
    const properties = { ...r.properties };
    let commandTarget: RuleNodeData["commandTarget"];
    let sourceReference: RuleNodeData["sourceReference"];

    const actionFields = options?.resolveRuleActionFields?.(r.typeId);
    if (actionFields && properties[actionFields.targetKeyFieldId] !== undefined && properties[actionFields.commandIdFieldId] !== undefined) {
      const targetKey = Number(properties[actionFields.targetKeyFieldId]);
      const commandId = Number(properties[actionFields.commandIdFieldId]);
      commandTarget = { moduleNodeId: moduleNodeId(targetKey), commandId };
      delete properties[actionFields.targetKeyFieldId];
      delete properties[actionFields.commandIdFieldId];
    }
    const sourceFields = options?.resolveRuleSourceFields?.(r.typeId);
    if (sourceFields && properties[sourceFields.sourceKeyFieldId] !== undefined && properties[sourceFields.sourceFieldIdFieldId] !== undefined) {
      const sourceKey = Number(properties[sourceFields.sourceKeyFieldId]);
      const fieldId = Number(properties[sourceFields.sourceFieldIdFieldId]);
      sourceReference = { moduleNodeId: moduleNodeId(sourceKey), fieldId };
      delete properties[sourceFields.sourceKeyFieldId];
      delete properties[sourceFields.sourceFieldIdFieldId];
    }
    if (!actionFields || !sourceFields) {
      issues.push(
        issue(
          ConfigDecompilerErrorCode.UNSUPPORTED_PROPERTY_VALUE,
          ["rules", String(r.key)],
          ruleNodeId(r.key),
          `no resolveRuleActionFields/resolveRuleSourceFields mapping supplied for Rule type "${r.typeId}" — commandTarget/sourceReference left unresolved, raw field IDs kept in properties instead`,
          "warning",
        ),
      );
    }
    const data: RuleNodeData = { kind: "rule", ruleTypeId: r.typeId, properties, commandTarget, sourceReference };
    processingNodes.push({ layer: "device-processing", id: ruleNodeId(r.key), data });
  }

  const edges = config.edges.map((e, index) => ({
    layer: "device-processing" as const,
    id: `edge-${index}`,
    source:
      e.sourceKind === EdgeSourceKind.MODULE
        ? scheduledModuleKeys.has(e.sourceKey)
          ? scheduleNodeId(e.sourceKey)
          : eventSourceNodeId(e.sourceKey)
        : blockNodeId(e.sourceKey),
    target: blockNodeId(e.targetKey),
    sourceHandle: String(e.sourcePortOrField),
    targetHandle: String(e.targetInput),
  }));

  return {
    physicalGraph: { layer: "physical-composition", nodes: physicalNodes, edges: [] },
    processingGraph: { layer: "device-processing", nodes: processingNodes, edges },
    issues,
  };
}
