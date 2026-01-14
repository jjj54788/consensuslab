import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Check, Sparkles, Save, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function NewDebate() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [topic, setTopic] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [maxRounds, setMaxRounds] = useState(5);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // 推荐话题列表
  const recommendedTopics = [
    "AI Agent 是泡沫还是未来？",
    "远程办公会成为主流工作模式吗？",
    "元宇宙技术能否改变人类社交方式？",
    "基因编辑技术应该被允许用于人类吗？",
    "加密货币能否取代传统货币体系？",
  ];

  const { data: agents, isLoading: agentsLoading } = trpc.agents.list.useQuery();
  const { data: templates } = trpc.templates.list.useQuery(undefined, {
    enabled: !!user,
  });
  const saveTemplate = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success("模板保存成功！");
      setShowSaveDialog(false);
      setTemplateName("");
      setTemplateDescription("");
    },
    onError: (error) => {
      toast.error(`保存失败：${error.message}`);
    },
  });
  const createDebate = trpc.debate.create.useMutation({
    onSuccess: (data) => {
      toast.success("协商会议创建成功！");
      setLocation(`/debates/${data.sessionId}`);
    },
    onError: (error) => {
      toast.error(`创建失败：${error.message}`);
    },
  });

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  const handleSelectAll = () => {
    if (agents) {
      setSelectedAgents(agents.map((agent) => agent.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedAgents([]);
  };

  const handleSelectCategory = (category: string) => {
    if (!agents) return;
    const categoryAgents = agents.filter((agent) => agent.category === category);
    const categoryAgentIds = categoryAgents.map((agent) => agent.id);
    // 合并到现有选择
    setSelectedAgents((prev) => {
      const newSet = new Set([...prev, ...categoryAgentIds]);
      return Array.from(newSet);
    });
  };

  const handleTopicSelect = (selectedTopic: string) => {
    setTopic(selectedTopic);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("请输入模板名称");
      return;
    }
    if (selectedAgents.length < 2) {
      toast.error("请至少选择2个智能体");
      return;
    }
    saveTemplate.mutate({
      name: templateName.trim(),
      description: templateDescription.trim() || undefined,
      agentIds: selectedAgents,
      rounds: maxRounds,
    });
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates?.find((t) => t.id === templateId);
    if (template) {
      setSelectedAgents(template.agentIds as string[]);
      setMaxRounds(template.rounds);
      setSelectedTemplateId(templateId);
      toast.success(`已加载模板：${template.name}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!topic.trim()) {
      toast.error("请输入协商议题");
      return;
    }

    if (selectedAgents.length < 2) {
      toast.error("请至少选择 2 个智能体");
      return;
    }

    createDebate.mutate({
      topic: topic.trim(),
      agentIds: selectedAgents,
      maxRounds,
    });
  };

  if (authLoading || agentsLoading) {
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
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">启动协商会议</h1>
            <p className="text-muted-foreground">
              选择专家智能体，设定协商议题，开启多维度思考之旅
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Topic Input */}
            <Card>
              <CardHeader>
                <CardTitle>协商议题</CardTitle>
                <CardDescription>输入你想要探讨的问题或议题</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="例如：人工智能是否会取代人类的工作？（战略决策/学术研究/职业规划/创新孵化）"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">
                    <Sparkles className="inline h-3 w-3 mr-1" />
                    推荐话题
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {recommendedTopics.map((recommendedTopic, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleTopicSelect(recommendedTopic)}
                        className="text-xs"
                      >
                        {recommendedTopic}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Agent Selection */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>选择参与智能体</CardTitle>
                    <CardDescription>至少选择 2 个智能体参与讨论</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {user && templates && templates.length > 0 && (
                      <Select value={selectedTemplateId} onValueChange={handleLoadTemplate}>
                        <SelectTrigger className="w-[180px] h-9">
                          <FolderOpen className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="加载模板" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates
                            .sort((a, b) => {
                              // System templates first
                              if (a.isSystem && !b.isSystem) return -1;
                              if (!a.isSystem && b.isSystem) return 1;
                              return 0;
                            })
                            .map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex items-center gap-2">
                                  {template.name}
                                  {template.isSystem && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      系统推荐
                                    </span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                    {user && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSaveDialog(true)}
                        disabled={selectedAgents.length < 2}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        保存为模板
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      全选
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAll}
                    >
                      取消全选
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 分组显示区域 */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* 观点论证组 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">观点论证组</h3>
                        <p className="text-xs text-muted-foreground">提出不同立场的观点</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectCategory("debater")}
                        className="h-7 text-xs"
                      >
                        全选
                      </Button>
                    </div>
                    {agents
                      ?.filter((agent) => agent.category === "debater")
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((agent) => {
                        const isSelected = selectedAgents.includes(agent.id);
                        return (
                          <div
                            key={agent.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-accent/50"
                            }`}
                            onClick={() => handleAgentToggle(agent.id)}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={`flex items-center justify-center w-4 h-4 rounded border-2 transition-all mt-0.5 ${
                                  isSelected
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: agent.color }}
                                  />
                                  <span className="font-medium text-sm">{agent.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {agent.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* 质量评估组 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">质量评估组</h3>
                        <p className="text-xs text-muted-foreground">评估发言质量维度</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectCategory("evaluator")}
                        className="h-7 text-xs"
                      >
                        全选
                      </Button>
                    </div>
                    {agents
                      ?.filter((agent) => agent.category === "evaluator")
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((agent) => {
                        const isSelected = selectedAgents.includes(agent.id);
                        return (
                          <div
                            key={agent.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-accent/50"
                            }`}
                            onClick={() => handleAgentToggle(agent.id)}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={`flex items-center justify-center w-4 h-4 rounded border-2 transition-all mt-0.5 ${
                                  isSelected
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: agent.color }}
                                  />
                                  <span className="font-medium text-sm">{agent.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {agent.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* 专业分析组 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm">专业分析组</h3>
                        <p className="text-xs text-muted-foreground">提供专业视角分析</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectCategory("specialist")}
                        className="h-7 text-xs"
                      >
                        全选
                      </Button>
                    </div>
                    {agents
                      ?.filter((agent) => agent.category === "specialist")
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((agent) => {
                        const isSelected = selectedAgents.includes(agent.id);
                        return (
                          <div
                            key={agent.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-accent/50"
                            }`}
                            onClick={() => handleAgentToggle(agent.id)}
                          >
                            <div className="flex items-start gap-2">
                              <div
                                className={`flex items-center justify-center w-4 h-4 rounded border-2 transition-all mt-0.5 ${
                                  isSelected
                                    ? "bg-primary border-primary"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: agent.color }}
                                  />
                                  <span className="font-medium text-sm">{agent.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {agent.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rounds Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>讨论轮数</CardTitle>
                <CardDescription>设置讨论的轮数（1-99 轮）</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={maxRounds}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val) && val >= 1 && val <= 99) {
                        setMaxRounds(val);
                      }
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    每个智能体将发言 {maxRounds} 次
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link href="/">
                <Button type="button" variant="outline">
                  取消
                </Button>
              </Link>
              <Button type="submit" disabled={createDebate.isPending}>
                {createDebate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  "开始讨论"
                )}
              </Button>
            </div>
          </form>
        </div>
      </main>

      {/* 保存模板对话框 */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>保存为模板</DialogTitle>
            <DialogDescription>
              保存当前的智能体组合和轮数配置，下次可以快速加载。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">模板名称 *</Label>
              <Input
                id="template-name"
                placeholder="例如：全面分析模板"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">模板描述（可选）</Label>
              <Textarea
                id="template-description"
                placeholder="简要描述该模板的用途..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>将保存：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{selectedAgents.length} 个智能体</li>
                <li>{maxRounds} 轮讨论</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={saveTemplate.isPending}
            >
              {saveTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存模板"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
