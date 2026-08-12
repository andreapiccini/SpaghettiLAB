import { useCallback } from "react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Placeholder nodes only, to prove the stack runs end to end. The real
// SpaghettiLAB block types (Read Sensor, Wait, Publish MQTT, ...) and the
// compiler that turns this graph into a device config are future work —
// see Software/micro-flow-editor/README.md.
const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 0, y: 80 },
    data: { label: "Read Sensor (placeholder)" },
  },
  {
    id: "2",
    position: { x: 260, y: 80 },
    data: { label: "Wait (placeholder)" },
  },
  {
    id: "3",
    position: { x: 520, y: 80 },
    data: { label: "Publish MQTT (placeholder)" },
  },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
];

export default function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
