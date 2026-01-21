import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useDebateSocket } from "@/hooks/useDebateSocket";
import { ArrowLeft, Loader2, Play, CheckCircle2, TrendingUp, Sparkles, Quote, Download, AlertTriangle } from "lucide-react";
import { Link, useParams } from "wouter";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { DebateTimeline } from "@/components/DebateTimeline";
import { DebateReplay } from "@/components/DebateReplay";

export default function DebateRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, loading: authLoading } = useAuth();
  const [isReplayMode, setIsReplayMode] = useState(false);

  const { data: session, isLoading: sessionLoading } = trpc.debate.get.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  const { data: agents } = trpc.agents.list.useQuery();
  const { data: activeProvider } = trpc.aiProvider.getActive.useQuery(undefined, {
    enabled: !!user,
  });

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

  const groupedAgents = useMemo(() => {
    const groups: Record<string, typeof selectedAgents> = {
      '观点论证组': [],
      '质量评估组': [],
      '专业分析组': []
    };
    selectedAgents.forEach(agent => {
      if (groups[agent.category]) {
        groups[agent.category].push(agent);
      }
    });
    return groups;
  }, [selectedAgents]);

  const utils = trpc.useUtils();

  const handleExport = async (format: 'markdown' | 'pdf') => {
    if (!sessionId) return;

    try {
      if (format === 'markdown') {
        const result = await utils.debate.exportMarkdown.fetch({ sessionId });
        const blob = new Blob([result.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Markdown 文件已导出');
      } else if (format === 'pdf') {
        const result = await utils.debate.exportPDF.fetch({ sessionId });
        const blob = new Blob([result.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('HTML 文件已导出，可使用浏览器打印为PDF');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('导出失败，请稍后重试');
    }
  };

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
  const progress = ((currentRound || session.currentRound) / session.maxRounds) * 100;
  
  // Use session data for completed debates (handles page refresh)
  const displaySession = isCompleted ? (completedSession || session) : null;

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
              {isCompleted && (
                <>
                  <Button 
                    variant={isReplayMode ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setIsReplayMode(!isReplayMode)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isReplayMode ? "退出回放" : "回放讨论"}
                  </Button>
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      导出
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('markdown')}>
                      导出为 Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      导出为 PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
              )}
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

      <main className="container py-6">
        {!connected && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                正在连接到讨论服务器...
              </p>
            </div>
          </div>
        )}

        {/* AI Provider Warning */}
        {user && !activeProvider && canStart && (
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-400">提示：未检测到 UI 配置的 AI 提供商</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              系统将自动尝试使用环境变量中的 API 密钥（OPENAI_API_KEY、ANTHROPIC_API_KEY 或 BUILT_IN_FORGE_API_KEY）。
              如果您想在 UI 中管理多个 API 密钥配置，
              <Link href="/settings/api-keys">
                <Button variant="link" className="px-2 h-auto text-yellow-800 dark:text-yellow-300 underline">
                  点击这里前往设置
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {/* Topic and Progress Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{session.topic}</CardTitle>
                <CardDescription>
                  {selectedAgents.length} 个智能体正在参与讨论
                </CardDescription>
              </div>
              {isCompleted && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  已完成
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">讨论进度</span>
                <span className="font-medium">
                  第 {currentRound || session.currentRound} / {session.maxRounds} 轮
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Agent Status Cards - Grouped by Category */}
        <div className="space-y-6 mb-6">
          {Object.entries(groupedAgents).map(([category, agents]) => {
            if (agents.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {agents.map((agent) => {
                    const status = agentStatuses[agent.id] || "idle";
                    const statusInfo = getStatusBadge(status);
                    const isActive = status === "thinking" || status === "speaking";
                    
                    return (
                      <Card 
                        key={agent.id} 
                        className={`transition-all duration-300 ${isActive ? 'ring-2 ring-offset-2' : ''}`}
                        style={{ 
                          boxShadow: isActive ? `0 0 20px ${agent.color}40` : undefined 
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${isActive ? 'animate-pulse' : ''}`}
                              style={{ backgroundColor: agent.color }}
                            >
                              {agent.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{agent.name}</div>
                              <Badge variant={statusInfo.variant} className="text-xs mt-1">
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {agent.profile}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Discussion Timeline View */}
        {!isRunning && !isCompleted ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {!connected ? (
              <>
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-semibold mb-2">正在连接...</h3>
                <p className="text-sm text-muted-foreground">
                  请稍候，正在建立实时连接
                </p>
              </>
            ) : (
              <>
                <Play className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">准备就绪</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  点击右上角的 <span className="font-semibold text-primary">"开始讨论"</span> 按钮启动智能体讨论
                </p>
                <Button onClick={startDebate} size="lg">
                  <Play className="h-5 w-5 mr-2" />
                  开始讨论
                </Button>
              </>
            )}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>讨论时间线</CardTitle>
              <CardDescription>按轮次展示智能体的讨论进程和评分</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[800px] pr-4">
                {isReplayMode ? (
                  <DebateReplay
                    messages={messages}
                    getAgentById={getAgentById}
                    onExit={() => setIsReplayMode(false)}
                  />
                ) : (
                  <DebateTimeline
                    messages={messages}
                    getAgentById={getAgentById}
                  />
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Highlights Section - Show after completion */}
        {isCompleted && displaySession && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                讨论亮点
              </CardTitle>
              <CardDescription>自动提取的精华内容</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Best Viewpoint */}
                {displaySession.bestViewpoint && (() => {
                  // Find the message with highest total score
                  const bestMessage = messages.reduce((best, msg) => 
                    (msg.totalScore || 0) > (best?.totalScore || 0) ? msg : best
                  , messages[0]);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                          <TrendingUp className="h-4 w-4" />
                          最佳观点
                        </div>
                        {bestMessage?.totalScore && (
                          <Badge variant="secondary" className="text-xs">
                            总分 {bestMessage.totalScore.toFixed(1)}/30
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-sm">{displaySession.bestViewpoint}</p>
                        {bestMessage?.totalScore && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                            <span className="text-xs text-blue-600 dark:text-blue-400">逻辑 {bestMessage.logicScore?.toFixed(1)}</span>
                            <span className="text-xs text-blue-600 dark:text-blue-400">创新 {bestMessage.innovationScore?.toFixed(1)}</span>
                            <span className="text-xs text-blue-600 dark:text-blue-400">表达 {bestMessage.expressionScore?.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Most Innovative */}
                {displaySession.mostInnovative && (() => {
                  // Find the message with highest innovation score
                  const innovativeMessage = messages.reduce((best, msg) => 
                    (msg.innovationScore || 0) > (best?.innovationScore || 0) ? msg : best
                  , messages[0]);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400">
                          <Sparkles className="h-4 w-4" />
                          最创新观点
                        </div>
                        {innovativeMessage?.innovationScore && (
                          <Badge variant="secondary" className="text-xs">
                            创新 {innovativeMessage.innovationScore.toFixed(1)}/10
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <p className="text-sm">{displaySession.mostInnovative}</p>
                        {innovativeMessage?.totalScore && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
                            <span className="text-xs text-purple-600 dark:text-purple-400">逻辑 {innovativeMessage.logicScore?.toFixed(1)}</span>
                            <span className="text-xs text-purple-600 dark:text-purple-400">创新 {innovativeMessage.innovationScore?.toFixed(1)}</span>
                            <span className="text-xs text-purple-600 dark:text-purple-400">表达 {innovativeMessage.expressionScore?.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Golden Quote */}
                {displaySession.goldenQuotes && displaySession.goldenQuotes.length > 0 && (() => {
                  // Find the message with highest expression score
                  const expressiveMessage = messages.reduce((best, msg) => 
                    (msg.expressionScore || 0) > (best?.expressionScore || 0) ? msg : best
                  , messages[0]);
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                          <Quote className="h-4 w-4" />
                          精彩金句
                        </div>
                        {expressiveMessage?.expressionScore && (
                          <Badge variant="secondary" className="text-xs">
                            表达 {expressiveMessage.expressionScore.toFixed(1)}/10
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="text-sm italic">"{displaySession.goldenQuotes[0]}"</p>
                        {expressiveMessage?.totalScore && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                            <span className="text-xs text-amber-600 dark:text-amber-400">逻辑 {expressiveMessage.logicScore?.toFixed(1)}</span>
                            <span className="text-xs text-amber-600 dark:text-amber-400">创新 {expressiveMessage.innovationScore?.toFixed(1)}</span>
                            <span className="text-xs text-amber-600 dark:text-amber-400">表达 {expressiveMessage.expressionScore?.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Quality Rankings */}
              <Separator className="my-6" />
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  发言质量排行榜
                </h4>
                <div className="space-y-3">
                  {messages
                    .filter(msg => msg.totalScore)
                    .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                    .slice(0, 5)
                    .map((msg, index) => {
                      const agent = getAgentById(msg.sender);
                      return (
                        <div key={msg.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{agent?.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {msg.totalScore?.toFixed(1)}/30
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{msg.content}</p>
                            <div className="flex gap-2 mt-2">
                              <span className="text-xs text-muted-foreground">逻辑 {msg.logicScore?.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">创新 {msg.innovationScore?.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">表达 {msg.expressionScore?.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Agent Performance Analysis */}
              <Separator className="my-6" />
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  智能体表现分析
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    const agentStats = selectedAgents.map(agent => {
                      const agentMessages = messages.filter(msg => msg.sender === agent.id && msg.totalScore);
                      if (agentMessages.length === 0) return null;
                      
                      const avgScore = agentMessages.reduce((sum, msg) => sum + (msg.totalScore || 0), 0) / agentMessages.length;
                      const maxScore = Math.max(...agentMessages.map(msg => msg.totalScore || 0));
                      const avgLogic = agentMessages.reduce((sum, msg) => sum + (msg.logicScore || 0), 0) / agentMessages.length;
                      const avgInnovation = agentMessages.reduce((sum, msg) => sum + (msg.innovationScore || 0), 0) / agentMessages.length;
                      const avgExpression = agentMessages.reduce((sum, msg) => sum + (msg.expressionScore || 0), 0) / agentMessages.length;
                      
                      const scores = { 逻辑: avgLogic, 创新: avgInnovation, 表达: avgExpression };
                      const specialty = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
                      
                      return { agent, avgScore, maxScore, specialty, agentMessages: agentMessages.length };
                    }).filter(Boolean);
                    
                    return agentStats.map(stat => stat && (
                      <Card key={stat.agent.id} className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary">
                            {stat.agent.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{stat.agent.name}</div>
                            <div className="text-xs text-muted-foreground">{stat.agentMessages} 条发言</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">平均分</span>
                            <span className="font-medium">{stat.avgScore.toFixed(1)}/30</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">最高分</span>
                            <span className="font-medium">{stat.maxScore.toFixed(1)}/30</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">擅长维度</span>
                            <Badge variant="outline" className="text-xs">{stat.specialty}</Badge>
                          </div>
                        </div>
                      </Card>
                    ));
                  })()}
                </div>
              </div>

              {/* Score Trend Chart */}
              <Separator className="my-6" />
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  讨论质量趋势
                </h4>
                <div className="bg-muted/30 rounded-lg p-4">
                  {(() => {
                    const roundScores = messages.reduce((acc, msg) => {
                      if (!msg.totalScore) return acc;
                      if (!acc[msg.round]) acc[msg.round] = [];
                      acc[msg.round].push(msg.totalScore);
                      return acc;
                    }, {} as Record<number, number[]>);
                    
                    const trendData = Object.entries(roundScores)
                      .sort((a, b) => Number(a[0]) - Number(b[0]))
                      .map(([round, scores]) => ({
                        round: Number(round),
                        avgScore: scores.reduce((sum, s) => sum + s, 0) / scores.length,
                        count: scores.length
                      }));
                    
                    if (trendData.length === 0) return <div className="flex items-center justify-center h-32 text-muted-foreground">暂无评分数据</div>;
                    
                    const maxScore = Math.max(...trendData.map(d => d.avgScore));
                    const minScore = Math.min(...trendData.map(d => d.avgScore));
                    const scoreRange = maxScore - minScore;
                    
                    return (
                      <div className="space-y-3">
                        {/* Chart */}
                        <div className="flex items-end gap-2" style={{ height: '192px' }}>
                          {trendData.map((d, i) => {
                            // 使用固定像素高度，确保柱子可见
                            const maxBarHeight = 160;
                            const minBarHeight = 40;
                            const barHeight = scoreRange > 0 
                              ? minBarHeight + ((d.avgScore - minScore) / scoreRange) * (maxBarHeight - minBarHeight)
                              : maxBarHeight / 2;
                            
                            return (
                              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                {/* Bar container */}
                                <div className="w-full flex flex-col items-center">
                                  <span className="text-xs font-medium text-primary mb-1">{d.avgScore.toFixed(1)}</span>
                                  <div 
                                    className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t transition-all hover:from-primary/90 hover:to-primary/50 cursor-pointer shadow-sm"
                                    style={{ height: `${barHeight}px` }}
                                    title={`第${d.round}轮: 平均分 ${d.avgScore.toFixed(2)} (${d.count}条发言)`}
                                  />
                                </div>
                                {/* Label */}
                                <span className="text-xs text-muted-foreground">第{d.round}轮</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Legend */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>最低: {minScore.toFixed(1)}分</span>
                          <span>最高: {maxScore.toFixed(1)}分</span>
                          <span>平均: {(trendData.reduce((sum, d) => sum + d.avgScore, 0) / trendData.length).toFixed(1)}分</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Full Summary */}
              <Separator className="my-6" />
              <div className="space-y-4">
                <h4 className="font-semibold">完整总结</h4>
                {displaySession.summary && (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <Streamdown>{displaySession.summary}</Streamdown>
                  </div>
                )}

                {displaySession.keyPoints && displaySession.keyPoints.length > 0 && (
                  <>
                    <h4 className="font-semibold mt-6">关键观点</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {displaySession.keyPoints.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </>
                )}

                {displaySession.disagreements && displaySession.disagreements.length > 0 && (
                  <>
                    <h4 className="font-semibold mt-6">分歧点</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                      {displaySession.disagreements.map((point, index) => (
                        <li key={index}>{point}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
