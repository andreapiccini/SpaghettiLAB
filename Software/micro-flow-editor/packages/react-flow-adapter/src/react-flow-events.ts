import { domainError, err, type DomainError, type GraphLayer, type ProjectCommand, type Result } from "@spaghettilab/domain";
import { checkHandleCompatibility, type HandleDescriptor } from "@spaghettilab/editor-model";
import type { Connection, EdgeChange, NodeChange } from "@xyflow/react";
import {
  addGraphEdgeCommand,
  removeGraphEdgeCommand,
  removeGraphNodeCommand,
  updateAuthoringMetadataCommand,
} from "./graph-commands.js";
import type { GraphLens } from "./graph-lens.js";

/**
 * Turns React Flow's `onNodesChange` payload into `ProjectCommand`s (S043
 * point 1). `position`/`select` changes never touch the graph — they become
 * `updateAuthoringMetadataCommand` only. `remove` becomes a real graph
 * mutation (cascade-removing dependent edges). `dimensions`/`add`/`replace`
 * changes are React Flow's own rendering bookkeeping, not something this
 * adapter turns into a command — they carry no domain-meaningful
 * information (S043 § Verifiche: React Flow state must never become the
 * authoritative source).
 */
export function nodeChangesToCommands<Layer extends GraphLayer>(
  changes: readonly NodeChange[],
  lens: GraphLens<Layer>,
): ProjectCommand[] {
  const commands: ProjectCommand[] = [];
  for (const change of changes) {
    if (change.type === "position" && change.position) {
      commands.push(updateAuthoringMetadataCommand(change.id, { position: change.position }));
    } else if (change.type === "select") {
      commands.push(updateAuthoringMetadataCommand(change.id, { selected: change.selected }));
    } else if (change.type === "remove") {
      commands.push(removeGraphNodeCommand(lens, change.id));
    }
  }
  return commands;
}

export function edgeChangesToCommands<Layer extends GraphLayer>(
  changes: readonly EdgeChange[],
  lens: GraphLens<Layer>,
): ProjectCommand[] {
  const commands: ProjectCommand[] = [];
  for (const change of changes) {
    if (change.type === "select") {
      commands.push(updateAuthoringMetadataCommand(change.id, { selected: change.selected }));
    } else if (change.type === "remove") {
      commands.push(removeGraphEdgeCommand(lens, change.id));
    }
  }
  return commands;
}

/**
 * Turns React Flow's `onConnect` payload into a command — but only after
 * checking handle compatibility (S042's compatibility engine), never adding
 * an edge React Flow merely proposed without domain validation. Both
 * handles must be resolvable: today's `EditorModel` reports no real handle
 * data yet (see `editor-model`'s README), so `resolveHandle` returning
 * `undefined` for either side means compatibility genuinely cannot be
 * verified — this rejects rather than optimistically allowing an
 * unverifiable connection through.
 */
export function connectionToCommand<Layer extends GraphLayer>(
  connection: Connection,
  edgeId: string,
  lens: GraphLens<Layer>,
  resolveHandle: (nodeId: string, handleId: string | null) => HandleDescriptor | undefined,
  installedCapabilities?: ReadonlySet<string>,
): Result<ProjectCommand, DomainError> {
  const source = resolveHandle(connection.source, connection.sourceHandle);
  const target = resolveHandle(connection.target, connection.targetHandle);
  if (!source || !target) {
    return err(
      domainError({
        code: "react-flow-adapter.connection.handle_unresolved",
        path: ["connection", connection.source, connection.target],
        target: connection.target,
        remediation: "handle metadata is not available yet for one or both ends of this connection — compatibility cannot be verified",
      }),
    );
  }
  const compatibility = checkHandleCompatibility(source, target, installedCapabilities);
  if (!compatibility.ok) return compatibility;

  return {
    ok: true,
    value: addGraphEdgeCommand(lens, {
      id: edgeId,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
    }),
  };
}
