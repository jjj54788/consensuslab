import { useState } from "react";
import { Message } from "../../../drizzle/schema";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";
import { Streamdown } from "streamdown";
import { MessageCircle, TrendingUp, Sparkles, Lightbulb, ChevronDown, ChevronRight, Maximize2, Minimize2 } from "lucide-react";

interface DebateTimelineProps {
  messages: any[]; // Use any to avoid type conflicts
  getAgentById: (id: string) => any;
}

export function DebateTimeline({ messages, getAgentById }: DebateTimelineProps) {
  // Group messages by round
  const messagesByRound = messages.reduce((acc, msg) => {
    if (!acc[msg.round]) acc[msg.round] = [];
    acc[msg.round].push(msg);
    return acc;
  }, {} as Record<number, Message[]>);

  const rounds = Object.keys(messagesByRound).sort((a, b) => Number(a) - Number(b));
  
  // Collapse state for each round - default all collapsed
  const [collapsedRounds, setCollapsedRounds] = useState<Record<number, boolean>>(
    rounds.reduce((acc, round) => {
      acc[Number(round)] = true; // Default collapsed
      return acc;
    }, {} as Record<number, boolean>)
  );

  const toggleRound = (round: number) => {
    setCollapsedRounds(prev => ({
      ...prev,
      [round]: !prev[round]
    }));
  };

  const expandAll = () => {
    setCollapsedRounds(rounds.reduce((acc, round) => {
      acc[Number(round)] = false;
      return acc;
    }, {} as Record<number, boolean>));
  };

  const collapseAll = () => {
    setCollapsedRounds(rounds.reduce((acc, round) => {
      acc[Number(round)] = true;
      return acc;
    }, {} as Record<number, boolean>));
  };

  const allExpanded = rounds.every(round => !collapsedRounds[Number(round)]);

  return (
    <div className="space-y-6">
      {/* Global Expand/Collapse Control */}
      {rounds.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={allExpanded ? collapseAll : expandAll}
            className="gap-2"
          >
            {allExpanded ? (
              <>
                <Minimize2 className="h-4 w-4" />
                全部折叠
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                全部展开
              </>
            )}
          </Button>
        </div>
      )}

      {rounds.map((roundNum) => {
        const roundMessages = messagesByRound[Number(roundNum)];
        const isCollapsed = collapsedRounds[Number(roundNum)];
        const agentCount = new Set(roundMessages.map((m: any) => m.sender)).size;
        
        return (
          <div key={roundNum} className="space-y-4">
            {/* Round Header - Clickable */}
            <div 
              className="flex items-center gap-4 cursor-pointer group hover:opacity-80 transition-opacity"
              onClick={() => toggleRound(Number(roundNum))}
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-primary transition-transform group-hover:translate-y-0.5" />
                )}
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  第 {roundNum} 轮讨论
                </span>
                {isCollapsed && (
                  <Badge variant="secondary" className="text-xs ml-2">
                    {roundMessages.length} 条发言 · {agentCount} 位智能体
                  </Badge>
                )}
              </div>
              <Separator className="flex-1" />
            </div>

            {/* Messages in this round - Collapsible */}
            {!isCollapsed && (
              <div className="space-y-4">
                {roundMessages.map((message: any, idx: number) => {
                  const agent = getAgentById(message.sender);
                  const isLeft = idx % 2 === 0;
                  const hasScores = message.totalScore != null && message.totalScore > 0;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      {/* Agent Avatar with Glow */}
                      <div className="flex-shrink-0">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-offset-2 ring-offset-background transition-transform hover:scale-110"
                          style={{ 
                            backgroundColor: agent?.color || '#999',
                            boxShadow: `0 0 20px ${agent?.color}40`
                          }}
                        >
                          {agent?.name?.charAt(0) || '?'}
                        </div>
                      </div>

                      {/* Message Card */}
                      <Card className={`flex-1 max-w-2xl border-2 transition-all hover:shadow-lg ${
                        hasScores && message.totalScore >= 24 ? 'border-yellow-400/50 bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                      }`}>
                        <div className="p-4 space-y-3">
                          {/* Agent Name and Role */}
                          <div className={`flex items-center gap-3 ${isLeft ? '' : 'flex-row-reverse'}`}>
                            <span className="font-bold text-sm" style={{ color: agent?.color }}>
                              {agent?.name || '未知智能体'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {agent?.profile || '未知角色'}
                            </Badge>
                            {hasScores && message.totalScore >= 24 && (
                              <Badge className="bg-yellow-500 text-white text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                高分发言
                              </Badge>
                            )}
                          </div>

                          {/* Message Content */}
                          <div className="prose prose-sm max-w-none dark:prose-invert text-left">
                            <Streamdown>{message.content}</Streamdown>
                          </div>

                          {/* Scores Section */}
                          {hasScores && (
                            <div className="pt-3 border-t space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs font-semibold text-muted-foreground">评分详情</span>
                                </div>
                                <Badge variant="secondary" className="text-sm font-bold">
                                  总分: {(message.totalScore ?? 0).toFixed(1)}/30
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                  <span className="text-xs text-muted-foreground">逻辑严谨</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-indigo-600">
                                      {message.logicScore?.toFixed(1) || 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground">/10</span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-1 p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                  <span className="text-xs text-muted-foreground">创新思维</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-pink-600">
                                      {message.innovationScore?.toFixed(1) || 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground">/10</span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-1 p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                                  <span className="text-xs text-muted-foreground">表达清晰</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-teal-600">
                                      {message.expressionScore?.toFixed(1) || 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground">/10</span>
                                  </div>
                                </div>
                              </div>

                              {/* Scoring Reasons */}
                              {message.scoringReasons && (
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground flex items-center gap-2 py-1">
                                    <Lightbulb className="h-3 w-3" />
                                    查看评分理由
                                  </summary>
                                  <div className="mt-2 space-y-2 pl-5 border-l-2 border-muted">
                                    {typeof message.scoringReasons === 'string' ? (
                                      <p className="text-muted-foreground">{message.scoringReasons}</p>
                                    ) : (
                                      <>
                                        <div className="space-y-1">
                                          <span className="font-semibold text-indigo-600">逻辑评分:</span>
                                          <p className="text-muted-foreground">{message.scoringReasons.logic}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="font-semibold text-pink-600">创新评分:</span>
                                          <p className="text-muted-foreground">{message.scoringReasons.innovation}</p>
                                        </div>
                                        <div className="space-y-1">
                                          <span className="font-semibold text-teal-600">表达评分:</span>
                                          <p className="text-muted-foreground">{message.scoringReasons.expression}</p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </details>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">暂无讨论记录</h3>
          <p className="text-sm text-muted-foreground">
            讨论开始后，智能体的发言将在这里显示
          </p>
        </div>
      )}
    </div>
  );
}
