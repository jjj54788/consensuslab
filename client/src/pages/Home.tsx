import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { MessageSquare, Users, TrendingUp, History } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">ConsensusLab</h1>
          </div>
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">欢迎，{user?.name}</span>
                <Link href="/debates">
                  <Button>进入平台</Button>
                </Link>
              </div>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>登录</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-5xl font-bold tracking-tight">
            探索思维的多维空间
            <span className="text-primary">构建决策的共识基石</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            ConsensusLab 是一个多智能体协商平台，通过8位专家智能体的多维度论证，帮助你探索复杂问题的共识空间，提升决策质量
          </p>
          <div className="flex gap-4 justify-center pt-4">
            {isAuthenticated ? (
              <Link href="/debates/new">
                <Button size="lg">启动协商会议</Button>
              </Link>
            ) : (
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>立即开始</a>
              </Button>
            )}
            <Link href="/debates">
              <Button size="lg" variant="outline">
                协商档案
              </Button>
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/templates">
                  <Button size="lg" variant="outline">
                    我的模板
                  </Button>
                </Link>
                <Link href="/settings/api-keys">
                  <Button size="lg" variant="outline">
                    AI 设置
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>专家智能体</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                8位专家智能体，覆盖论证、评估、综合三大维度，每个智能体都有独特的专业视角
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-10 w-10 text-primary mb-2" />
              <CardTitle>实时协商追踪</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                通过 WebSocket 实时追踪协商进程，动态呈现观点交锋与共识形成过程
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>智能共识构建</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                智能生成共识报告，自动提炼关键洞察、核心论证与精彩摘录，快速把握协商成果
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <History className="h-10 w-10 text-primary mb-2" />
              <CardTitle>协商档案</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                完整保存所有协商记录，支持随时回顾和分析历史协商会议内容
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">如何使用</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">设定协商议题</h3>
                <p className="text-muted-foreground">
                  输入你想要探讨的任何议题，可以是战略决策、学术研究、职业规划、创新孵化等
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">选择专家智能体</h3>
                <p className="text-muted-foreground">
                  从8位专家智能体中选择参与协商的成员，不同组合会产生不同的论证视角
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">追踪协商进程</h3>
                <p className="text-muted-foreground">
                  专家智能体们会展开多轮论证，实时显示协商过程，你可以看到每个智能体的状态和观点陈述
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">获取共识报告</h3>
                <p className="text-muted-foreground">
                  协商结束后，系统会自动生成共识报告，包含关键洞察、核心论证、质量评估和专家贡献度分析
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container py-8 text-center text-sm text-muted-foreground">
          <p>ConsensusLab - 基于 MetaGPT 的多智能体协商平台</p>
        </div>
      </footer>
    </div>
  );
}
