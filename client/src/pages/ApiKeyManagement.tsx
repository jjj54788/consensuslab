import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Key, CheckCircle2, XCircle } from "lucide-react";

export default function ApiKeyManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [isTestingKey, setIsTestingKey] = useState(false);

  // Fetch data
  const { data: providers, isLoading: loadingProviders } = trpc.modelProviders.list.useQuery();
  const { data: userApiKeys, isLoading: loadingKeys, refetch: refetchKeys } = trpc.apiKeys.list.useQuery();

  // Mutations
  const saveKeyMutation = trpc.apiKeys.save.useMutation({
    onSuccess: () => {
      toast.success("API密钥已保存");
      setIsAddDialogOpen(false);
      setApiKey("");
      setSelectedProviderId(null);
      refetchKeys();
    },
    onError: (error) => {
      toast.error(`保存失败: ${error.message}`);
    },
  });

  const deleteKeyMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("API密钥已删除");
      refetchKeys();
    },
    onError: (error) => {
      toast.error(`删除失败: ${error.message}`);
    },
  });

  const testKeyMutation = trpc.apiKeys.test.useMutation();

  const handleTestKey = async () => {
    if (!selectedProviderId || !apiKey) {
      toast.error("请选择提供商并输入API密钥");
      return;
    }

    setIsTestingKey(true);
    try {
      const result = await testKeyMutation.mutateAsync({
        providerId: selectedProviderId,
        apiKey,
      });

      if (result.success) {
        toast.success("API密钥验证成功！");
      } else {
        toast.error(`验证失败: ${result.message}`);
      }
    } catch (error) {
      toast.error("验证过程出错");
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleSaveKey = () => {
    if (!selectedProviderId || !apiKey) {
      toast.error("请选择提供商并输入API密钥");
      return;
    }

    saveKeyMutation.mutate({
      providerId: selectedProviderId,
      apiKey,
    });
  };

  const handleDeleteKey = (providerId: number) => {
    if (confirm("确定要删除这个API密钥吗？")) {
      deleteKeyMutation.mutate({ providerId });
    }
  };

  if (loadingProviders || loadingKeys) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI 模型设置</h1>
            <p className="text-muted-foreground mt-2">
              管理您的AI模型API密钥，使用自己的密钥可以降低使用成本
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                添加API密钥
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加API密钥</DialogTitle>
                <DialogDescription>
                  选择AI模型提供商并输入您的API密钥。密钥将被加密存储。
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">模型提供商</Label>
                  <Select
                    value={selectedProviderId?.toString()}
                    onValueChange={(value) => setSelectedProviderId(parseInt(value))}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="选择提供商" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers?.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id.toString()}>
                          {provider.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API密钥</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    您的API密钥将被加密存储，仅用于调用AI模型
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestKey}
                  disabled={isTestingKey || !selectedProviderId || !apiKey}
                >
                  {isTestingKey ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      验证中...
                    </>
                  ) : (
                    "测试连接"
                  )}
                </Button>
                <Button
                  onClick={handleSaveKey}
                  disabled={saveKeyMutation.isPending || !selectedProviderId || !apiKey}
                >
                  {saveKeyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* API Keys List */}
        <div className="grid gap-4">
          {userApiKeys && userApiKeys.length > 0 ? (
            userApiKeys.map((key) => (
              <Card key={key.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Key className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{key.providerDisplayName}</CardTitle>
                        <CardDescription>
                          添加于 {new Date(key.createdAt).toLocaleDateString("zh-CN")}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {key.isActive ? (
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          已激活
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <XCircle className="h-4 w-4" />
                          未激活
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteKey(key.providerId)}
                        disabled={deleteKeyMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    API密钥已加密存储，可在创建协商时选择使用此提供商的模型
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">还没有配置API密钥</h3>
                <p className="text-muted-foreground mb-4">
                  添加您的OpenAI或Claude API密钥，即可使用自己的额度进行协商
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加第一个API密钥
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">如何获取API密钥？</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">OpenAI:</strong> 访问{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                platform.openai.com/api-keys
              </a>{" "}
              创建API密钥
            </div>
            <div>
              <strong className="text-foreground">Claude:</strong> 访问{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com/settings/keys
              </a>{" "}
              创建API密钥
            </div>
            <div className="pt-2 border-t">
              <strong className="text-foreground">注意:</strong> 请妥善保管您的API密钥，不要分享给他人。
              系统会加密存储您的密钥，仅用于调用AI模型。
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
