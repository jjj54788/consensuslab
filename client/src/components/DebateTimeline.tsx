import { Message } from "../../../drizzle/schema";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Separator } from "./ui/separator";

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

  return (
    <div className="space-y-8">
      {rounds.map((roundNum) => {
        const roundMessages = messagesByRound[Number(roundNum)];
        
        return (
          <div key={roundNum} className="space-y-4">
            {/* Round Header */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm font-semibold">
                第 {roundNum} 轮
              </Badge>
              <Separator className="flex-1" />
            </div>

            {/* Messages in this round */}
            <div className="space-y-6 pl-4 border-l-2 border-muted">
              {roundMessages.map((message: any, idx: number) => {
                const agent = getAgentById(message.sender);
                const isLeft = idx % 2 === 0;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    {/* Agent Avatar */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        agent?.role === '批判者' ? 'bg-orange-500' :
                        agent?.role === '创新者' ? 'bg-purple-500' :
                        agent?.role === '支持者' ? 'bg-green-500' :
                        agent?.role === '反对者' ? 'bg-red-500' :
                        agent?.role === '中立者' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}>
                        {agent?.role?.substring(0, 1) || '?'}
                      </div>
                    </div>

                    {/* Message Card */}
                    <Card className={`flex-1 max-w-2xl ${isLeft ? '' : 'text-right'}`}>
                      <div className="p-4 space-y-3">
                        {/* Agent Name */}
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{agent?.role || '未知'}</span>
                          <span className="text-xs text-muted-foreground">{agent?.description}</span>
                        </div>

                        {/* Message Content */}
                        <p className="text-sm leading-relaxed text-left">{message.content}</p>

                        {/* Scores */}
                        {message.totalScore != null && message.totalScore > 0 && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center gap-4 text-xs">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">总分:</span>
                                <span className="font-semibold text-primary">{message.totalScore}/30</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">逻辑:</span>
                                <span className="font-semibold text-indigo-600">{message.logicScore}/10</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">创新:</span>
                                <span className="font-semibold text-pink-600">{message.innovationScore}/10</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">表达:</span>
                                <span className="font-semibold text-teal-600">{message.expressionScore}/10</span>
                              </div>
                            </div>
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
  );
}
