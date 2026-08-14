import { bytesToHex } from "@spaghettilab/core-session";
import type { AuthoringMetadata, CoreBindingRecord, GraphState } from "@spaghettilab/domain";
import { checkFieldCompatibility, LinkCompatibility, revalidateLink, type FieldRegistry } from "@spaghettilab/system-automation-graph";
import { addGraphEdgeCommand, addGraphNodeCommand, nodeChangesToCommands, systemAutomationGraphLens, toReactFlowEdges } from "@spaghettilab/react-flow-adapter";
import { applyNodeChanges, Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, type Connection, type Edge, type Node, type NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AlertTriangle, Plus, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useCoreSessions } from "../../state/core-sessions-context.js";
import { useSession } from "../../state/session-context.js";
import { CROSS_CORE_NODE_TYPES } from "./CrossCoreNode.js";
import type { AppLink, LinkMeta } from "./link-meta.js";
import type { CrossCoreNodeData } from "./node-data.js";
import { NodeCreateDialog } from "./NodeCreateDialog.js";
import { toCrossCoreNodes, type CrossCoreRfNodeData } from "./to-nodes.js";

const EMPTY_GRAPH: GraphState<"system-automation"> = { layer: "system-automation", nodes: [], edges: [] };
const EMPTY_BINDINGS: readonly CoreBindingRecord[] = [];
const EMPTY_METADATA: Readonly<Record<string, AuthoringMetadata>> = {};

/**
 * `ux/screens/S110-cross-core-automation/visual.md` § Tab Grafo, cablato su
 * `@spaghettilab/system-automation-graph` (S111, reale). Gap dichiarato:
 * `GraphEdge` (`domain/src/graph.ts`) non ha un campo `data` generico — solo
 * `{layer, id, source, target, sourceHandle?, targetHandle?}` — quindi
 * `transformation`/`validatedFingerprints` di un `SystemAutomationLink` non
 * possono essere persistiti in `ProjectV1` insieme all'edge stesso. Restano
 * in stato React locale (`linkMeta`, sollevato al livello screen) — un
 * ricaricamento del progetto perde trasformazione e fingerprint validati, e
 * ogni edge ricaricato appare STALE finché non lo rivalidi di nuovo.
 */
export function GraphTab({
  linkMeta,
  setLinkMeta,
}: {
  readonly linkMeta: ReadonlyMap<string, LinkMeta>;
  readonly setLinkMeta: (updater: (prev: Map<string, LinkMeta>) => Map<string, LinkMeta>) => void;
}) {
  return (
    <ReactFlowProvider>
      <GraphTabInner linkMeta={linkMeta} setLinkMeta={setLinkMeta} />
    </ReactFlowProvider>
  );
}

function GraphTabInner({ linkMeta, setLinkMeta }: { readonly linkMeta: ReadonlyMap<string, LinkMeta>; readonly setLinkMeta: (updater: (prev: Map<string, LinkMeta>) => Map<string, LinkMeta>) => void }) {
  const { session, execute } = useSession();
  const { rows, getSnapshot } = useCoreSessions();
  const bindings = session?.stack.current.coreBindings ?? EMPTY_BINDINGS;
  const graphState: GraphState<"system-automation"> = session?.stack.current.systemAutomationGraph ?? EMPTY_GRAPH;
  const authoringMetadata = session?.stack.current.authoringMetadata ?? EMPTY_METADATA;

  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const domainRfNodes = useMemo(() => toCrossCoreNodes(graphState, authoringMetadata, bindings), [graphState, authoringMetadata, bindings]);
  const [localNodes, setLocalNodes] = useState<Node<CrossCoreRfNodeData>[]>(domainRfNodes);
  const [syncedFrom, setSyncedFrom] = useState(domainRfNodes);
  if (domainRfNodes !== syncedFrom) {
    setSyncedFrom(domainRfNodes);
    setLocalNodes(domainRfNodes);
  }

  const currentFingerprints = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bindings) {
      const fp = getSnapshot(b.bindingId)?.catalog?.fingerprint;
      if (fp) map.set(b.bindingId, bytesToHex(fp));
    }
    return map;
  }, [bindings, rows, getSnapshot]);

  const registry: FieldRegistry = useMemo(() => {
    const byField = new Map<string, { valueType: string; unit?: string }>();
    const byCommand = new Map<string, { valueType?: string; unit?: string }>();
    for (const node of graphState.nodes) {
      const d = node.data as CrossCoreNodeData;
      if (d.kind === "record-field") byField.set(`${d.schemaId}:${d.schemaVersion}:${d.fieldId}`, { valueType: d.valueType, unit: d.unit });
      if (d.kind === "command") byCommand.set(`${d.moduleKey}:${d.commandId}`, { valueType: d.valueType, unit: d.unit });
    }
    return {
      resolveField: (schemaId, schemaVersion, fieldId) => {
        const f = byField.get(`${schemaId}:${schemaVersion}:${fieldId}`);
        return f ? { schemaId, schemaVersion, fieldId, ...f } : undefined;
      },
      resolveCommand: (moduleKey, commandId) => {
        const c = byCommand.get(`${moduleKey}:${commandId}`);
        return c ? { moduleKey, commandId, ...c } : undefined;
      },
    };
  }, [graphState.nodes]);

  const links: readonly { readonly edgeId: string; readonly link: AppLink | null }[] = useMemo(() => {
    return graphState.edges.map((edge) => {
      const sourceNode = graphState.nodes.find((n) => n.id === edge.source);
      const targetNode = graphState.nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return { edgeId: edge.id, link: null };
      const meta = linkMeta.get(edge.id);
      const link: AppLink = {
        id: edge.id,
        source: sourceNode.data as CrossCoreNodeData,
        target: targetNode.data as CrossCoreNodeData,
        transformation: meta?.transformation,
        validatedFingerprints: meta?.validatedFingerprints ?? new Map(),
      };
      return { edgeId: edge.id, link };
    });
  }, [graphState, linkMeta]);

  const edges: Edge[] = useMemo(() => {
    const base = toReactFlowEdges(graphState);
    return base.map((e) => {
      const found = links.find((l) => l.edgeId === e.id)?.link;
      if (!found) return e;
      const compat = checkFieldCompatibility(descriptorOf(found.source, registry), descriptorOf(found.target, registry), found.transformation);
      const staleness = revalidateLink(found, currentFingerprints);
      const incomplete = compat.kind === LinkCompatibility.INCOMPATIBLE;
      const stale = staleness.kind === "STALE";
      return {
        ...e,
        label: found.transformation ? found.transformation : stale ? "non rivalidato" : undefined,
        animated: false,
        style: { stroke: incomplete ? "var(--color-error)" : stale ? "var(--color-warning)" : "var(--color-ink-faint)", strokeDasharray: incomplete || stale ? "4 3" : undefined },
      };
    });
  }, [graphState, links, registry, currentFingerprints]);

  function onNodesChange(changes: NodeChange<Node<CrossCoreRfNodeData>>[]) {
    setLocalNodes((nds) => applyNodeChanges(changes, nds));
    if (!execute) return;
    const committable = changes.filter((c) => !(c.type === "position" && c.dragging === true));
    const commands = nodeChangesToCommands(committable, systemAutomationGraphLens);
    for (const command of commands) execute(command);
  }

  function onConnect(connection: Connection) {
    if (!execute || !connection.source || !connection.target) return;
    const sourceNode = graphState.nodes.find((n) => n.id === connection.source);
    const targetNode = graphState.nodes.find((n) => n.id === connection.target);
    if (!sourceNode || !targetNode) return;
    const sourceEndpoint = sourceNode.data as CrossCoreNodeData;
    const targetEndpoint = targetNode.data as CrossCoreNodeData;

    let transformation: string | undefined;
    const compat = checkFieldCompatibility(descriptorOf(sourceEndpoint, registry), descriptorOf(targetEndpoint, registry));
    if (compat.kind === LinkCompatibility.INCOMPATIBLE) {
      const typed = window.prompt(`${compat.reason}\n\nInserisci una trasformazione esplicita (es. "celsius-to-fahrenheit") per collegare comunque:`);
      if (!typed || !typed.trim()) return;
      transformation = typed.trim();
    }

    const edgeId = `link-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    setError(null);
    execute(addGraphEdgeCommand(systemAutomationGraphLens, { id: edgeId, source: connection.source, target: connection.target }));
    setLinkMeta((prev) => {
      const next = new Map(prev);
      next.set(edgeId, { transformation, validatedFingerprints: new Map(currentFingerprints) });
      return next;
    });
  }

  function handleCreateNode(data: CrossCoreNodeData) {
    if (!execute) return;
    const id = `cc-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    execute(addGraphNodeCommand(systemAutomationGraphLens, { layer: "system-automation", id, data }));
    execute({ kind: "UpdateAuthoringMetadata", apply: (project) => ({ ok: true, value: { ...project, authoringMetadata: { ...project.authoringMetadata, [id]: { position: { x: 80, y: 80 } } } } }) });
  }

  function handleRevalidate(edgeId: string, link: AppLink) {
    setLinkMeta((prev) => {
      const next = new Map(prev);
      const updated = new Map(link.validatedFingerprints);
      for (const [k, v] of currentFingerprints) updated.set(k, v);
      next.set(edgeId, { transformation: link.transformation, validatedFingerprints: updated });
      return next;
    });
  }

  const staleLinks = links.filter((l) => l.link && revalidateLink(l.link, currentFingerprints).kind === "STALE");

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div className="flex flex-col gap-2 border-r border-border bg-surface p-2">
        <button type="button" title="+ Nodo" onClick={() => setCreateOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-slsm text-ink-muted hover:bg-surface-raised">
          <Plus size={18} />
        </button>
      </div>

      <div className="relative flex-1">
        <ReactFlow nodeTypes={CROSS_CORE_NODE_TYPES} nodes={localNodes} edges={edges} onNodesChange={onNodesChange} onConnect={onConnect} deleteKeyCode={["Backspace", "Delete"]} fitView>
          <Background gap={20} color="#E1E4EB" />
          <Controls position="bottom-left" />
          <MiniMap position="bottom-right" nodeColor={(n) => (n.data as CrossCoreRfNodeData).colorVar} />
        </ReactFlow>

        {staleLinks.length > 0 && (
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            {staleLinks.map(({ edgeId, link }) => (
              <div key={edgeId} className="flex items-center gap-2 rounded-slmd border border-warning bg-surface px-3 py-2 shadow-e1" style={{ backgroundColor: "color-mix(in srgb, var(--color-warning) 6%, var(--color-surface))" }}>
                <AlertTriangle size={14} className="text-warning" />
                <span className="font-body text-xs text-ink">Link non rivalidato</span>
                <button type="button" onClick={() => link && handleRevalidate(edgeId, link)} className="flex items-center gap-1 rounded-slsm border border-border-strong px-2 py-1 font-body text-xs text-ink hover:bg-surface-raised">
                  <RefreshCcw size={11} />
                  Rivalida
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="absolute bottom-2 left-2 font-body text-xs text-error">{error}</p>}
      </div>

      {createOpen && <NodeCreateDialog bindings={bindings} onCreate={handleCreateNode} onClose={() => setCreateOpen(false)} />}
    </div>
  );
}

function descriptorOf(endpoint: CrossCoreNodeData, registry: FieldRegistry): { readonly valueType?: string; readonly unit?: string } {
  if (endpoint.kind === "nodered") return {};
  if (endpoint.kind === "record-field") return registry.resolveField(endpoint.schemaId, endpoint.schemaVersion, endpoint.fieldId) ?? { valueType: endpoint.valueType, unit: endpoint.unit };
  return registry.resolveCommand(endpoint.moduleKey, endpoint.commandId) ?? { valueType: endpoint.valueType, unit: endpoint.unit };
}
