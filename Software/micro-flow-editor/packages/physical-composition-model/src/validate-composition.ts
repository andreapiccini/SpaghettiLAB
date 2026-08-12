import type { TopologyIndex } from "@spaghettilab/catalog-model";
import { domainError, err, ok, type DomainError, type GraphNode, type Result } from "@spaghettilab/domain";
import { isModuleNodeData, type ModuleNodeData, type PhysicalCompositionNodeData } from "./entities.js";
import { PhysicalCompositionErrorCode } from "./errors.js";
import { requiresPowerAcknowledgement } from "./power.js";

export type ModuleTransport = "i2c" | "spi";

/**
 * `@spaghettilab/catalog-model`'s `ModuleDriverEntry` (the generic Module
 * Driver catalog entry) is only `{typeId, commandCount}` — no transport
 * field. Transport *does* exist one level down, on `GET_DEVICE_PROFILE`'s
 * response (`protocol-sdk`, firmware phase 325's declarative Device
 * Profiles), but `catalog-model` does not index it into `ProfileIndex` yet.
 * So unlike every other check in this file, transport classification cannot
 * be read through this package's current inputs and must come from the
 * caller — the same "caller-supplied, not invented" pattern
 * `@spaghettilab/editor-model`'s `checkHandleCompatibility` uses for
 * `installedCapabilities`. Omitted entirely, transport mismatch simply isn't
 * checked for that driver — never guessed.
 */
export type TransportOf = (driverTypeId: string) => ModuleTransport | undefined;

type ModuleNode = GraphNode<"physical-composition", string, ModuleNodeData>;

function moduleNodes(
  nodes: readonly GraphNode<"physical-composition", string, PhysicalCompositionNodeData>[],
): ModuleNode[] {
  return nodes.filter((n): n is ModuleNode => isModuleNodeData(n.data));
}

function failure(code: string, node: ModuleNode, remediation: string): DomainError {
  return domainError({ code, path: ["physical-composition", node.id], target: node.id, remediation });
}

/**
 * Validates a Physical Composition graph's Module placements against what
 * the Core actually declared (S050 point 2/3/4) and against each other —
 * every problem is collected, not just the first, matching
 * `validateProjectV1`'s precedent in `@spaghettilab/domain`.
 *
 * `acknowledgedModuleNodeIds` are the Module node IDs whose passive-power
 * placement (see `requiresPowerAcknowledgement`) a human has already
 * confirmed; omit an entry and that Module fails validation with
 * `MISSING_POWER_ACKNOWLEDGEMENT` rather than silently treating an
 * `UNMANAGED` rail as safe (S050 § Verifiche: "power passivo resta
 * UNVERIFIED e richiede acknowledgement dove previsto").
 */
export function validateComposition(
  nodes: readonly GraphNode<"physical-composition", string, PhysicalCompositionNodeData>[],
  topology: TopologyIndex,
  options?: {
    readonly transportOf?: TransportOf;
    readonly acknowledgedModuleNodeIds?: ReadonlySet<string>;
  },
): Result<void, readonly DomainError[]> {
  const errors: DomainError[] = [];
  const modules = moduleNodes(nodes);
  const acknowledged = options?.acknowledgedModuleNodeIds ?? new Set<string>();

  for (const node of modules) {
    const m = node.data;
    const flow = topology.flows.find((f) => f.portId === m.portId);
    if (!flow) {
      errors.push(failure(PhysicalCompositionErrorCode.PORT_NOT_DECLARED, node, `Port ${m.portId} is not declared by any Flow in the current topology`));
      continue;
    }

    const bay = flow.bays.find((b) => b.bayId === m.bayId);
    if (!bay) {
      errors.push(failure(PhysicalCompositionErrorCode.BAY_NOT_DECLARED, node, `Bay ${m.bayId} does not exist under Port ${m.portId}'s Flow`));
      continue;
    }

    const rail = bay.rails.find((r) => r.railId === m.railId);
    if (!rail) {
      errors.push(failure(PhysicalCompositionErrorCode.RAIL_NOT_DECLARED, node, `Rail ${m.railId} does not exist under Bay ${m.bayId}`));
      continue;
    }

    const transport = options?.transportOf?.(m.driverTypeId);
    if (transport === "i2c" && m.endpoint?.address === undefined) {
      errors.push(failure(PhysicalCompositionErrorCode.TRANSPORT_MISMATCH, node, `driver "${m.driverTypeId}" is classified as I2C and requires an address`));
    } else if (transport === "spi" && m.endpoint?.chipSelect === undefined) {
      errors.push(failure(PhysicalCompositionErrorCode.TRANSPORT_MISMATCH, node, `driver "${m.driverTypeId}" is classified as SPI and requires a chip-select`));
    }

    if (requiresPowerAcknowledgement(rail.assurance) && !acknowledged.has(node.id)) {
      errors.push(
        failure(
          PhysicalCompositionErrorCode.MISSING_POWER_ACKNOWLEDGEMENT,
          node,
          `Rail ${m.railId} is passive (firmware cannot verify it) — acknowledge this Module's power placement explicitly before deploy`,
        ),
      );
    }
  }

  errors.push(...findEndpointCollisions(modules));
  errors.push(...findModuleKeyConflicts(modules));

  return errors.length > 0 ? err(errors) : ok(undefined);
}

/** Two Modules sharing an endpoint identity (I2C address / SPI chip-select) on the same Port collide; distinct addresses on the same Port are explicitly valid (S050 § Verifiche). A Module with neither `address` nor `chipSelect` set has no endpoint identity to collide on and is skipped here — that gap is `TRANSPORT_MISMATCH`'s job, not this one's. */
function findEndpointCollisions(modules: readonly ModuleNode[]): DomainError[] {
  const byPortAndKey = new Map<string, ModuleNode[]>();
  for (const node of modules) {
    const key = node.data.endpoint?.address ?? node.data.endpoint?.chipSelect;
    if (key === undefined) continue;
    const groupKey = `${node.data.portId}:${key}`;
    const group = byPortAndKey.get(groupKey) ?? [];
    group.push(node);
    byPortAndKey.set(groupKey, group);
  }
  const errors: DomainError[] = [];
  for (const group of byPortAndKey.values()) {
    if (group.length <= 1) continue;
    for (const node of group) {
      errors.push(failure(PhysicalCompositionErrorCode.ENDPOINT_COLLISION, node, `endpoint on Port ${node.data.portId} is shared by ${group.length} Modules: ${group.map((n) => n.id).join(", ")}`));
    }
  }
  return errors;
}

function findModuleKeyConflicts(modules: readonly ModuleNode[]): DomainError[] {
  const byKey = new Map<number, ModuleNode[]>();
  for (const node of modules) {
    if (node.data.moduleKey === undefined || node.data.moduleKey === 0) continue;
    const group = byKey.get(node.data.moduleKey) ?? [];
    group.push(node);
    byKey.set(node.data.moduleKey, group);
  }
  const errors: DomainError[] = [];
  for (const group of byKey.values()) {
    if (group.length <= 1) continue;
    for (const node of group) {
      errors.push(failure(PhysicalCompositionErrorCode.MODULE_KEY_CONFLICT, node, `moduleKey ${node.data.moduleKey} is shared by ${group.length} Modules: ${group.map((n) => n.id).join(", ")}`));
    }
  }
  return errors;
}
