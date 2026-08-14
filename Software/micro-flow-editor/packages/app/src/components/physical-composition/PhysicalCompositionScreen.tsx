import { normalizeCatalogPages, normalizeProfilePages, normalizeTopologyPages, type CatalogIndex, type ProfileIndex, type TopologyIndex } from "@spaghettilab/catalog-model";
import { contentHash, createPhysicalCompositionGraph, deployableSnapshot, type CoreBindingId, type CoreBindingRecord, type GraphNode, type GraphState } from "@spaghettilab/domain";
import { moduleFromAcceptedDiscovery, previewDiscoveryAccept, validateComposition, type DiscoveryAcceptChoice, type PhysicalCompositionNodeData } from "@spaghettilab/physical-composition-model";
import type { AcceptDiscoveryRequest, DiscoveryCandidate } from "@spaghettilab/protocol-sdk";
import { addGraphNodeCommand, nodeChangesToCommands, physicalGraphLens, removeGraphNodeCommand, toReactFlowEdges, updateGraphNodeCommand } from "@spaghettilab/react-flow-adapter";
import { applyNodeChanges, Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, type Node, type NodeChange } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CircleAlert, Cpu, Library, Plug, Radar, Rows3, Thermometer, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCoreSessions } from "../../state/core-sessions-context.js";
import { useSession } from "../../state/session-context.js";
import { CoreSelector } from "../catalog-topology/CoreSelector.js";
import { IconTooltip } from "../shell/IconTooltip.js";
import { DiscoveryTray } from "./DiscoveryTray.js";
import { NodeInspector, type InspectorMode } from "./NodeInspector.js";
import { NODE_KIND_CONFIG } from "./node-kinds.js";
import { PHYSICAL_NODE_TYPES } from "./PhysicalNode.js";
import { BlockLibraryPanel } from "./BlockLibraryPanel.js";
import { toPhysicalNodes, type PhysicalNodeData } from "./to-nodes.js";

const EMPTY_GRAPH: GraphState<"physical-composition"> = { layer: "physical-composition", nodes: [], edges: [] };

const TOOLBAR_ITEMS: readonly { readonly kind: PhysicalCompositionNodeData["kind"]; readonly icon: typeof Rows3 }[] = [
  { kind: "backbone", icon: Rows3 },
  { kind: "power-source", icon: Zap },
  { kind: "connector", icon: Plug },
  { kind: "external-device", icon: Thermometer },
  { kind: "module", icon: Cpu },
];

/**
 * `ux/screens/S050-physical-composition/{visual,ui-behavior,backend-behavior}.md`.
 * The header's "hash compilato" isn't shown — that's the compiled Config's hash
 * (S072, not wired into any screen yet); instead the status bar shows `contentHash`
 * of the graph's own `deployableSnapshot` (`@spaghettilab/domain`), which is real
 * and already guarantees the spec's actual requirement — "cambiare label/posizione
 * non cambia [questo] hash" — without claiming to be a compiled artifact it isn't.
 */
export function PhysicalCompositionScreen() {
  return (
    <ReactFlowProvider>
      <PhysicalCompositionScreenInner />
    </ReactFlowProvider>
  );
}

function PhysicalCompositionScreenInner() {
  const { session, execute, navigate } = useSession();
  const { rows, getSnapshot, listDeviceProfiles, listDiscoveryCandidates, acceptDiscovery } = useCoreSessions();
  const bindings = session?.stack.current.coreBindings ?? [];

  const [selectedId, setSelectedId] = useState<CoreBindingId | null>(bindings[0]?.bindingId ?? null);
  const selected: CoreBindingRecord | null = bindings.find((b) => b.bindingId === selectedId) ?? bindings[0] ?? null;
  const bindingIndex = selected ? bindings.findIndex((b) => b.bindingId === selected.bindingId) : -1;
  const row = rows.find((r) => r.binding.bindingId === selected?.bindingId);
  const snapshot = selected ? getSnapshot(selected.bindingId) : undefined;

  const [inspector, setInspector] = useState<InspectorMode | null>(null);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [candidates, setCandidates] = useState<readonly DiscoveryCandidate[]>([]);
  const [acknowledged, setAcknowledged] = useState<ReadonlySet<string>>(new Set());
  const [profileIndex, setProfileIndex] = useState<ProfileIndex | null>(null);

  useEffect(() => {
    if (!selected || row?.sessionState !== "READY") return;
    let cancelled = false;
    listDiscoveryCandidates(selected.bindingId)
      ?.then((list) => !cancelled && setCandidates(list))
      .catch(() => !cancelled && setCandidates([]));
    listDeviceProfiles(selected.bindingId)
      ?.then((list) => !cancelled && setProfileIndex(normalizeProfilePages([{ profiles: list, nextCursor: 0 }], true)))
      .catch(() => !cancelled && setProfileIndex(null));
    return () => {
      cancelled = true;
    };
  }, [selected, row?.sessionState, listDiscoveryCandidates, listDeviceProfiles]);

  // Gated at read time instead of reset synchronously in the effect above (would
  // trip `react-hooks/set-state-in-effect`) — switching to a Core that isn't READY
  // hides the previous Core's candidates/profiles without an extra render.
  const visibleCandidates = row?.sessionState === "READY" ? candidates : [];
  const visibleProfileIndex = row?.sessionState === "READY" ? profileIndex : null;

  const catalogIndex: CatalogIndex | null = useMemo(() => (snapshot?.catalog ? normalizeCatalogPages([snapshot.catalog], true) : null), [snapshot]);
  const topologyIndex: TopologyIndex | null = useMemo(() => (snapshot?.topology ? normalizeTopologyPages([snapshot.topology], true) : null), [snapshot]);

  const graphState: GraphState<"physical-composition"> = (bindingIndex >= 0 ? session?.stack.current.physicalGraphs[bindingIndex] : undefined) ?? EMPTY_GRAPH;
  const domainNodes = graphState.nodes as readonly GraphNode<"physical-composition", string, PhysicalCompositionNodeData>[];
  const projectAuthoringMetadata = session?.stack.current.authoringMetadata;
  const authoringMetadata = useMemo(() => projectAuthoringMetadata ?? {}, [projectAuthoringMetadata]);

  const validation = useMemo(() => (topologyIndex ? validateComposition(domainNodes, topologyIndex, { acknowledgedModuleNodeIds: acknowledged }) : null), [domainNodes, topologyIndex, acknowledged]);
  const errorsByNode = useMemo(() => {
    const map = new Map<string, string>();
    if (validation && !validation.ok) for (const e of validation.error) map.set(e.target, e.remediation);
    return map;
  }, [validation]);
  const collisionCount = validation && !validation.ok ? validation.error.filter((e) => e.code === "physical-composition.endpoint_collision" || e.code === "physical-composition.module_key_conflict").length : 0;

  const domainRfNodes = useMemo(() => toPhysicalNodes(graphState, authoringMetadata, new Set(errorsByNode.keys())), [graphState, authoringMetadata, errorsByNode]);
  const edges = useMemo(() => toReactFlowEdges(graphState), [graphState]);

  // Local mirror for smooth dragging — `applyNodeChanges` gives immediate visual
  // feedback on every mouse-move; the domain (source of truth) is only updated
  // once per gesture (see `onNodesChange` below), not once per pixel. Resynced
  // during render (React's documented "adjusting state when a prop changes"
  // pattern: https://react.dev/learn/you-might-not-need-an-effect) rather than in
  // a `useEffect`, so switching Core/undo/redo doesn't need an extra render pass.
  const [localNodes, setLocalNodes] = useState<Node<PhysicalNodeData>[]>(domainRfNodes);
  const [syncedFrom, setSyncedFrom] = useState(domainRfNodes);
  if (domainRfNodes !== syncedFrom) {
    setSyncedFrom(domainRfNodes);
    setLocalNodes(domainRfNodes);
  }

  const contentDigest = useMemo(() => {
    const g = createPhysicalCompositionGraph<string, string, unknown>();
    for (const n of graphState.nodes) g.addNode(n);
    for (const e of graphState.edges) g.addEdge(e);
    return contentHash(deployableSnapshot(g)).slice(0, 8);
  }, [graphState]);

  useEffect(() => {
    if (!session || bindingIndex < 0 || !execute) return;
    if (session.stack.current.physicalGraphs.length > bindingIndex) return;
    // Pre-existing data created before `addCoreBinding` was fixed (this task) to keep
    // `physicalGraphs`/`deviceGraphs` index-aligned with `coreBindings` — repaired
    // lazily here rather than crashing `physicalGraphLens`.
    execute({
      kind: "RepairPhysicalGraphAlignment",
      apply: (project) => {
        const physicalGraphs = [...project.physicalGraphs];
        const deviceGraphs = [...project.deviceGraphs];
        while (physicalGraphs.length <= bindingIndex) physicalGraphs.push({ layer: "physical-composition", nodes: [], edges: [] });
        while (deviceGraphs.length <= bindingIndex) deviceGraphs.push({ layer: "device-processing", nodes: [], edges: [] });
        return { ok: true, value: { ...project, physicalGraphs, deviceGraphs } };
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindingIndex, session?.stack.current.physicalGraphs.length]);

  function onNodesChange(changes: NodeChange<Node<PhysicalNodeData>>[]) {
    setLocalNodes((nds) => applyNodeChanges(changes, nds));
    if (!execute || bindingIndex < 0) return;
    const committable = changes.filter((c) => !(c.type === "position" && c.dragging === true));
    const commands = nodeChangesToCommands(committable, physicalGraphLens(bindingIndex));
    for (const command of commands) execute(command);
  }

  function onNodeClick(_: unknown, node: Node<PhysicalNodeData>) {
    const domainNode = domainNodes.find((n) => n.id === node.id);
    const meta = authoringMetadata[node.id];
    if (domainNode) setInspector({ kind: "edit", nodeId: node.id, data: domainNode.data, comment: meta?.comment ?? "" });
  }

  function setComment(nodeId: string, comment: string) {
    execute?.({
      kind: "UpdateAuthoringMetadata",
      apply: (project) => ({ ok: true, value: { ...project, authoringMetadata: { ...project.authoringMetadata, [nodeId]: { ...project.authoringMetadata[nodeId], comment } } } }),
    });
  }

  function handleSave(data: PhysicalCompositionNodeData, comment: string) {
    if (!execute || bindingIndex < 0) return;
    const lens = physicalGraphLens(bindingIndex);
    if (inspector?.kind === "edit") {
      execute(updateGraphNodeCommand(lens, { layer: "physical-composition", id: inspector.nodeId, data }));
      setComment(inspector.nodeId, comment);
    } else if (inspector) {
      const id = `pc-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      execute(addGraphNodeCommand(lens, { layer: "physical-composition", id, data }));
      execute({
        kind: "UpdateAuthoringMetadata",
        apply: (project) => ({ ok: true, value: { ...project, authoringMetadata: { ...project.authoringMetadata, [id]: { comment, position: { x: 80, y: 80 } } } } }),
      });
    }
    setInspector(null);
  }

  function handleDelete() {
    if (!execute || bindingIndex < 0 || inspector?.kind !== "edit") return;
    execute(removeGraphNodeCommand(physicalGraphLens(bindingIndex), inspector.nodeId));
    setInspector(null);
  }

  async function handleAcceptDiscovery(candidate: DiscoveryCandidate, choice: DiscoveryAcceptChoice) {
    if (!selected || bindingIndex < 0 || !execute) return;
    const req: AcceptDiscoveryRequest = { candidateId: candidate.id, key: choice.key, generation: candidate.generation };
    const response = await acceptDiscovery(selected.bindingId, req);
    if (!response) return;
    const preview = previewDiscoveryAccept(candidate, choice);
    const moduleData = moduleFromAcceptedDiscovery(preview, response.moduleKey);
    const id = `pc-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    execute(addGraphNodeCommand(physicalGraphLens(bindingIndex), { layer: "physical-composition", id, data: moduleData }));
    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
  }

  const subtitle = selected ? `${domainNodes.length} elementi · ${collisionCount} conflitti` : "Nessun Core";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 overflow-hidden border-b border-border bg-surface px-4">
        <div className="shrink-0">
          <CoreSelector bindings={bindings} selected={selected} onSelect={(b) => setSelectedId(b.bindingId)} />
        </div>
        <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold text-ink">Physical Composition</h1>
        {visibleCandidates.length > 0 && (
          <button type="button" onClick={() => setDiscoveryOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-slpill border border-border-strong px-3 py-1.5 font-body text-sm text-ink">
            <Radar size={14} />
            {visibleCandidates.length} candidati
          </button>
        )}
        {collisionCount > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-slpill px-3 py-1.5 font-body text-sm text-error" style={{ backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)" }}>
            <CircleAlert size={14} />
            {collisionCount} indirizzi in conflitto
          </span>
        )}
        <button type="button" onClick={() => navigate("deploy-diff")} className="shrink-0 rounded-slpill bg-brand-blue px-4 py-1.5 font-body-strong text-sm text-white hover:bg-brand-blue-dark">
          Invia a Deploy
        </button>
      </div>

      {!selected ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="font-body text-sm text-ink-faint">Nessun Core nel progetto — vai a Core Connections per connetterne uno.</p>
        </div>
      ) : (
        <div className="relative flex flex-1 overflow-hidden">
          <div className="flex flex-col gap-2 border-r border-border bg-surface p-2">
            {TOOLBAR_ITEMS.map(({ kind, icon: Icon }) => {
              const config = NODE_KIND_CONFIG[kind];
              return (
                <button key={kind} type="button" title={`+ ${config.label}`} onClick={() => setInspector({ kind: "create", nodeKind: kind })} className="group relative flex h-10 w-10 items-center justify-center rounded-slsm text-ink-muted hover:bg-surface-raised">
                  <Icon size={18} />
                  <IconTooltip label={`+ ${config.label}`} />
                </button>
              );
            })}
            <div className="mx-auto h-px w-6 bg-border" />
            <button type="button" title="Libreria blocchi" onClick={() => setLibraryOpen(true)} className="group relative flex h-10 w-10 items-center justify-center rounded-slsm text-ink-muted hover:bg-surface-raised">
              <Library size={18} />
              <IconTooltip label="Libreria blocchi" />
            </button>
          </div>

          <div className="relative flex-1">
            <ReactFlow nodeTypes={PHYSICAL_NODE_TYPES} nodes={localNodes} edges={edges} onNodesChange={onNodesChange} onNodeClick={onNodeClick} fitView>
              <Background gap={20} color="#E1E4EB" />
              <Controls position="bottom-left" />
              {/* An empty minimap is just a blank white rectangle — with no nodes to preview it reads as a rendering glitch, not a UI element, especially once the Inspector panel narrows the canvas. */}
              {domainNodes.length > 0 && <MiniMap position="bottom-right" pannable zoomable className="!rounded-slsm !border !border-border-strong !shadow-e1" nodeColor={(n) => NODE_KIND_CONFIG[(n.data as PhysicalNodeData).kind]?.colorVar ?? "#8A8F99"} />}
            </ReactFlow>

            <div className="absolute bottom-0 left-0 right-0 flex h-10 items-center gap-2 border-t border-border bg-surface px-4">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: collisionCount > 0 ? "var(--color-error)" : "var(--color-success)" }} />
              <span className="font-body text-xs text-ink-muted">{subtitle}</span>
              <span className="ml-auto font-mono text-xs text-ink-faint">content: {contentDigest}</span>
            </div>
          </div>

          {inspector && (
            <NodeInspector
              mode={inspector}
              topology={topologyIndex}
              catalog={catalogIndex}
              profiles={visibleProfileIndex}
              existingNodes={domainNodes}
              acknowledgedModuleNodeIds={acknowledged}
              onSave={handleSave}
              onDelete={inspector.kind === "edit" ? handleDelete : undefined}
              onAcknowledge={() => {
                const id = inspector.kind === "edit" ? inspector.nodeId : "__draft__";
                setAcknowledged((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
              onClose={() => setInspector(null)}
            />
          )}

          <DiscoveryTray open={discoveryOpen} candidates={visibleCandidates} topology={topologyIndex} existingNodes={domainNodes} onAccept={(c, choice) => void handleAcceptDiscovery(c, choice)} onReject={(id) => setCandidates((prev) => prev.filter((c) => c.id !== id))} onClose={() => setDiscoveryOpen(false)} />

          <BlockLibraryPanel
            open={libraryOpen}
            onPick={(preset) => {
              setLibraryOpen(false);
              setInspector({ kind: "create", nodeKind: "external-device", prefillComment: preset.name, prefillData: { kind: "external-device", description: preset.description } });
            }}
            onClose={() => setLibraryOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
