import { encodeConfigCbor, sha256 } from "@spaghettilab/config-compiler";
import { dryRunConfig, type DryRunResult } from "@spaghettilab/config-decompiler";
import type { DeviceProcessingNodeData } from "@spaghettilab/device-processing-graph-model";
import type { CoreBindingId, CoreBindingRecord, GraphNode, GraphState } from "@spaghettilab/domain";
import { isModuleNodeData, type PhysicalCompositionNodeData } from "@spaghettilab/physical-composition-model";
import { findCatalogEntryById, shippedTypeIds, type ProcessingCatalogEntry } from "@spaghettilab/processing-block-catalog";
import { addGraphEdgeCommand, addGraphNodeCommand, deviceGraphLens, edgeChangesToCommands, nodeChangesToCommands, removeGraphNodeCommand, toReactFlowEdges, updateGraphNodeCommand } from "@spaghettilab/react-flow-adapter";
import { applyEdgeChanges, applyNodeChanges, Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, type Connection, type Edge, type EdgeChange, type Node, type NodeChange, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CircleAlert, PlayCircle, Workflow } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";
import { useSession } from "../../state/session-context.js";
import { DEFAULT_ENERGY, DISABLED_MQTT } from "../../lib/default-config-policy.js";
import { CoreSelector } from "../catalog-topology/CoreSelector.js";
import { PROCESSING_BLOCK_MIME, nextSpawnPosition, nodeDataFromCatalogEntry, snapToGrid } from "./catalog-to-node.js";
import { PROCESSING_EDGE_TYPES } from "./DeletableEdge.js";
import { NodeInspector, type ProcessingInspectorMode } from "./NodeInspector.js";
import { EVENT_CONTAINER_NODE_TYPES, type EventContainerNodeData } from "./EventContainerNode.js";
import { computeEventContainers, type EventContainer } from "./event-containers.js";
import { NODE_PADDING, EVENT_CONTAINER_HEADER_HEIGHT } from "./layout-constants.js";
import { PROCESSING_NODE_KIND_CONFIG } from "./node-kinds.js";
import { containerAtPosition, resolveSiblingOverlap } from "./node-overlap.js";
import { ProcessingBlockPalette } from "./ProcessingBlockPalette.js";
import { PROCESSING_NODE_TYPES } from "./ProcessingNode.js";
import { toProcessingNodes, type ProcessingNodeUiData } from "./to-nodes.js";

/** The member with no outgoing edge to another member — where a chained-in block attaches next. Zero members means the trigger itself is the attachment point. */
function chainTailId(container: EventContainer, edges: GraphState<"device-processing">["edges"]): string {
  const members = new Set(container.memberIds);
  for (const id of container.memberIds) {
    const hasDownstreamMember = edges.some((e) => e.source === id && members.has(e.target));
    if (!hasDownstreamMember) return id;
  }
  return container.triggerId;
}

const NODE_TYPES = { ...PROCESSING_NODE_TYPES, ...EVENT_CONTAINER_NODE_TYPES };

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
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!overlapWarning) return;
    const timer = setTimeout(() => setOverlapWarning(null), 4000);
    return () => clearTimeout(timer);
  }, [overlapWarning]);

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
  // "deletable" (DeletableEdge.tsx) renders every edge with getSmoothStepPath —
  // horizontal/vertical segments joined by rounded corners only, never a free
  // diagonal — plus a hover trash control.
  const edges = useMemo<Edge[]>(() => toReactFlowEdges(graphState).map((edge) => ({ ...edge, type: "deletable" })), [graphState]);
  const processingNodeLabel = useCallback((id: string) => domainRfNodes.find((n) => n.id === id)?.data.label ?? id, [domainRfNodes]);

  const [localNodes, setLocalNodes] = useState<Node<ProcessingNodeUiData>[]>(domainRfNodes);
  const [syncedFrom, setSyncedFrom] = useState(domainRfNodes);
  if (domainRfNodes !== syncedFrom) {
    setSyncedFrom(domainRfNodes);
    setLocalNodes(domainRfNodes);
  }

  // Purely derived from positions + edges already on the canvas — never part of
  // the domain graph or authoringMetadata, so these never generate a command.
  // livePositions comes from localNodes (updates every drag frame, not just on
  // drop), so a container grows/shrinks live while the trigger or a member is
  // still being dragged.
  const livePositions = useMemo(() => new Map(localNodes.map((n) => [n.id, n.position])), [localNodes]);
  const eventContainers = useMemo(() => computeEventContainers(graphState, authoringMetadata, livePositions), [graphState, authoringMetadata, livePositions]);
  const containerByTriggerId = useMemo(() => new Map(eventContainers.map((c) => [c.triggerId, c])), [eventContainers]);
  const containerByMemberId = useMemo(() => {
    const map = new Map<string, (typeof eventContainers)[number]>();
    for (const container of eventContainers) for (const memberId of container.memberIds) map.set(memberId, container);
    return map;
  }, [eventContainers]);
  // The container node's own id is the trigger's real domain id (not a "container-" prefix) —
  // it's the trigger's on-canvas representation now, not a decoration next to it, so
  // onNodeClick's existing `domainNodes.find(n => n.id === node.id)` lookup already
  // resolves it correctly.
  const containerNodes = useMemo<Node<EventContainerNodeData>[]>(
    () =>
      eventContainers.map((container) => {
        const triggerData = domainNodes.find((n) => n.id === container.triggerId)?.data;
        return {
          id: container.triggerId,
          type: "event-container",
          position: { x: container.x, y: container.y },
          // Both the top-level width/height (so React Flow treats this parent
          // node as already measured and never hides it behind its
          // ResizeObserver-driven `visibility: hidden` first-paint guard — a
          // node with children referencing it via parentId gets this guard
          // regardless of `extent`) and the CSS style (so the DOM element
          // actually renders at that size) are required — one without the
          // other leaves the container either permanently invisible (no
          // top-level props) or fighting a perpetual "dimensions" correction
          // loop (a value here that disagrees with the measured DOM size).
          // event-containers.ts rounds x/y/width/height to whole pixels so the
          // declared value always agrees with what the browser actually
          // renders, closing that loop.
          width: container.width,
          height: container.height,
          style: { width: container.width, height: container.height },
          // Draggable/selectable — this is the trigger's own real node, anchored
          // at its own stored position (event-containers.ts), so it moves like
          // any other node and carries its members along (handled manually in
          // onNodesChange, since React Flow only reports the dragged node itself).
          draggable: true,
          selectable: true,
          connectable: false,
          focusable: true,
          zIndex: -1,
          data: { label: container.label, kind: triggerData?.kind === "schedule" ? "schedule" : "event-source" },
        };
      }),
    [eventContainers, domainNodes],
  );
  // Real React Flow children: relative-to-container position + parentId, so
  // dragging the container (or a sibling member) behaves natively instead of
  // the old floating-box-behind-independent-nodes hack. Deliberately no
  // `extent: 'parent'` clamp: that requires React Flow to know the parent's
  // measured size, which — combined with a container whose size changes every
  // render — is what caused the dimension-reconciliation infinite loop (see
  // the container node's own comment above). Containment is instead enforced
  // by this screen's own onNodesChange/placeFromCatalog logic (the
  // attachLowerBound clamp, resolveSiblingOverlap), which already needs to run
  // regardless since a fresh attach has no parentId yet on the frame it lands.
  // localNodes itself always stays absolute (synced from authoringMetadata via
  // domainRfNodes) — the relative conversion only happens here, at render
  // time, never stored.
  const renderedNodes = useMemo<Node<ProcessingNodeUiData>[]>(() => {
    const rest = localNodes
      .filter((n) => !containerByTriggerId.has(n.id))
      .map((n) => {
        const container = containerByMemberId.get(n.id);
        if (!container) return n;
        return {
          ...n,
          parentId: container.triggerId,
          position: { x: n.position.x - container.x, y: n.position.y - container.y },
        };
      });
    return [...containerNodes, ...rest] as unknown as Node<ProcessingNodeUiData>[];
  }, [containerNodes, localNodes, containerByTriggerId, containerByMemberId]);

  // Edges from the hidden trigger into its members are membership, shown by
  // the dashed area — drawing them would point at a node that is not on the canvas.
  const [localEdges, setLocalEdges] = useState<Edge[]>(edges);
  const [edgesSyncedFrom, setEdgesSyncedFrom] = useState(edges);
  if (edges !== edgesSyncedFrom) {
    setEdgesSyncedFrom(edges);
    setLocalEdges(edges);
  }
  const visibleEdges = useMemo(
    () => localEdges.filter((e) => !containerByTriggerId.has(e.source) && !containerByTriggerId.has(e.target)),
    [localEdges, containerByTriggerId],
  );

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
    const newEdgeCommands: ReturnType<typeof addGraphEdgeCommand>[] = [];
    // Synthetic position changes for members carried along by a container drag
    // — React Flow only emits an event for the dragged node itself (the
    // container), never for the children it's visually moving with it.
    const carriedChanges: NodeChange<Node<ProcessingNodeUiData>>[] = [];

    // React Flow reports a member's dragged position relative to its container
    // (parentId); localNodes/authoringMetadata always store absolute canvas
    // positions, so translate back before either touches them.
    const absoluteChanges = changes.map((change) => {
      if (change.type !== "position" || !change.position) return change;
      const isContainer = containerByTriggerId.has(change.id);
      const container = containerByMemberId.get(change.id);
      let position = container ? { x: change.position.x + container.x, y: change.position.y + container.y } : change.position;

      if (isContainer) {
        // Dragging the trigger must move every member with it, unchanged
        // relative to the trigger — event-containers.ts sizes the box purely
        // from that relative offset, so shifting the trigger without shifting
        // its members the same amount would resize the box instead of just
        // moving it. Sizing only ever reacts to a member being added or moved
        // on its own (the branch below, gated on `!isContainer`).
        const info = containerByTriggerId.get(change.id);
        const oldPos = livePositions.get(change.id);
        if (info && oldPos && (position.x !== oldPos.x || position.y !== oldPos.y)) {
          const delta = { x: position.x - oldPos.x, y: position.y - oldPos.y };
          for (const memberId of info.memberIds) {
            const memberPos = livePositions.get(memberId);
            if (!memberPos) continue;
            carriedChanges.push({
              id: memberId,
              type: "position",
              position: { x: memberPos.x + delta.x, y: memberPos.y + delta.y },
              dragging: change.dragging,
            });
          }
        }
        return { ...change, position };
      }

      // Only resolve collisions/attachment once a drag settles (dragging === false)
      // — mid-drag frames track the pointer exactly, matching how React Flow
      // behaves elsewhere.
      if (change.dragging === false) {
        // Only a Block can be chained this way — it's the only kind with both a
        // target and a source Handle (ProcessingNode.tsx); Rule has neither, and
        // a Schedule/Event-source is itself always a container, never a member.
        const isChainableBlock = domainNodes.find((n) => n.id === change.id)?.data.kind === "block";
        let attachLowerBound: { x: number; y: number } | undefined;
        if (!container && isChainableBlock) {
          // Dropped inside a dashed container with no real connection yet — attach
          // it to the end of that trigger's chain (or straight to the trigger if
          // the container is still empty) instead of leaving it merely overlapping.
          const target = containerAtPosition(position, eventContainers);
          if (target) {
            newEdgeCommands.push(
              addGraphEdgeCommand(deviceGraphLens(bindingIndex), {
                id: `dpe-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
                source: chainTailId(target, graphState.edges),
                target: change.id,
                sourceHandle: "0",
                targetHandle: "0",
              }),
            );
            setOverlapWarning(`Collegato a «${target.label}».`);
            // Never above/left of the trigger's own anchor — event-containers.ts
            // only ever grows a container to the right/down, so a position outside
            // this quadrant would render at a negative offset from the container,
            // outside the dashed box. Passed through to resolveSiblingOverlap below
            // too, so pushing it clear of an existing member can't undo this.
            attachLowerBound = { x: target.x + NODE_PADDING, y: target.y + NODE_PADDING + EVENT_CONTAINER_HEADER_HEIGHT };
            position = { x: Math.max(position.x, attachLowerBound.x), y: Math.max(position.y, attachLowerBound.y) };
          }
        }
        const siblings = localNodes
          .filter((n) => !containerByTriggerId.has(n.id))
          .map((n) => ({ id: n.id, position: n.id === change.id ? position : n.position }));
        position = resolveSiblingOverlap(change.id, position, siblings, attachLowerBound);
      }

      return { ...change, position };
    });
    const allChanges = [...absoluteChanges, ...carriedChanges];
    setLocalNodes((nds) => applyNodeChanges(allChanges, nds));
    if (!execute || bindingIndex < 0) return;
    for (const command of newEdgeCommands) execute(command);
    const committable = allChanges.filter((c) => !(c.type === "position" && c.dragging === true));
    const commands = nodeChangesToCommands(committable, deviceGraphLens(bindingIndex));
    for (const command of commands) execute(command);
  }

  function onEdgesChange(changes: EdgeChange[]) {
    setLocalEdges((eds) => applyEdgeChanges(changes, eds));
    if (!execute || bindingIndex < 0) return;
    const commands = edgeChangesToCommands(changes, deviceGraphLens(bindingIndex));
    for (const command of commands) execute(command);
  }

  function onConnect(connection: Connection) {
    if (!execute || bindingIndex < 0 || !connection.source || !connection.target) return;
    const edgeId = `dpe-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    execute(
      addGraphEdgeCommand(deviceGraphLens(bindingIndex), {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
      }),
    );
  }

  function onNodeClick(_: unknown, node: Node<ProcessingNodeUiData>) {
    const domainNode = domainNodes.find((n) => n.id === node.id);
    const meta = authoringMetadata[node.id];
    if (domainNode) setInspector({ kind: "edit", nodeId: node.id, data: domainNode.data, comment: meta?.comment ?? "" });
  }

  function placeFromCatalog(entry: ProcessingCatalogEntry, requestedPosition = nextSpawnPosition(domainNodes.length)) {
    if (!execute || bindingIndex < 0) return;
    const data = nodeDataFromCatalogEntry(entry, moduleOptions[0]?.id);
    if (!data) return;

    const id = `dp-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

    // Same attachment handling as an existing block being dragged (onNodesChange):
    // a new Block dropped inside a dashed container has no edge yet, so chain it
    // onto that trigger (or its last member) instead of leaving it merely
    // overlapping. Only a Block can be chained this way — see onNodesChange.
    let position = requestedPosition;
    let attachEdgeCommand: ReturnType<typeof addGraphEdgeCommand> | undefined;
    let attachLowerBound: { x: number; y: number } | undefined;
    if (data.kind === "block") {
      const target = containerAtPosition(position, eventContainers);
      if (target) {
        attachEdgeCommand = addGraphEdgeCommand(deviceGraphLens(bindingIndex), {
          id: `dpe-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
          source: chainTailId(target, graphState.edges),
          target: id,
          sourceHandle: "0",
          targetHandle: "0",
        });
        setOverlapWarning(`Collegato a «${target.label}».`);
        attachLowerBound = { x: target.x + NODE_PADDING, y: target.y + NODE_PADDING + EVENT_CONTAINER_HEADER_HEIGHT };
        position = { x: Math.max(position.x, attachLowerBound.x), y: Math.max(position.y, attachLowerBound.y) };
      }
    }
    position = resolveSiblingOverlap(
      "",
      position,
      localNodes.filter((n) => !containerByTriggerId.has(n.id)).map((n) => ({ id: n.id, position: n.position })),
      attachLowerBound,
    );

    // The node must exist before an edge can reference its id as a target.
    execute(addGraphNodeCommand(deviceGraphLens(bindingIndex), { layer: "device-processing", id, data }));
    if (attachEdgeCommand) execute(attachEdgeCommand);
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
        apply: (project) => ({ ok: true, value: { ...project, authoringMetadata: { ...project.authoringMetadata, [id]: { comment, position: nextSpawnPosition(domainNodes.length) } } } }),
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
            <ReactFlow
              nodeTypes={NODE_TYPES}
              edgeTypes={PROCESSING_EDGE_TYPES}
              // EventContainerNode reads its own `data` shape at runtime regardless of this
              // component's single node-data generic — ReactFlow itself is happy to render
              // heterogeneous node types side by side, TypeScript just needs the cast (done
              // inside `renderedNodes`). A contained trigger's own card is skipped from the
              // render — the dashed container (id'd with the same trigger id) is its on-canvas
              // representation now, not a separate node next to it; localNodes/the domain
              // graph still has it. Container nodes are listed first, a React Flow requirement
              // for `parentId` children to resolve.
              nodes={renderedNodes}
              edges={visibleEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={setRf}
              deleteKeyCode={["Backspace", "Delete"]}
              defaultEdgeOptions={{ type: "deletable", interactionWidth: 24, style: { stroke: "var(--color-ink-faint)", strokeWidth: 1.5 } }}
              fitView
            >
              <Background gap={20} color="#E1E4EB" />
              <Controls position="bottom-left" />
              {domainNodes.length > 0 && <MiniMap position="bottom-right" pannable zoomable className="!rounded-slsm !border !border-border-strong !shadow-e1" nodeColor={(n) => PROCESSING_NODE_KIND_CONFIG[(n.data as ProcessingNodeUiData).kind]?.colorVar ?? "#8A8F99"} />}
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

            {overlapWarning && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-slpill bg-surface px-3 py-1.5 font-body text-sm text-ink shadow-e1" style={{ outline: "1px solid var(--color-warning)" }}>
                {overlapWarning}
              </div>
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

          {inspector && (
            <NodeInspector
              key={inspector.kind === "edit" ? inspector.nodeId : `create-${inspector.nodeKind}`}
              mode={inspector}
              moduleOptions={moduleOptions}
              existingNodes={domainNodes}
              existingEdges={graphState.edges}
              nodeLabel={processingNodeLabel}
              knownModuleNodeIds={knownModuleNodeIds}
              onSave={handleSave}
              onDelete={inspector.kind === "edit" ? handleDelete : undefined}
              onClose={() => setInspector(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
