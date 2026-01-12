import { useEffect, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNode } from "./AgentNode";
import { AgentStatus, Message } from "@/hooks/useDebateSocket";

interface Agent {
  id: string;
  name: string;
  profile: string;
  color: string;
}

interface DebateFlowChartProps {
  agents: Agent[];
  agentStatuses: Record<string, AgentStatus>;
  messages: Message[];
}

const nodeTypes = {
  agentNode: AgentNode,
};

export function DebateFlowChart({ agents, agentStatuses, messages }: DebateFlowChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Calculate circular layout positions
  const calculateNodePositions = useCallback(
    (agentList: Agent[]) => {
      const radius = 250;
      const centerX = 400;
      const centerY = 300;
      const angleStep = (2 * Math.PI) / agentList.length;

      return agentList.map((agent, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return {
          id: agent.id,
          type: "agentNode",
          position: { x, y },
          data: {
            name: agent.name,
            profile: agent.profile,
            color: agent.color,
            status: (agentStatuses[agent.id] || "idle") as AgentStatus,
          },
        };
      });
    },
    [agentStatuses]
  );

  // Initialize nodes
  useEffect(() => {
    if (agents.length > 0) {
      const initialNodes = calculateNodePositions(agents);
      setNodes(initialNodes as any);
    }
  }, [agents, calculateNodePositions, setNodes]);

  // Update node statuses
  useEffect(() => {
    setNodes((nds: any) =>
      nds.map((node: any) => ({
        ...node,
        data: {
          ...node.data,
          status: agentStatuses[node.id] || "idle",
        },
      }))
    );
  }, [agentStatuses, setNodes]);

  // Create edges from messages
  useEffect(() => {
    if (messages.length === 0) {
      setEdges([]);
      return;
    }

    const newEdges = messages.map((message, index) => ({
      id: `edge-${message.id}`,
      source: message.sender,
      target: message.receiver,
      type: "smoothstep",
      animated: index === messages.length - 1, // Animate only the latest edge
      style: {
        stroke: agents.find((a) => a.id === message.sender)?.color || "#999",
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: agents.find((a) => a.id === message.sender)?.color || "#999",
      },
      label: `轮 ${message.round}`,
      labelStyle: {
        fill: "#666",
        fontSize: 12,
      },
      labelBgStyle: {
        fill: "#fff",
        fillOpacity: 0.8,
      },
    }));

    setEdges(newEdges as any);
  }, [messages, agents, setEdges]);

  // Custom minimap node colors
  const nodeColor = useCallback(
    (node: any) => {
      const agent = agents.find((a) => a.id === node.id);
      return agent?.color || "#999";
    },
    [agents]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={nodeColor} zoomable pannable />
      </ReactFlow>
    </div>
  );
}
