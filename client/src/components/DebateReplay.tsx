import { useState, useEffect } from "react";
import { Message } from "../../../drizzle/schema";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Separator } from "./ui/separator";
import { Streamdown } from "streamdown";
import { 
  MessageCircle, 
  TrendingUp, 
  Sparkles, 
  Lightbulb,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw
} from "lucide-react";

interface DebateReplayProps {
  messages: any[];
  getAgentById: (id: string) => any;
  onExit: () => void;
}

export function DebateReplay({ messages, getAgentById, onExit }: DebateReplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 1.5x, 2x

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying || currentIndex >= messages.length) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= messages.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000 / speed); // Base delay 2 seconds

    return () => clearInterval(interval);
  }, [isPlaying, currentIndex, messages.length, speed]);

  const handlePlayPause = () => {
    if (currentIndex >= messages.length - 1 && !isPlaying) {
      // Restart from beginning
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (currentIndex < messages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const handleSpeedChange = () => {
    setSpeed((prev) => {
      if (prev === 1) return 1.5;
      if (prev === 1.5) return 2;
      return 1;
    });
  };

  const visibleMessages = messages.slice(0, currentIndex + 1);

  // Group messages by round
  const messagesByRound = visibleMessages.reduce((acc, msg) => {
    if (!acc[msg.round]) acc[msg.round] = [];
    acc[msg.round].push(msg);
    return acc;
  }, {} as Record<number, Message[]>);

  const rounds = Object.keys(messagesByRound).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-4">
      {/* Replay Control Bar */}
      <Card className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                回放模式
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} / {messages.length}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={onExit}>
              退出回放
            </Button>
          </div>

          {/* Progress Bar */}
          <Slider
            value={[currentIndex]}
            max={messages.length - 1}
            step={1}
            onValueChange={([value]) => setCurrentIndex(value)}
            className="w-full"
          />

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              disabled={currentIndex === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex >= messages.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSpeedChange}
            >
              {speed}x
            </Button>
          </div>
        </div>
      </Card>

      {/* Timeline Content */}
      <div className="space-y-6">
        {rounds.map((roundNum) => {
          const roundMessages = messagesByRound[Number(roundNum)];
          
          return (
            <div key={roundNum} className="space-y-4">
              {/* Round Header */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    第 {roundNum} 轮讨论
                  </span>
                </div>
                <Separator className="flex-1" />
              </div>

              {/* Messages in this round */}
              <div className="space-y-4">
                {roundMessages.map((message: any, idx: number) => {
                  const agent = getAgentById(message.sender);
                  const isLeft = idx % 2 === 0;
                  const hasScores = message.totalScore != null && message.totalScore > 0;
                  const isLatest = message.id === messages[currentIndex].id;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'} animate-in fade-in slide-in-from-bottom-2 duration-500 ${
                        isLatest ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg' : ''
                      }`}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
