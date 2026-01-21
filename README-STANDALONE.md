# 多智能体讨论系统 - Standalone版本

> 独立部署版本，无需Manus平台依赖，支持OpenAI和Claude API

## 🎯 Standalone版本特点

这是多智能体讨论系统的**独立部署版本**，与Manus平台版本的主要区别：

### ✅ 已实现的功能

- ✅ **简化认证**：单用户管理员模式（用户名/密码登录）
- ✅ **直接API调用**：支持OpenAI和Claude API直接调用
- ✅ **用户API密钥管理**：在AI设置页面配置自己的API密钥
- ✅ **完整的讨论功能**：多智能体协同、实时讨论、评分系统
- ✅ **数据库持久化**：所有数据存储在MySQL/TiDB中

### ❌ 已移除的功能

- ❌ Manus OAuth认证（使用简单的用户名/密码登录）
- ❌ Manus LLM服务（需要配置自己的OpenAI/Claude API密钥）
- ❌ Manus存储服务（核心功能不需要文件存储）
- ❌ 图片生成功能（可选功能，需要自行实现）
- ❌ 语音转录功能（可选功能，需要自行实现）
- ❌ Google Maps集成（可选功能，需要自行实现）

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **MySQL** >= 8.0 或 **TiDB**

### 安装步骤

**1. 克隆仓库**

```bash
git clone https://github.com/jjj54788/multi-agent-debate.git
cd multi-agent-debate
git checkout standalone  # 切换到standalone分支
```

**2. 安装依赖**

```bash
pnpm install
```

**3. 配置环境变量**

创建 `.env` 文件：

```env
# 数据库配置
DATABASE_URL="mysql://user:password@localhost:3306/debate_system"

# JWT 密钥（用于session加密）
JWT_SECRET="your-jwt-secret-key-change-this-in-production"

# API密钥加密密钥（用于加密存储用户的API密钥）
API_KEY_ENCRYPTION_SECRET="your-encryption-secret-change-this-in-production"

# 管理员账号（可选，默认为admin/admin123）
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
ADMIN_EMAIL="admin@consensuslab.local"
```

> NOTE: **Local authentication** now persists the admin credentials in your MySQL instance.  
> Running the latest migrations adds a `passwordHash` column to the `users` table and the server will automatically insert/update the default admin row (hashed with the password above) when it boots.  
> To rotate the admin password (or add more local accounts) update the corresponding records directly in MySQL and store `bcrypt` hashes in `users.passwordHash`.

**4. 初始化数据库**

```bash
# 创建数据库表
pnpm db:push

# 初始化预设智能体和模型数据
pnpm exec tsx server/seed-agents.ts
pnpm exec tsx server/seed-models.ts
```

**5. 启动开发服务器**

```bash
pnpm dev
```

访问 `http://localhost:3000` 即可使用系统。

**6. 登录系统**

使用默认管理员账号登录：
- 用户名：`admin`
- 密码：`admin123`

**⚠️ 重要：首次部署后请立即修改管理员密码！**

## 🔑 配置API密钥

系统支持多个AI提供商，您需要在使用前配置API密钥。

### 配置步骤

1. 登录系统后，点击右上角的"AI设置"
2. 选择AI提供商（OpenAI或Claude）
3. 填写API密钥和其他配置
4. 点击"保存"并设为活跃

### 支持的AI提供商

#### OpenAI

- **获取API密钥**：https://platform.openai.com/api-keys
- **默认模型**：gpt-4o-mini
- **自定义Base URL**：支持（用于OpenAI兼容的API）

配置示例：
```
提供商：OpenAI
API密钥：sk-...
Base URL：https://api.openai.com/v1（默认）
模型：gpt-4o-mini
```

#### Anthropic Claude

- **获取API密钥**：https://console.anthropic.com/
- **默认模型**：claude-3-5-sonnet-20241022
- **自定义Base URL**：支持

配置示例：
```
提供商：Anthropic
API密钥：sk-ant-...
Base URL：https://api.anthropic.com/v1（默认）
模型：claude-3-5-sonnet-20241022
```

#### 自定义API

支持任何OpenAI兼容的API服务：

```
提供商：Custom
API密钥：your-api-key
Base URL：https://your-api-endpoint.com/v1
模型：your-model-name
```

### API密钥安全

- ✅ 所有API密钥都经过加密存储在数据库中
- ✅ 使用AES-256-GCM加密算法
- ✅ 加密密钥由环境变量`API_KEY_ENCRYPTION_SECRET`控制
- ⚠️ 请妥善保管`API_KEY_ENCRYPTION_SECRET`，丢失将无法解密已存储的API密钥

## 🐳 Docker部署

### 使用Docker Compose（推荐）

**1. 创建 `docker-compose.yml`**

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your_root_password
      MYSQL_DATABASE: debate_system
      MYSQL_USER: debate_user
      MYSQL_PASSWORD: your_password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://debate_user:your_password@mysql:3306/debate_system
      JWT_SECRET: your-jwt-secret-key
      API_KEY_ENCRYPTION_SECRET: your-encryption-secret
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: admin123
      NODE_ENV: production
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

volumes:
  mysql_data:
```

**2. 启动服务**

```bash
docker-compose up -d
```

**3. 初始化数据库**

```bash
docker-compose exec app pnpm db:push
docker-compose exec app pnpm exec tsx server/seed-agents.ts
docker-compose exec app pnpm exec tsx server/seed-models.ts
```

**4. 访问系统**

打开浏览器访问 `http://localhost:3000`

### 使用Docker单独部署

```bash
# 构建镜像
docker build -t multi-agent-debate-standalone .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="mysql://user:password@host:3306/debate_system" \
  -e JWT_SECRET="your-jwt-secret" \
  -e API_KEY_ENCRYPTION_SECRET="your-encryption-secret" \
  -e ADMIN_USERNAME="admin" \
  -e ADMIN_PASSWORD="admin123" \
  --name debate-system \
  multi-agent-debate-standalone
```

## 📊 数据库管理

### 备份数据库

```bash
# 导出数据
mysqldump -u debate_user -p debate_system > backup.sql

# 使用Docker导出
docker-compose exec mysql mysqldump -u debate_user -p debate_system > backup.sql
```

### 恢复数据库

```bash
# 导入数据
mysql -u debate_user -p debate_system < backup.sql

# 使用Docker导入
docker-compose exec -T mysql mysql -u debate_user -p debate_system < backup.sql
```

### 重置数据库

```bash
# 删除所有表
pnpm db:drop

# 重新创建表
pnpm db:push

# 重新初始化数据
pnpm exec tsx server/seed-agents.ts
pnpm exec tsx server/seed-models.ts
```

## 🔧 高级配置

### 自定义管理员账号

在 `.env` 文件中设置：

```env
ADMIN_USERNAME="your_username"
ADMIN_PASSWORD="your_secure_password"
ADMIN_EMAIL="your_email@example.com"
```

### 修改JWT过期时间

编辑 `server/_core/auth-standalone.ts`：

```typescript
export function generateToken(user: User): string {
  return jwt.sign(
    { /* ... */ },
    ENV.cookieSecret,
    { expiresIn: "30d" }  // 修改这里，例如："7d", "24h"
  );
}
```

### 添加新的AI提供商

1. 在数据库中添加新的模型提供商：

```sql
INSERT INTO model_providers (id, name, provider_type, base_url, description)
VALUES (
  'custom-provider',
  '自定义提供商',
  'custom',
  'https://your-api.com/v1',
  '描述'
);
```

2. 添加支持的模型：

```sql
INSERT INTO models (id, provider_id, model_id, name, description)
VALUES (
  'custom-model',
  'custom-provider',
  'your-model-name',
  '模型名称',
  '模型描述'
);
```

## 🐛 故障排查

### 问题：无法连接数据库

**检查项：**
1. 确认MySQL服务正在运行
2. 检查`DATABASE_URL`配置是否正确
3. 确认数据库用户有足够的权限
4. 检查防火墙设置

**解决方案：**
```bash
# 测试数据库连接
mysql -h localhost -u debate_user -p debate_system

# 检查MySQL状态
systemctl status mysql
```

### 问题：API密钥解密失败

**原因：**
`API_KEY_ENCRYPTION_SECRET`发生变化

**解决方案：**
1. 恢复原来的`API_KEY_ENCRYPTION_SECRET`
2. 或者删除所有已保存的API密钥，重新配置

```sql
-- 删除所有API密钥配置
DELETE FROM ai_provider_configs;
```

### 问题：讨论无法启动

**检查项：**
1. 确认已配置并激活AI提供商
2. 检查API密钥是否有效
3. 查看服务器日志中的错误信息

**解决方案：**
```bash
# 查看服务器日志
pnpm dev

# 或使用Docker查看日志
docker-compose logs -f app
```

### 问题：登录失败

**检查项：**
1. 确认用户名和密码正确
2. 检查JWT_SECRET是否配置
3. 清除浏览器Cookie

**解决方案：**
```bash
# 重置管理员密码
# 修改 .env 文件中的 ADMIN_PASSWORD
# 然后重启服务
pnpm dev
```

## 📚 开发指南

### 项目结构

```
multi-agent-debate/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── pages/         # 页面组件
│   │   ├── components/    # UI组件
│   │   └── lib/           # 工具库
├── server/                # 后端代码
│   ├── _core/             # 核心功能
│   │   ├── auth-standalone.ts  # Standalone认证
│   │   ├── env.ts              # 环境变量
│   │   └── ...
│   ├── aiProviders.ts     # AI提供商服务
│   ├── debateEngine.ts    # 讨论引擎
│   ├── scoringEngine.ts   # 评分引擎
│   ├── db.ts              # 数据库操作
│   └── routers.ts         # tRPC路由
├── drizzle/               # 数据库schema
│   └── schema.ts
└── shared/                # 共享代码
```

### 添加新功能

1. **后端API**：在`server/routers.ts`中添加新的tRPC procedure
2. **前端页面**：在`client/src/pages/`中创建新页面
3. **数据库表**：在`drizzle/schema.ts`中定义新表
4. **路由**：在`client/src/App.tsx`中注册新路由

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test auth.logout.test.ts
```

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -am 'Add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交Pull Request

### 代码规范

- 使用TypeScript
- 遵循ESLint规则
- 添加适当的注释
- 编写测试用例

## 📄 许可证

MIT License

## 🔗 相关链接

- **主项目仓库**：https://github.com/jjj54788/multi-agent-debate
- **Manus平台版本**：查看`main`分支
- **问题反馈**：https://github.com/jjj54788/multi-agent-debate/issues

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- GitHub Issues：https://github.com/jjj54788/multi-agent-debate/issues
- Email：your-email@example.com

---

**注意**：Standalone版本是为了方便独立部署而创建的，如果您希望使用完整的Manus平台功能（包括内置LLM服务、存储服务等），请使用主分支版本。
