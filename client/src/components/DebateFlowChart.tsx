import { useCallback, useEffect } from "react";
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
  currentRound?: number;
}

const nodeTypes = {
  agentNode: AgentNode,
};

export function DebateFlowChart({ agents, agentStatuses, messages, currentRound = 0 }: DebateFlowChartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Calculate vertical cascade layout positions (传导视角)
  const calculateNodePositions = useCallback(
    (agentList: Agent[]) => {
      const horizontalSpacing = 200;
      const verticalSpacing = 150;
      const startX = 100;
      const startY = 50;

      // Group messages by round
      const messagesByRound: Record<number, Message[]> = {};
      messages.forEach((msg) => {
        if (!messagesByRound[msg.round]) {
          messagesByRound[msg.round] = [];
        }
        messagesByRound[msg.round].push(msg);
      });

      const positionedNodes: Array<{
        id: string;
        type: string;
        position: { x: number; y: number };
        data: any;
        style?: any;
        className?: string;
      }> = [];

      // Create nodes for each round
      for (let round = 1; round <= currentRound; round++) {
        const roundMessages = messagesByRound[round] || [];
        
        roundMessages.forEach((msg, msgIndex) => {
          const agent = agentList.find((a) => a.id === msg.sender);
          if (!agent) return;

          const status = agentStatuses[agent.id] || "idle";
          const isActive = status === "thinking" || status === "speaking";
          const isCurrent = round === currentRound;

          // Position: horizontal spread within round, vertical cascade by round
          const x = startX + msgIndex * horizontalSpacing;
          const y = startY + (round - 1) * verticalSpacing;

          positionedNodes.push({
            id: `${agent.id}-r${round}`,
            type: "agentNode",
            position: { x, y },
            data: {
              name: agent.name,
              profile: agent.profile,
              color: agent.color,
              status: isCurrent ? status : "idle",
              round: round,
              score: msg.totalScore || undefined,
            },
            style: {
              boxShadow: isActive && isCurrent ? `0 0 20px ${agent.color}` : undefined,
              transform: isActive && isCurrent ? "scale(1.1)" : "scale(1)",
              transition: "all 0.3s ease",
              zIndex: isActive && isCurrent ? 10 : 1,
              opacity: isCurrent ? 1 : 0.7,
            },
            className: isActive && isCurrent ? "animate-pulse" : "",
          });
        });
      }

      return positionedNodes;
    },
    [agentStatuses, messages, currentRound]
  );

  // Calculate edges (传导路径)
  const calculateEdges = useCallback(() => {
    const newEdges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      animated: boolean;
      style: any;
      markerEnd: any;
    }> = [];

    // Group messages by round
    const messagesByRound: Record<number, Message[]> = {};
    messages.forEach((msg) => {
      if (!messagesByRound[msg.round]) {
        messagesByRound[msg.round] = [];
      }
      messagesByRound[msg.round].push(msg);
    });

    // Create edges between rounds (传导连接)
    for (let round = 1; round < currentRound; round++) {
      const currentRoundMessages = messagesByRound[round] || [];
      const nextRoundMessages = messagesByRound[round + 1] || [];

      currentRoundMessages.forEach((currentMsg) => {
        nextRoundMessages.forEach((nextMsg) => {
          newEdges.push({
            id: `e-${currentMsg.sender}-r${round}-${nextMsg.sender}-r${round + 1}`,
            source: `${currentMsg.sender}-r${round}`,
            target: `${nextMsg.sender}-r${round + 1}`,
            type: "smoothstep",
            animated: round === currentRound - 1,
            style: {
              stroke: "#94a3b8",
              strokeWidth: round === currentRound - 1 ? 2 : 1,
              opacity: round === currentRound - 1 ? 1 : 0.4,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#94a3b8",
            },
          });
        });
      });
    }

    return newEdges;
  }, [messages, currentRound]);

  // Initialize and update nodes
  useEffect(() => {
    if (agents.length > 0 && messages.length > 0) {
      const positionedNodes = calculateNodePositions(agents);
      setNodes(positionedNodes as any);
    }
  }, [agents, messages, currentRound, agentStatuses, calculateNodePositions, setNodes]);

  // Update edges
  useEffect(() => {
    if (messages.length > 0) {
      const newEdges = calculateEdges();
      setEdges(newEdges as any);
    }
  }, [messages, currentRound, calculateEdges, setEdges]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node: any) => {
            const agent = agents.find((a) => node.id.startsWith(a.id));
            return agent?.color || "#999";
          }}
        />
      </ReactFlow>
    </div>
  );
}
