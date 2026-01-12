import { Handle, Position } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { AgentStatus } from "@/hooks/useDebateSocket";

interface AgentNodeData {
  name: string;
  profile: string;
  color: string;
  status: AgentStatus;
}

interface AgentNodeProps {
  data: AgentNodeData;
}

const getStatusInfo = (status: AgentStatus) => {
  const statusMap = {
    idle: { label: "空闲", className: "agent-status-idle" },
    thinking: { label: "思考中", className: "agent-status-thinking" },
    speaking: { label: "发言中", className: "agent-status-speaking" },
    waiting: { label: "等待中", className: "agent-status-waiting" },
  };
  return statusMap[status] || statusMap.idle;
};

export function AgentNode({ data }: AgentNodeProps) {
  const statusInfo = getStatusInfo(data.status);

  return (
    <div className="relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div
        className="px-6 py-4 rounded-lg shadow-lg border-2 bg-card min-w-[200px] transition-all duration-300"
        style={{ borderColor: data.color }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className={`w-4 h-4 rounded-full ${statusInfo.className}`}
            style={{ backgroundColor: data.color }}
          />
          <div className="font-semibold text-base">{data.name}</div>
        </div>
        <div className="text-sm text-muted-foreground mb-2">{data.profile}</div>
        <Badge variant="outline" className="text-xs">
          {statusInfo.label}
        </Badge>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
