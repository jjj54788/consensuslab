# 🚀 简化配置 - 从 .env 文件读取 API 密钥

## 📝 说明

系统已简化为**直接从 `.env` 文件读取 API 密钥**，无需在 UI 中配置。所有 AI 模型调用会自动使用环境变量中的 API 密钥。

## ⚡ 快速配置

### 步骤 1: 停止服务器

```bash
# 如果使用 pm2:
pm2 stop consensuslab

# 或直接运行的话按 Ctrl+C
```

### 步骤 2: 配置 .env 文件

编辑项目根目录的 `.env` 文件，添加以下配置之一：

```bash
# 选项1: OpenAI (推荐 - 最稳定)
OPENAI_API_KEY=sk-your_actual_openai_key_here

# 选项2: Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your_actual_anthropic_key_here

# 选项3: Manus AI
BUILT_IN_FORGE_API_KEY=your_manus_key_here
```

**重要提示**：
- 只需配置**一个**即可
- 使用**真实的** API 密钥替换示例值
- 不要在密钥前后添加引号或空格
- 优先级：OpenAI > Anthropic > Manus

### 步骤 3: 重新编译项目

```bash
cd /home/ai4news/consensuslab
pnpm build
```

这会编译新的代码，使系统能够从 .env 文件读取 API 密钥。

### 步骤 4: 重启服务器

```bash
# 使用 pm2:
pm2 restart consensuslab

# 或直接运行:
pnpm start
```

### 步骤 5: 验证配置

启动时应该看到这样的输出：

```
========================================
ConsensusLab Server Starting...
========================================
AI Provider Configuration:
- OPENAI_API_KEY: ✓ Configured     <-- 这里应该是 ✓
- ANTHROPIC_API_KEY: ✗ Not set
- BUILT_IN_FORGE_API_KEY: ✗ Not set

✓ At least one AI provider is configured  <-- 这里应该显示
========================================
```

**确认**：至少看到一个 `✓ Configured`

### 步骤 6: 测试讨论功能

1. 打开网站
2. 点击"启动协商会议"
3. 选择智能体和议题
4. 点击"开始讨论"
5. 查看服务器日志：
   ```
   [AIProviderService] Using OpenAI from OPENAI_API_KEY
   [DebateEngine] Generating response for 反对者...
   [DebateEngine] ✓ Response generated successfully
   ```

## 🔑 获取 API 密钥

### OpenAI (推荐)
1. 访问: https://platform.openai.com/api-keys
2. 点击 "Create new secret key"
3. 复制密钥 (以 `sk-` 开头)
4. 添加到 .env: `OPENAI_API_KEY=sk-xxx`

### Anthropic Claude
1. 访问: https://console.anthropic.com/settings/keys
2. 创建新的 API 密钥
3. 复制密钥 (以 `sk-ant-` 开头)
4. 添加到 .env: `ANTHROPIC_API_KEY=sk-ant-xxx`

### Manus AI
1. 访问: https://portal.manus.im
2. 获取 API 密钥
3. 添加到 .env: `BUILT_IN_FORGE_API_KEY=xxx`

## 🐛 故障排除

### 问题: 启动时仍提示 "No AI provider configured"

**原因**: `.env` 文件配置不正确或未生效

**解决方案**:

1. **检查 .env 文件是否存在**:
   ```bash
   ls -la /home/ai4news/consensuslab/.env
   ```

2. **检查 .env 文件内容**:
   ```bash
   cat /home/ai4news/consensuslab/.env | grep API_KEY
   ```
   应该能看到你的 API 密钥

3. **检查格式是否正确**:
   ```bash
   # ✅ 正确格式 (无空格，无引号):
   OPENAI_API_KEY=sk-abc123

   # ❌ 错误格式 (有空格):
   OPENAI_API_KEY = sk-abc123

   # ❌ 错误格式 (有引号):
   OPENAI_API_KEY="sk-abc123"
   ```

4. **确认 pm2 加载了环境变量**:
   ```bash
   pm2 env consensuslab | grep API_KEY
   ```

5. **如果还是不行，尝试重新加载 pm2**:
   ```bash
   pm2 delete consensuslab
   pm2 start npm --name consensuslab -- start
   ```

### 问题: 讨论开始后没有响应

**原因**: API 密钥无效或网络问题

**解决方案**:

1. **验证 API 密钥是否有效**:
   - 登录 OpenAI/Anthropic 控制台
   - 检查密钥是否过期
   - 确认账户有余额

2. **检查服务器日志**:
   ```bash
   pm2 logs consensuslab --lines 100
   ```
   查找错误信息

3. **测试 API 连接**:
   ```bash
   # OpenAI
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"

   # Anthropic
   curl https://api.anthropic.com/v1/models \
     -H "x-api-key: $ANTHROPIC_API_KEY"
   ```

### 问题: pnpm 命令未找到

**解决方案**:
```bash
npm install -g pnpm
```

## 📊 配置示例

### 完整的 .env 文件示例:

```bash
# 数据库配置
DATABASE_URL=mysql://user:password@localhost:3306/consensuslab

# JWT 密钥
JWT_SECRET=your_random_secret_key_here

# AI API 密钥 (三选一)
OPENAI_API_KEY=sk-proj-abc123xyz...

# OAuth (可选)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your_app_id

# 服务器配置
PORT=3000
NODE_ENV=production
```

## ✅ 配置成功的标志

启动时看到:
```
✓ At least one AI provider is configured
```

日志中看到:
```
[AIProviderService] Using OpenAI from OPENAI_API_KEY
[DebateEngine] ✓ Response generated successfully
```

讨论页面能看到智能体发言实时出现。

## 🆘 还有问题?

1. 查看完整文档: [GitHub Wiki](https://github.com/jjj54788/consensuslab/wiki)
2. 搜索已知问题: [GitHub Issues](https://github.com/jjj54788/consensuslab/issues)
3. 创建新问题并附上:
   - 服务器日志 (`pm2 logs consensuslab`)
   - .env 文件配置 (隐藏真实的 API 密钥)
   - 错误截图
