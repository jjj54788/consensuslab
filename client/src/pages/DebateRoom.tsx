import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useDebateSocket } from "@/hooks/useDebateSocket";
import { ArrowLeft, Loader2, Play, CheckCircle2 } from "lucide-react";
import { Link, useParams } from "wouter";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { DebateFlowChart } from "@/components/DebateFlowChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DebateRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, loading: authLoading } = useAuth();

  const { data: session, isLoading: sessionLoading } = trpc.debate.get.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  const { data: agents } = trpc.agents.list.useQuery();

  const {
    connected,
    messages,
    agentStatuses,
    currentRound,
    isDebateComplete,
    completedSession,
    error,
    startDebate,
  } = useDebateSocket(sessionId || null);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const selectedAgents = useMemo(() => {
    if (!agents || !session) return [];
    return agents.filter((agent) => session.agentIds.includes(agent.id));
  }, [agents, session]);

  const getAgentById = (id: string) => {
    return selectedAgents.find((agent) => agent.id === id);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      idle: { label: "空闲", variant: "secondary" as const },
      thinking: { label: "思考中", variant: "default" as const },
      speaking: { label: "发言中", variant: "default" as const },
      waiting: { label: "等待中", variant: "outline" as const },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.idle;
  };

  if (authLoading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>讨论不存在</CardTitle>
            <CardDescription>找不到该讨论会话</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>返回首页</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canStart = session.status === "pending" && connected;
  const isRunning = session.status === "running" || messages.length > 0;
  const isCompleted = session.status === "completed" || isDebateComplete;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <Badge variant={connected ? "default" : "secondary"}>
                {connected ? "已连接" : "未连接"}
              </Badge>
              {canStart && (
                <Button onClick={startDebate} size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  开始讨论
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar - Agent Status */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>讨论信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">话题</div>
                  <div className="text-sm text-muted-foreground">{session.topic}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm font-medium mb-1">进度</div>
                  <div className="text-sm text-muted-foreground">
                    第 {currentRound || session.currentRound} / {session.maxRounds} 轮
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>参与智能体</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedAgents.map((agent) => {
                    const status = agentStatuses[agent.id] || "idle";
                    const statusInfo = getStatusBadge(status);
                    return (
                      <div key={agent.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <div
                          className={`w-3 h-3 rounded-full agent-status-${status}`}
                          style={{ backgroundColor: agent.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{agent.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {agent.profile}
                          </div>
                        </div>
                        <Badge variant={statusInfo.variant} className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Tabs for Messages and Flow Chart */}
          <div className="space-y-6">
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="messages">讨论记录</TabsTrigger>
                <TabsTrigger value="flowchart">流程图</TabsTrigger>
              </TabsList>

              <TabsContent value="messages" className="space-y-6">
            {!isRunning && !isCompleted && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">准备开始讨论</h3>
                  <p className="text-muted-foreground mb-4">
                    点击右上角的"开始讨论"按钮启动智能体讨论
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Messages Timeline */}
            {messages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>讨论记录</CardTitle>
                  <CardDescription>实时显示智能体的发言内容</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-6">
                      {messages.map((message, index) => {
                        const agent = getAgentById(message.sender);
                        return (
                          <div key={message.id} className="message-enter">
                            <div className="flex gap-4">
                              <div
                                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold"
                                style={{ backgroundColor: agent?.color || "#999" }}
                              >
                                {agent?.name.charAt(0)}
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{agent?.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    第 {message.round} 轮
                                  </Badge>
                                </div>
                                <div className="prose prose-sm max-w-none">
                                  <Streamdown>{message.content}</Streamdown>
                                </div>
                              </div>
                            </div>
                            {index < messages.length - 1 && <Separator className="my-6" />}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Debate Summary */}
            {isCompleted && completedSession && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <CardTitle>讨论总结</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {completedSession.summary && (
                    <div>
                      <h3 className="font-semibold mb-2">总体摘要</h3>
                      <p className="text-sm text-muted-foreground">{completedSession.summary}</p>
                    </div>
                  )}

                  {completedSession.keyPoints && completedSession.keyPoints.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">关键观点</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {completedSession.keyPoints.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {completedSession.consensus && completedSession.consensus.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">共识点</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {completedSession.consensus.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {completedSession.disagreements && completedSession.disagreements.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">分歧点</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {completedSession.disagreements.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
              </TabsContent>

              <TabsContent value="flowchart" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>讨论流程可视化</CardTitle>
                    <CardDescription>
                      实时展示智能体之间的交互关系和消息传递路径
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[600px] border rounded-lg">
                      <DebateFlowChart
                        agents={selectedAgents}
                        agentStatuses={agentStatuses}
                        messages={messages}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
