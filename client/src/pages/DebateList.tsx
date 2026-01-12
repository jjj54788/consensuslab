import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Plus, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function DebateList() {
  const { user, loading: authLoading } = useAuth();
  const { data: sessions, isLoading: sessionsLoading } = trpc.debate.list.useQuery();
  const { data: agents } = trpc.agents.list.useQuery();

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "待开始", variant: "secondary" as const },
      running: { label: "进行中", variant: "default" as const },
      paused: { label: "已暂停", variant: "outline" as const },
      completed: { label: "已完成", variant: "default" as const },
      error: { label: "错误", variant: "destructive" as const },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const getAgentNames = (agentIds: string[]) => {
    if (!agents) return "";
    return agents
      .filter((agent) => agentIds.includes(agent.id))
      .map((agent) => agent.name)
      .join("、");
  };

  if (authLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回首页
              </Button>
            </Link>
            <Link href="/debates/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建讨论
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">我的讨论</h1>
          <p className="text-muted-foreground">查看和管理你的所有讨论记录</p>
        </div>

        {!sessions || sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">还没有讨论记录</h3>
              <p className="text-muted-foreground mb-4">创建你的第一个讨论，让 AI 智能体为你分析问题</p>
              <Link href="/debates/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  创建新讨论
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {sessions.map((session) => {
              const statusInfo = getStatusBadge(session.status);
              const createdAt = new Date(session.createdAt);
              const timeAgo = formatDistanceToNow(createdAt, {
                addSuffix: true,
                locale: zhCN,
              });

              return (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">{session.topic}</CardTitle>
                        <CardDescription>
                          参与智能体：{getAgentNames(session.agentIds)}
                        </CardDescription>
                      </div>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span>
                          进度：{session.currentRound} / {session.maxRounds} 轮
                        </span>
                        <span>创建于 {timeAgo}</span>
                      </div>
                      <Link href={`/debates/${session.id}`}>
                        <Button variant="outline" size="sm">
                          {session.status === "completed" ? "查看详情" : "继续讨论"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
