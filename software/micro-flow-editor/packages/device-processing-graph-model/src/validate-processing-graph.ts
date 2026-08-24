import { domainError, err, ok, type DomainError, type GraphEdge, type GraphNode, type GraphState, type Result } from "@spaghettilab/domain";
import { checkHandleCompatibility } from "@spaghettilab/editor-model";
import { isRuleNodeData, moduleReferenceOf, type DeviceProcessingNodeData } from "./entities.js";
import { DeviceProcessingGraphErrorCode } from "./errors.js";
import type { ProcessingPort, ResolveProcessingNodeDescriptor } from "./ports.js";

type Node = GraphNode<"device-processing", string, DeviceProcessingNodeData>;
type Edge = GraphEdge<"device-processing", string, string>;

function failure(code: string, path: string[], target: string, remediation: string): DomainError {
  return domainError({ code, path: ["device-processing-graph", ...path], target, remediation });
}

/**
 * Depth-first cycle detection with an explicit color map (white/gray/black)
 * so the report can name every node/edge on the actual cycle path, not just
 * announce "a cycle exists somewhere" (S071 § Verifiche: "un ciclo... è
 * rifiutato con errore che punta al nodo/edge coinvolto").
 */
function findCycles(nodes: readonly Node[], edges: readonly Edge[]): DomainError[] {
  const outgoing = new Map<string, Edge[]>();
  for (const edge of edges) {
    const list = outgoing.get(edge.source) ?? [];
    list.push(edge);
    outgoing.set(edge.source, list);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>(nodes.map((n) => [n.id, WHITE]));
  const stack: string[] = [];
  const errors: DomainError[] = [];

  function visit(nodeId: string): void {
    color.set(nodeId, GRAY);
    stack.push(nodeId);
    for (const edge of outgoing.get(nodeId) ?? []) {
      const targetColor = color.get(edge.target);
      if (targetColor === GRAY) {
        const cycleStart = stack.indexOf(edge.target);
        const cyclePath = [...stack.slice(cycleStart), edge.target];
        errors.push(
          failure(
            DeviceProcessingGraphErrorCode.CYCLE,
            ["edges", edge.id],
            edge.id,
            `edge "${edge.id}" closes a cycle: ${cyclePath.join(" -> ")}`,
          ),
        );
      } else if (targetColor === WHITE) {
        visit(edge.target);
      }
    }
    stack.pop();
    color.set(nodeId, BLACK);
  }

  for (const node of nodes) {
    if (color.get(node.id) === WHITE) visit(node.id);
  }
  return errors;
}

function findPort(ports: readonly ProcessingPort[], handleId: string | undefined): ProcessingPort | undefined {
  if (handleId !== undefined) return ports.find((p) => p.handleId === handleId);
  return ports.length === 1 ? ports[0] : undefined;
}

export type ValidateDeviceProcessingGraphOptions = {
  /** Module node IDs known to exist in this Core's `"physical-composition"` graph — anything else is a dangling cross-graph reference. */
  readonly knownModuleNodeIds: ReadonlySet<string>;
  readonly resolveDescriptor?: ResolveProcessingNodeDescriptor;
  readonly installedCapabilities?: ReadonlySet<string>;
  /** Kconfig-tunable in firmware, not wire data — omit to skip the check, matching every other Kconfig-derived cap in this codebase (see `@spaghettilab/device-profile-authoring-model`'s `maxOperationCount`). */
  readonly maxFanOut?: number;
};

/**
 * Validates a Device Processing graph before it is ever handed to the
 * Config compiler (S072) — collects every problem instead of stopping at
 * the first, matching `@spaghettilab/domain`'s `validateProjectV1`
 * precedent. Cross-Core edges need no check here: each Core gets its own
 * `Graph` instance (`project.deviceGraphs[i]`), so a foreign-Core node ID is
 * structurally impossible to reference — `Graph.addEdge` already rejects it
 * as a dangling endpoint before this function ever runs.
 */
export function validateDeviceProcessingGraph(
  graphState: GraphState<"device-processing">,
  options: ValidateDeviceProcessingGraphOptions,
): Result<void, readonly DomainError[]> {
  const errors: DomainError[] = [];
  const nodes = graphState.nodes as readonly Node[];
  const edges = graphState.edges as readonly Edge[];
  const nodesById = new Map(nodes.map((n) => [n.id, n]));

  const triggersByModule = new Map<string, Node[]>();
  for (const node of nodes) {
    const moduleNodeId = moduleReferenceOf(node.data);
    if (moduleNodeId === undefined) continue;
    if (!options.knownModuleNodeIds.has(moduleNodeId)) {
      errors.push(
        failure(
          DeviceProcessingGraphErrorCode.DANGLING_MODULE_REFERENCE,
          ["nodes", node.id],
          moduleNodeId,
          `node "${node.id}" references Module "${moduleNodeId}", which is not in this Core's physical-composition graph`,
        ),
      );
      continue;
    }
    const group = triggersByModule.get(moduleNodeId) ?? [];
    group.push(node);
    triggersByModule.set(moduleNodeId, group);
  }
  for (const group of triggersByModule.values()) {
    if (group.length <= 1) continue;
    for (const node of group) {
      errors.push(
        failure(
          DeviceProcessingGraphErrorCode.DUPLICATE_MODULE_TRIGGER,
          ["nodes", node.id],
          node.id,
          `Module is triggered by ${group.length} nodes: ${group.map((n) => n.id).join(", ")} — a Module can have only one Schedule/Event-source binding`,
        ),
      );
    }
  }

  for (const node of nodes) {
    if (!isRuleNodeData(node.data)) continue;
    if (node.data.commandTarget !== undefined) {
      const target = node.data.commandTarget.moduleNodeId;
      if (!options.knownModuleNodeIds.has(target)) {
        errors.push(
          failure(
            DeviceProcessingGraphErrorCode.DANGLING_MODULE_REFERENCE,
            ["nodes", node.id, "commandTarget"],
            target,
            `Rule "${node.id}"'s command target references Module "${target}", which is not in this Core's physical-composition graph`,
          ),
        );
      }
    }
    if (node.data.sourceReference !== undefined) {
      const source = node.data.sourceReference.moduleNodeId;
      if (!options.knownModuleNodeIds.has(source)) {
        errors.push(
          failure(
            DeviceProcessingGraphErrorCode.DANGLING_MODULE_REFERENCE,
            ["nodes", node.id, "sourceReference"],
            source,
            `Rule "${node.id}"'s source reference references Module "${source}", which is not in this Core's physical-composition graph`,
          ),
        );
      }
    }
  }

  errors.push(...findCycles(nodes, edges));

  for (const edge of edges) {
    const sourceNode = nodesById.get(edge.source);
    if (sourceNode && isRuleNodeData(sourceNode.data)) {
      errors.push(
        failure(
          DeviceProcessingGraphErrorCode.OUTPUT_NODE_AS_SOURCE,
          ["edges", edge.id],
          edge.source,
          `Rule "${edge.source}" has no output ports — it can never be an edge source`,
        ),
      );
      continue;
    }
    const targetNodeForRuleCheck = nodesById.get(edge.target);
    if (targetNodeForRuleCheck && isRuleNodeData(targetNodeForRuleCheck.data)) {
      errors.push(
        failure(
          DeviceProcessingGraphErrorCode.RULE_AS_EDGE_TARGET,
          ["edges", edge.id],
          edge.target,
          `Rule "${edge.target}" has no input port — on the wire, target_key is always a Block key; a Rule reads its source via "sourceReference", not an edge`,
        ),
      );
      continue;
    }
    if (!options.resolveDescriptor || !sourceNode) continue;
    const targetNode = nodesById.get(edge.target);
    if (!targetNode) continue;

    const sourceDescriptor = options.resolveDescriptor(sourceNode);
    if (sourceDescriptor && sourceDescriptor.outputs.length === 0) {
      errors.push(
        failure(
          DeviceProcessingGraphErrorCode.OUTPUT_NODE_AS_SOURCE,
          ["edges", edge.id],
          edge.source,
          `"${edge.source}" declares no output ports — it can never be an edge source`,
        ),
      );
      continue;
    }
    const targetDescriptor = options.resolveDescriptor(targetNode);
    if (!sourceDescriptor || !targetDescriptor) continue;

    const sourcePort = findPort(sourceDescriptor.outputs, edge.sourceHandle);
    const targetPort = findPort(targetDescriptor.inputs, edge.targetHandle);
    if (!sourcePort || !targetPort) {
      errors.push(
        failure(
          DeviceProcessingGraphErrorCode.UNKNOWN_HANDLE,
          ["edges", edge.id],
          edge.sourceHandle ?? edge.targetHandle ?? edge.id,
          `edge "${edge.id}" references a handle that doesn't exist on its source/target node's descriptor`,
        ),
      );
      continue;
    }

    const compatibility = checkHandleCompatibility(sourcePort, targetPort, options.installedCapabilities);
    if (!compatibility.ok) errors.push(compatibility.error);
  }

  if (options.resolveDescriptor) {
    const incomingByTarget = new Map<string, Edge[]>();
    for (const edge of edges) {
      const list = incomingByTarget.get(edge.target) ?? [];
      list.push(edge);
      incomingByTarget.set(edge.target, list);
    }
    for (const node of nodes) {
      const descriptor = options.resolveDescriptor(node);
      if (!descriptor) continue;
      const incoming = incomingByTarget.get(node.id) ?? [];
      for (const input of descriptor.inputs) {
        if (!input.required) continue;
        const connected = incoming.some((e) => (e.targetHandle ?? (descriptor.inputs.length === 1 ? input.handleId : undefined)) === input.handleId);
        if (!connected) {
          errors.push(
            failure(
              DeviceProcessingGraphErrorCode.MISSING_REQUIRED_INPUT,
              ["nodes", node.id, input.handleId],
              input.handleId,
              `"${node.id}" requires an incoming edge on input "${input.handleId}"`,
            ),
          );
        }
      }
    }
  }

  if (options.maxFanOut !== undefined) {
    const outgoingCount = new Map<string, number>();
    for (const edge of edges) {
      outgoingCount.set(edge.source, (outgoingCount.get(edge.source) ?? 0) + 1);
    }
    for (const [nodeId, count] of outgoingCount) {
      if (count > options.maxFanOut) {
        errors.push(
          failure(
            DeviceProcessingGraphErrorCode.FAN_OUT_EXCEEDED,
            ["nodes", nodeId],
            String(count),
            `"${nodeId}" has ${count} outgoing edges, exceeding the supplied cap ${options.maxFanOut}`,
          ),
        );
      }
    }
  }

  return errors.length > 0 ? err(errors) : ok(undefined);
}
