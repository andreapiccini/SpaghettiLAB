import { encodeConfigCbor, sha256 } from "@spaghettilab/config-compiler";
import { dryRunConfig, type DryRunResult } from "@spaghettilab/config-decompiler";
import type { DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import type { CoreBindingId, CoreBindingRecord, GraphNode, GraphState } from "@spaghettilab/domain";
import { isModuleNodeData, type PhysicalCompositionNodeData } from "@spaghettilab/physical-composition-model";
import { findCatalogEntryById, shippedTypeIds, type ProcessingCatalogEntry } from "@spaghettilab/processing-block-catalog";
import { addGraphNodeCommand, deviceGraphLens, nodeChangesToCommands, removeGraphNodeCommand, toReactFlowEdges, updateGraphNodeCommand } from "@spaghettilab/react-flow-adapter";
import { applyNodeChanges, Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, type Node, type NodeChange, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CircleAlert, PlayCircle, Workflow } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { useSession } from "../../state/session-context.js";
import { DEFAULT_ENERGY, DISABLED_MQTT } from "../../lib/default-config-policy.js";
import { CoreSelector } from "../catalog-topology/CoreSelector.js";
import { PROCESSING_BLOCK_MIME, nodeDataFromCatalogEntry, snapToGrid } from "./catalog-to-node.js";
import { NodeInspector, type ProcessingInspectorMode } from "./NodeInspector.js";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";
import { ProcessingBlockPalette } from "./ProcessingBlockPalette.js";
import { PROCESSING_NODE_TYPES } from "./ProcessingNode.js";
import { toProcessingNodes, type ProcessingNodeUiData } from "./to-nodes.js";

const EMPTY_GRAPH: GraphState<"device-processing"> = { layer: "device-processing", nodes: [], edges: [] };
const EMPTY_PHYSICAL_GRAPH: GraphState<"physical-composition"> = { layer: "physical-composition", nodes: [], edges: [] };
const SHIPPED_TYPE_IDS = shippedTypeIds();

/**
 * `ux/screens/S070-processing-graph-editor/{visual,ui-behavior,backend-behavior}.md`
 * layout (260px palette, search, categorie) with the real functional catalog
 * (`@spaghettilab/processing-block-catalog`, S074) instead of the prototype's 11
 * fake blocks. Node kinds stay the four firmware-backed ones. Dry-run is local via
 * `@spaghettilab/config-compiler`/`config-decompiler` (S072/S073).
 */
export function ProcessingGraphScreen() {
  return (
    <ReactFlowProvider>
      <ProcessingGraphScreenInner />
    </ReactFlowProvider>
  );
}

function ProcessingGraphScreenInner() {
  const { session, execute, navigate } = useSession();
  const bindings = session?.stack.current.coreBindings ?? [];

  const [selectedId, setSelectedId] = useState<CoreBindingId | null>(bindings[0]?.bindingId ?? null);
  const selected: CoreBindingRecord | null = bindings.find((b) => b.bindingId === selectedId) ?? bindings[0] ?? null;
  const bindingIndex = selected ? bindings.findIndex((b) => b.bindingId === selected.bindingId) : -1;

  const [inspector, setInspector] = useState<ProcessingInspectorMode | null>(null);
  const [dryRun, setDryRun] = useState<DryRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [hashHex, setHashHex] = useState<string | null>(null);
  const [rf, setRf] = useState<ReactFlowInstance<Node<ProcessingNodeUiData>> | null>(null);
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number } | null>(null);

  const graphState: GraphState<"device-processing"> = (bindingIndex >= 0 ? session?.stack.current.deviceGraphs[bindingIndex] : undefined) ?? EMPTY_GRAPH;
  const physicalGraphState: GraphState<"physical-composition"> = (bindingIndex >= 0 ? session?.stack.current.physicalGraphs[bindingIndex] : undefined) ?? EMPTY_PHYSICAL_GRAPH;
  const domainNodes = graphState.nodes as readonly GraphNode<"device-processing", string, DeviceProcessingNodeData>[];
  const moduleNodes = physicalGraphState.nodes as readonly GraphNode<"physical-composition", string, PhysicalCompositionNodeData>[];
  const projectAuthoringMetadata = session?.stack.current.authoringMetadata;
  const authoringMetadata = useMemo(() => projectAuthoringMetadata ?? {}, [projectAuthoringMetadata]);

  const moduleOptions = useMemo(
    () =>
      moduleNodes
        .filter((n) => isModuleNodeData(n.data))
        .map((n) => ({ id: n.id, label: authoringMetadata[n.id]?.comment && authoringMetadata[n.id]!.comment!.trim() !== "" ? authoringMetadata[n.id]!.comment! : n.id })),
    [moduleNodes, authoringMetadata],
  );
  const knownModuleNodeIds = useMemo(() => new Set(moduleOptions.map((m) => m.id)), [moduleOptions]);
  const moduleLabel = useCallback((moduleNodeId: string) => moduleOptions.find((m) => m.id === moduleNodeId)?.label ?? moduleNodeId, [moduleOptions]);

  const errorsByNode = useMemo(() => {
    const map = new Map<string, string>();
    if (dryRun) for (const issue of dryRun.issues) for (const segment of issue.path) map.set(segment, issue.remediation);
    return map;
  }, [dryRun]);
  const errorCount = dryRun?.issues.filter((i) => i.severity !== "warning").length ?? 0;
  const warningCount = dryRun?.issues.filter((i) => i.severity === "warning").length ?? 0;

  const domainRfNodes = useMemo(() => toProcessingNodes(graphState, authoringMetadata, new Set(errorsByNode.keys()), moduleLabel), [graphState, authoringMetadata, errorsByNode, moduleLabel]);
  const edges = useMemo(() => toReactFlowEdges(graphState), [graphState]);

  const [localNodes, setLocalNodes] = useState<Node<ProcessingNodeUiData>[]>(domainRfNodes);
  const [syncedFrom, setSyncedFrom] = useState(domainRfNodes);
  if (domainRfNodes !== syncedFrom) {
    setSyncedFrom(domainRfNodes);
    setLocalNodes(domainRfNodes);
  }

  useEffect(() => {
    if (!session || bindingIndex < 0 || !execute) return;
    if (session.stack.current.deviceGraphs.length > bindingIndex) return;
    execute({
      kind: "RepairDeviceGraphAlignment",
      apply: (project) => {
        const physicalGraphs = [...project.physicalGraphs];
        const deviceGraphs = [...project.deviceGraphs];
        while (physicalGraphs.length <= bindingIndex) physicalGraphs.push({ layer: "physical-composition", nodes: [], edges: [] });
        while (deviceGraphs.length <= bindingIndex) deviceGraphs.push({ layer: "device-processing", nodes: [], edges: [] });
        return { ok: true, value: { ...project, physicalGraphs, deviceGraphs } };
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindingIndex, session?.stack.current.deviceGraphs.length]);

  function onNodesChange(changes: NodeChange<Node<ProcessingNodeUiData>>[]) {
    setLocalNodes((nds) => applyNodeChanges(changes, nds));
    if (!execute || bindingIndex < 0) return;
    const committable = changes.filter((c) => !(c.type === "position" && c.dragging === true));
    const commands = nodeChangesToCommands(committable, deviceGraphLens(bindingIndex));
    for (const command of commands) execute(command);
  }

  function onNodeClick(_: unknown, node: Node<ProcessingNodeUiData>) {
    const domainNode = domainNodes.find((n) => n.id === node.id);
    const meta = authoringMetadata[node.id];
    if (domainNode) setInspector({ kind: "edit", nodeId: node.id, data: domainNode.data, comment: meta?.comment ?? "" });
  }

  function placeFromCatalog(entry: ProcessingCatalogEntry, position = { x: 80, y: 80 }) {
    if (!execute || bindingIndex < 0) return;
    const data = nodeDataFromCatalogEntry(entry, moduleOptions[0]?.id);
    if (!data) return;
    const id = `dp-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    execute(addGraphNodeCommand(deviceGraphLens(bindingIndex), { layer: "device-processing", id, data }));
    execute({
      kind: "UpdateAuthoringMetadata",
      apply: (project) => ({
        ok: true,
        value: {
          ...project,
          authoringMetadata: {
            ...project.authoringMetadata,
            [id]: { comment: entry.label, position },
          },
        },
      }),
    });
    setInspector({ kind: "edit", nodeId: id, data, comment: entry.label });
  }

  function handleSave(data: DeviceProcessingNodeData, comment: string) {
    if (!execute || bindingIndex < 0) return;
    const lens = deviceGraphLens(bindingIndex);
    if (inspector?.kind === "edit") {
      execute(updateGraphNodeCommand(lens, { layer: "device-processing", id: inspector.nodeId, data }));
      execute({
        kind: "UpdateAuthoringMetadata",
        apply: (project) => ({ ok: true, value: { ...project, authoringMetadata: { ...project.authoringMetadata, [inspector.nodeId]: { ...project.authoringMetadata[inspector.nodeId], comment } } } }),
      });
    } else if (inspector) {
      const id = `dp-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      execute(addGraphNodeCommand(lens, { layer: "device-processing", id, data }));
      execute({
        kind: "UpdateAuthoringMetadata",
        apply: (project) => ({ ok: true, value: { ...project, authoringMetadata: { ...project.authoringMetadata, [id]: { comment, position: { x: 80, y: 80 } } } } }),
      });
    }
    setInspector(null);
  }

  function handleDelete() {
    if (!execute || bindingIndex < 0 || inspector?.kind !== "edit") return;
    execute(removeGraphNodeCommand(deviceGraphLens(bindingIndex), inspector.nodeId));
    setInspector(null);
  }

  function onCanvasDragOver(event: DragEvent<HTMLDivElement>) {
    if (![...event.dataTransfer.types].includes(PROCESSING_BLOCK_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    const rect = event.currentTarget.getBoundingClientRect();
    setDropPreview({ x: snapToGrid(event.clientX - rect.left), y: snapToGrid(event.clientY - rect.top) });
  }

  function onCanvasDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDropPreview(null);
    const id = event.dataTransfer.getData(PROCESSING_BLOCK_MIME);
    const entry = findCatalogEntryById(id);
    if (!entry) return;
    const flowPos = rf?.screenToFlowPosition({ x: event.clientX, y: event.clientY }) ?? { x: 80, y: 80 };
    placeFromCatalog(entry, { x: snapToGrid(flowPos.x), y: snapToGrid(flowPos.y) });
  }

  async function handleDryRun() {
    setRunning(true);
    setHashHex(null);
    try {
      const result = dryRunConfig({ physicalGraph: physicalGraphState, processingGraph: graphState, mqtt: DISABLED_MQTT, connectivity: 0, energy: DEFAULT_ENERGY }, { availableBlockRuleTypeIds: SHIPPED_TYPE_IDS });
      setDryRun(result);
      if (result.compiled) {
        const digest = await sha256(encodeConfigCbor(result.compiled));
        setHashHex(Array.from(digest.slice(0, 8)).map((b) => b.toString(16).padStart(2, "0")).join(""));
      }
    } finally {
      setRunning(false);
    }
  }

  const canDeploy = dryRun !== null && errorCount === 0;
  const statusColor = !dryRun ? "var(--color-ink-faint)" : errorCount > 0 ? "var(--color-error)" : warningCount > 0 ? "var(--color-warning)" : "var(--color-success)";
  const statusText = !dryRun ? "Dry-run non ancora eseguito" : errorCount > 0 || warningCount > 0 ? `${errorCount} errori, ${warningCount} warning` : "Valido";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 overflow-hidden border-b border-border bg-surface px-4">
        <div className="shrink-0">
          <CoreSelector bindings={bindings} selected={selected} onSelect={(b) => setSelectedId(b.bindingId)} />
        </div>
        <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold text-ink">Processing Graph</h1>
        <button type="button" onClick={() => void handleDryRun()} disabled={running} className="flex shrink-0 items-center gap-1.5 rounded-slpill border border-border-strong px-3 py-1.5 font-body text-sm text-ink disabled:opacity-50">
          <PlayCircle size={16} />
          {running ? "In corso…" : "Dry-run"}
        </button>
        {errorCount > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-slpill px-3 py-1.5 font-body text-sm text-error" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)" }}>
            <CircleAlert size={14} />
            {errorCount} errori
          </span>
        )}
        <button type="button" disabled={!canDeploy} onClick={() => navigate("deploy-diff")} className="shrink-0 rounded-slpill bg-brand-blue px-4 py-1.5 font-body-strong text-sm text-white hover:bg-brand-blue-dark disabled:opacity-50">
          Invia a Deploy
        </button>
      </div>

      {!selected ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="font-body text-sm text-ink-faint">Nessun Core nel progetto — vai a Core Connections per connetterne uno.</p>
        </div>
      ) : (
        <div className="relative flex flex-1 overflow-hidden">
          <ProcessingBlockPalette onPlace={(entry) => placeFromCatalog(entry)} />

          <div className="relative flex-1" onDragOver={onCanvasDragOver} onDragLeave={() => setDropPreview(null)} onDrop={onCanvasDrop}>
            <ReactFlow nodeTypes={PROCESSING_NODE_TYPES} nodes={localNodes} edges={edges} onNodesChange={onNodesChange} onNodeClick={onNodeClick} onInit={setRf} fitView>
              <Background gap={20} color="#E1E4EB" />
              <Controls position="bottom-left" />
              <MiniMap position="bottom-right" nodeColor={(n) => PROCESSING_NODE_KIND_CONFIG[(n.data as ProcessingNodeUiData).kind]?.colorVar ?? "#8A8F99"} />
            </ReactFlow>

            {domainNodes.length === 0 && !dropPreview && (
              <div className="pointer-events-none absolute inset-0 mb-10 flex flex-col items-center justify-center">
                <Workflow size={48} strokeWidth={1.5} className="text-ink-faint" />
                <p className="mt-2 font-heading text-lg font-semibold text-ink">Nessun blocco ancora</p>
                <p className="mt-2 rounded-slpill bg-brand-blue px-4 py-1.5 font-body-strong text-sm text-white opacity-70">Trascina un blocco dalla palette per iniziare</p>
              </div>
            )}

            {dropPreview && (
              <div
                className="pointer-events-none absolute rounded-slmd border-2 border-dashed border-brand-blue"
                style={{
                  width: 224,
                  height: 48,
                  left: dropPreview.x,
                  top: dropPreview.y,
                  backgroundColor: "color-mix(in srgb, var(--color-brand-blue) 8%, transparent)",
                }}
              />
            )}

            <div className="absolute bottom-0 left-0 right-0 flex h-10 items-center gap-2 border-t border-border bg-surface px-4">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
              <span className="font-body text-xs text-ink-muted">{statusText}</span>
              {hashHex && <span className="font-mono text-xs text-ink-faint">hash: {hashHex}…</span>}
              <span className="ml-auto font-mono text-xs text-ink-faint">
                {domainNodes.length} nodi · {graphState.edges.length} edge
              </span>
            </div>
          </div>

          {inspector && <NodeInspector mode={inspector} moduleOptions={moduleOptions} existingNodes={domainNodes} knownModuleNodeIds={knownModuleNodeIds} onSave={handleSave} onDelete={inspector.kind === "edit" ? handleDelete : undefined} onClose={() => setInspector(null)} />}
        </div>
      )}
    </div>
  );
}
