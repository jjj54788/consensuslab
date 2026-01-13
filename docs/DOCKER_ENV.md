# Docker 环境变量配置说明

本文档说明在使用 Docker Compose 部署时需要配置的环境变量。

## 快速开始

1. 在项目根目录创建 `.env` 文件
2. 参考下面的配置模板填写实际值
3. 运行 `docker-compose up -d`

## 环境变量配置模板

```bash
# ===========================================
# 数据库配置 (必需)
# ===========================================
# MySQL连接字符串（使用Docker Compose时，主机名为mysql）
DATABASE_URL=mysql://debate_user:debate_password@mysql:3306/debate_system

# MySQL root密码
MYSQL_ROOT_PASSWORD=your_strong_root_password

# MySQL数据库配置
MYSQL_DATABASE=debate_system
MYSQL_USER=debate_user
MYSQL_PASSWORD=your_strong_user_password

# ===========================================
# JWT 配置 (必需)
# ===========================================
# JWT密钥，用于签名和验证token
# 生成方法: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-jwt-secret-key-here-please-change-this

# ===========================================
# AI API 配置 (必需)
# ===========================================
# Manus AI API配置（后端使用）
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-manus-api-key-here

# 前端AI API配置
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key-here

# ===========================================
# OAuth 配置 (可选)
# ===========================================
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id-here

# ===========================================
# 应用配置 (可选)
# ===========================================
VITE_APP_TITLE=多智能体讨论系统
VITE_APP_LOGO=/logo.svg

# ===========================================
# 所有者信息 (可选)
# ===========================================
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Your Name

# ===========================================
# 服务器配置
# ===========================================
PORT=3000
NODE_ENV=production
```

## 必需变量说明

### DATABASE_URL
MySQL数据库连接字符串。使用Docker Compose时，主机名应该是 `mysql`（服务名），而不是 `localhost`。

**格式**: `mysql://用户名:密码@主机:端口/数据库名`

**示例**: `mysql://debate_user:mypassword@mysql:3306/debate_system`

### MYSQL_ROOT_PASSWORD
MySQL root用户的密码。**务必修改为强密码**。

### MYSQL_DATABASE
要创建的数据库名称。默认为 `debate_system`。

### MYSQL_USER
应用程序使用的MySQL用户名。默认为 `debate_user`。

### MYSQL_PASSWORD
应用程序使用的MySQL用户密码。**务必修改为强密码**。

### JWT_SECRET
用于签名和验证JWT token的密钥。**务必修改为随机字符串**。

**生成方法**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### BUILT_IN_FORGE_API_KEY
Manus AI API密钥，用于调用AI服务。

**获取方法**: 访问 [Manus平台](https://manus.im) 获取API密钥。

### VITE_FRONTEND_FORGE_API_KEY
前端使用的Manus AI API密钥（如果前端需要直接调用AI服务）。

## 可选变量说明

### OAuth 配置
如果使用Manus OAuth进行用户认证，需要配置以下变量：
- `OAUTH_SERVER_URL`: OAuth服务器地址
- `VITE_OAUTH_PORTAL_URL`: OAuth登录门户地址
- `VITE_APP_ID`: 应用ID

### 应用配置
- `VITE_APP_TITLE`: 应用标题，显示在浏览器标签和页面顶部
- `VITE_APP_LOGO`: 应用Logo的URL路径

### 所有者信息
- `OWNER_OPEN_ID`: 所有者的OpenID
- `OWNER_NAME`: 所有者名称

### 分析配置
- `VITE_ANALYTICS_ENDPOINT`: 网站分析服务端点
- `VITE_ANALYTICS_WEBSITE_ID`: 网站分析ID

## 安全建议

1. **不要提交 `.env` 文件到Git仓库**
   - `.env` 文件已在 `.gitignore` 中排除
   - 只提交 `.env.example` 或文档说明

2. **使用强密码**
   - 数据库密码至少16位，包含大小写字母、数字和特殊字符
   - JWT密钥使用随机生成的32字节十六进制字符串

3. **定期轮换密钥**
   - 定期更新API密钥和JWT密钥
   - 更新后重启所有服务

4. **限制API密钥权限**
   - 为不同环境使用不同的API密钥
   - 生产环境使用受限权限的密钥

## 故障排查

### 数据库连接失败
- 检查 `DATABASE_URL` 中的主机名是否为 `mysql`（Docker服务名）
- 检查用户名和密码是否与 `MYSQL_USER` 和 `MYSQL_PASSWORD` 一致
- 确保MySQL容器已启动：`docker-compose ps`

### AI API调用失败
- 检查 `BUILT_IN_FORGE_API_KEY` 是否正确
- 检查API密钥是否有足够的配额
- 检查网络连接是否正常

### JWT验证失败
- 检查 `JWT_SECRET` 是否配置
- 确保所有服务使用相同的 `JWT_SECRET`
- 清除浏览器Cookie后重新登录
