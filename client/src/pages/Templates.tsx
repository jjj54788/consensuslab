import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Pencil, Trash2, Users, RotateCw } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Templates() {
  const { user, loading: authLoading } = useAuth();
  const [editingTemplate, setEditingTemplate] = useState<{
    id: string;
    name: string;
    description: string;
    agentIds: string[];
    rounds: number;
  } | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

  const { data: templates, isLoading, refetch } = trpc.templates.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: agents } = trpc.agents.list.useQuery();

  const updateTemplate = trpc.templates.update.useMutation({
    onSuccess: () => {
      toast.success("模板更新成功！");
      setEditingTemplate(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失败：${error.message}`);
    },
  });

  const deleteTemplate = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("模板删除成功！");
      setDeletingTemplateId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`删除失败：${error.message}`);
    },
  });

  const handleUpdateTemplate = () => {
    if (!editingTemplate) return;
    if (!editingTemplate.name.trim()) {
      toast.error("请输入模板名称");
      return;
    }
    updateTemplate.mutate({
      id: editingTemplate.id,
      name: editingTemplate.name.trim(),
      description: editingTemplate.description.trim() || undefined,
      agentIds: editingTemplate.agentIds,
      rounds: editingTemplate.rounds,
    });
  };

  const handleDeleteTemplate = () => {
    if (!deletingTemplateId) return;
    deleteTemplate.mutate({ id: deletingTemplateId });
  };

  const getAgentNames = (agentIds: string[]) => {
    if (!agents) return "";
    return agentIds
      .map((id) => agents.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join("、");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>需要登录</CardTitle>
            <CardDescription>请先登录以查看您的模板</CardDescription>
          </CardHeader>
        </Card>
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">我的模板</h1>
            <p className="text-muted-foreground">
              管理您保存的讨论模板，快速创建相似配置的讨论
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription className="mt-2">
                            {template.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingTemplate({
                              id: template.id,
                              name: template.name,
                              description: template.description || "",
                              agentIds: template.agentIds as string[],
                              rounds: template.rounds,
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingTemplateId(template.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium mb-1">
                            智能体 ({(template.agentIds as string[]).length} 个)
                          </p>
                          <p className="text-muted-foreground">
                            {getAgentNames(template.agentIds as string[])}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RotateCw className="h-4 w-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          讨论轮数：<span className="font-medium text-foreground">{template.rounds}</span> 轮
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        更新于 {new Date(template.updatedAt).toLocaleString("zh-CN")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">您还没有保存任何模板</p>
                <Link href="/debates/new">
                  <Button>创建讨论并保存模板</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* 编辑模板对话框 */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑模板</DialogTitle>
            <DialogDescription>
              修改模板的名称和描述
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-template-name">模板名称 *</Label>
                <Input
                  id="edit-template-name"
                  value={editingTemplate.name}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-template-description">模板描述（可选）</Label>
                <Textarea
                  id="edit-template-description"
                  value={editingTemplate.description}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>当前配置：</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{editingTemplate.agentIds.length} 个智能体</li>
                  <li>{editingTemplate.rounds} 轮讨论</li>
                </ul>
                <p className="text-xs mt-2">注：智能体和轮数配置不可在此修改</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              取消
            </Button>
            <Button onClick={handleUpdateTemplate} disabled={updateTemplate.isPending}>
              {updateTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                "保存更改"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deletingTemplateId} onOpenChange={() => setDeletingTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个模板吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </>
              ) : (
                "删除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
