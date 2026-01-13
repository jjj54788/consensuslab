# 本地部署指南

本文档提供从零开始在本地环境构建和运行多智能体讨论系统的完整步骤。

## 目录

- [环境要求](#环境要求)
- [Docker 部署（推荐）](#docker-部署推荐)
- [快速开始](#快速开始)
- [详细步骤](#详细步骤)
- [环境变量配置](#环境变量配置)
- [数据库配置](#数据库配置)
- [启动项目](#启动项目)
- [验证部署](#验证部署)
- [常见问题](#常见问题)
- [故障排查](#故障排查)

## 环境要求

在开始之前，请确保您的系统满足以下要求：

### 必需软件

系统需要以下软件的支持才能正常运行。**Node.js** 是运行JavaScript服务器端代码的基础环境，版本要求18.0或更高以确保对最新语言特性的支持。**pnpm** 是高效的包管理工具，相比npm和yarn具有更快的安装速度和更少的磁盘占用。**MySQL** 或 **TiDB** 用于存储讨论数据，包括智能体信息、会话记录和消息内容，版本要求MySQL 8.0+或TiDB 6.0+以确保兼容性。**Git** 用于克隆项目代码仓库，是获取源码的必要工具。

| 软件 | 最低版本 | 推荐版本 | 用途 |
|------|---------|---------|------|
| Node.js | 18.0 | 22.x | JavaScript运行环境 |
| pnpm | 8.0 | 9.x | 包管理工具 |
| MySQL/TiDB | 8.0 / 6.0 | 8.4 / 8.0 | 数据库 |
| Git | 2.0 | 最新版 | 版本控制 |

### 可选软件

为了获得更好的开发体验，建议安装以下软件。**VS Code** 是功能强大的代码编辑器，内置TypeScript支持和丰富的扩展生态。**Postman** 或 **Insomnia** 可用于测试API接口，方便调试后端服务。**MySQL Workbench** 或 **DBeaver** 提供图形化的数据库管理界面，简化数据库操作和数据查看。

| 软件 | 用途 |
|------|------|
| VS Code | 代码编辑器（推荐安装ESLint、Prettier扩展） |
| Postman / Insomnia | API测试工具 |
| MySQL Workbench / DBeaver | 数据库管理工具 |

### 系统要求

系统的硬件配置直接影响运行性能和用户体验。**CPU** 方面，最低需要双核处理器，推荐使用四核或更高配置以确保多智能体并发讨论时的流畅性。**内存** 最低需要4GB，推荐8GB或更高，因为Node.js服务器、数据库和前端开发服务器会同时运行，占用较多内存。**存储空间** 最低需要2GB用于存储项目代码、依赖包和数据库文件，推荐5GB或更高以留有充足空间。**操作系统** 支持Windows 10/11、macOS 11+和Linux（Ubuntu 20.04+），项目在这些平台上都经过测试验证。

| 资源 | 最低要求 | 推荐配置 |
|------|---------|---------|
| CPU | 双核 | 四核或更高 |
| 内存 | 4GB | 8GB或更高 |
| 存储 | 2GB可用空间 | 5GB或更高 |
| 操作系统 | Windows 10/11, macOS 11+, Linux (Ubuntu 20.04+) | 最新稳定版 |

## Docker 部署（推荐）

使用 Docker Compose 是最简单、最快速的部署方式。它会自动配置所有服务（MySQL + 后端 + 前端），无需手动安装依赖和配置环境。

### 优势

- ✅ **一键启动**：无需手动安装 Node.js、pnpm、MySQL
- ✅ **环境隔离**：不会影响本地其他项目
- ✅ **跨平台**：在 Windows、macOS、Linux 上表现一致
- ✅ **易于管理**：简单的命令启动、停止、重启服务

### 前置要求

只需安装 Docker 和 Docker Compose：

- **Docker Desktop** (已包含 Docker Compose)
  - Windows/macOS: 下载 [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - Linux: 安装 [Docker Engine](https://docs.docker.com/engine/install/) + [Docker Compose](https://docs.docker.com/compose/install/)

### 快速启动

**1. 克隆仓库**

```bash
git clone https://github.com/jjj54788/multi-agent-debate.git
cd multi-agent-debate
```

**2. 配置环境变量**

创建 `.env` 文件，填写必需的配置项（详细说明见 [docs/DOCKER_ENV.md](./DOCKER_ENV.md)）：

```bash
# 最小化配置示例
DATABASE_URL=mysql://debate_user:your_password@mysql:3306/debate_system
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=debate_system
MYSQL_USER=debate_user
MYSQL_PASSWORD=your_password
JWT_SECRET=your-jwt-secret-key
BUILT_IN_FORGE_API_KEY=your-manus-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
```

> ⚠️ **安全提示**：请修改所有默认密码为强密码，特别是生产环境。

**3. 一键启动**

使用快捷脚本（推荐）：

```bash
chmod +x docker-start.sh
./docker-start.sh
```

或手动执行命令：

```bash
# 启动服务
docker-compose up -d

# 等待 MySQL 就绪（约10秒）
sleep 10

# 初始化数据库表结构
docker-compose exec app pnpm db:push

# 插入预设智能体数据
docker-compose exec app tsx scripts/seed-agents.ts
```

**4. 访问系统**

打开浏览器访问 `http://localhost:3000`

### 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 查看特定服务的日志
docker-compose logs -f app
docker-compose logs -f mysql

# 停止服务
docker-compose down

# 停止并删除数据卷（注意：会删除所有数据）
docker-compose down -v

# 重启服务
docker-compose restart

# 重新构建并启动
docker-compose up -d --build

# 进入应用容器
docker-compose exec app sh

# 进入 MySQL 容器
docker-compose exec mysql mysql -u debate_user -p debate_system
```

### 故障排查

**服务启动失败**

```bash
# 查看详细错误信息
docker-compose logs app
docker-compose logs mysql

# 检查环境变量是否正确
docker-compose config
```

**数据库连接失败**

1. 确保 MySQL 容器已启动：`docker-compose ps`
2. 检查 `DATABASE_URL` 中的主机名是否为 `mysql`（不是 `localhost`）
3. 检查用户名和密码是否与 `.env` 中的 `MYSQL_USER` 和 `MYSQL_PASSWORD` 一致

**端口被占用**

如果 3306 或 3000 端口已被占用，修改 `docker-compose.yml` 中的端口映射：

```yaml
services:
  mysql:
    ports:
      - "3307:3306"  # 使用 3307 而不是 3306
  app:
    ports:
      - "3001:3000"  # 使用 3001 而不是 3000
```

**重置环境**

如果需要完全重置：

```bash
# 停止并删除所有容器和数据
docker-compose down -v

# 删除构建缓存
docker-compose build --no-cache

# 重新启动
./docker-start.sh
```

---

## 快速开始

对于熟悉开发环境的用户，可以按照以下简化步骤快速启动项目。这些步骤假设您已经安装了所有必需软件，并对命令行操作有基本了解。

```bash
# 1. 克隆项目
git clone https://github.com/jjj54788/multi-agent-debate.git
cd multi-agent-debate

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写数据库连接信息和AI API密钥

# 4. 初始化数据库
pnpm db:push

# 5. 启动开发服务器
pnpm dev

# 6. 访问应用
# 打开浏览器访问 http://localhost:3000
```

如果您是第一次部署，或者在快速开始过程中遇到问题，请继续阅读下面的详细步骤。

## 详细步骤

### 步骤1：安装Node.js和pnpm

Node.js是项目运行的基础环境，pnpm是高效的包管理工具。正确安装这两个工具是后续步骤的前提。

**安装Node.js**

访问Node.js官网下载并安装适合您操作系统的版本。对于Windows用户，下载.msi安装包并按照向导完成安装。对于macOS用户，可以使用Homebrew安装（`brew install node`）或下载.pkg安装包。对于Linux用户，推荐使用nvm（Node Version Manager）安装，这样可以方便地管理多个Node.js版本。

```bash
# 验证Node.js安装
node --version  # 应该显示 v18.0.0 或更高版本
npm --version   # 应该显示 9.0.0 或更高版本
```

**安装pnpm**

pnpm可以通过npm全局安装，也可以使用独立安装脚本。推荐使用npm安装，因为这种方式最简单且兼容性最好。

```bash
# 使用npm安装pnpm
npm install -g pnpm

# 验证pnpm安装
pnpm --version  # 应该显示 8.0.0 或更高版本
```

如果您的网络环境访问npm官方源较慢，可以配置国内镜像源加速下载。

```bash
# 配置pnpm使用淘宝镜像（可选）
pnpm config set registry https://registry.npmmirror.com
```

### 步骤2：安装数据库

项目支持MySQL和TiDB两种数据库，您可以根据自己的需求选择其中一种。MySQL是最常用的开源关系型数据库，TiDB是兼容MySQL协议的分布式数据库，适合需要高可用和水平扩展的场景。

**选项A：安装MySQL**

对于Windows用户，访问MySQL官网下载MySQL Installer，选择"Developer Default"安装类型，按照向导完成安装。安装过程中会要求设置root用户密码，请妥善保管。对于macOS用户，可以使用Homebrew安装（`brew install mysql`），安装后使用`mysql_secure_installation`命令进行安全配置。对于Linux用户，使用包管理器安装（如Ubuntu上的`sudo apt install mysql-server`），安装后同样需要运行安全配置脚本。

```bash
# macOS使用Homebrew安装
brew install mysql
brew services start mysql

# Ubuntu/Debian安装
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql

# 验证MySQL安装
mysql --version  # 应该显示 8.0.0 或更高版本
```

**选项B：使用Docker运行MySQL**

如果您不想在本地安装MySQL，可以使用Docker快速启动一个MySQL容器。这种方式的优点是环境隔离、易于清理，缺点是需要额外安装Docker。

```bash
# 拉取MySQL镜像并启动容器
docker run --name multi-agent-debate-db \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -e MYSQL_DATABASE=multi_agent_debate \
  -p 3306:3306 \
  -d mysql:8.4

# 验证容器运行状态
docker ps | grep multi-agent-debate-db
```

**创建数据库**

无论使用哪种方式安装MySQL，都需要创建一个专用数据库来存储项目数据。

```bash
# 连接到MySQL
mysql -u root -p

# 在MySQL命令行中执行
CREATE DATABASE multi_agent_debate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'debate_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON multi_agent_debate.* TO 'debate_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

上述命令创建了一个名为`multi_agent_debate`的数据库，使用utf8mb4字符集以支持emoji等特殊字符。同时创建了一个专用用户`debate_user`并授予该数据库的所有权限，这是生产环境的最佳实践。

### 步骤3：克隆项目代码

使用Git从GitHub克隆项目代码到本地。建议在一个易于访问的目录下克隆，如用户主目录或专门的项目目录。

```bash
# 克隆项目
git clone https://github.com/jjj54788/multi-agent-debate.git

# 进入项目目录
cd multi-agent-debate

# 查看项目结构
ls -la
```

克隆完成后，您会看到项目的完整目录结构，包括客户端代码（client目录）、服务器代码（server目录）、数据库模型（drizzle目录）和配置文件。

### 步骤4：安装项目依赖

项目使用pnpm管理依赖包，包括前端和后端的所有第三方库。依赖安装可能需要几分钟时间，具体取决于网络速度。

```bash
# 安装所有依赖
pnpm install
```

pnpm会根据`package.json`和`pnpm-lock.yaml`文件安装所有依赖包。安装过程中会显示进度信息，完成后会显示安装的包数量和总大小。如果安装过程中出现错误，请检查网络连接和Node.js版本。

**常见依赖安装问题**

如果遇到依赖安装失败，可以尝试以下解决方法：

```bash
# 清理缓存并重新安装
pnpm store prune
rm -rf node_modules
pnpm install

# 如果仍然失败，尝试使用npm
npm install
```

### 步骤5：配置环境变量

环境变量用于配置数据库连接、AI API密钥和其他敏感信息。项目提供了`.env.example`模板文件，您需要复制并修改它。

```bash
# 复制环境变量模板
cp .env.example .env
```

使用文本编辑器打开`.env`文件，根据您的实际情况修改以下配置：

```env
# 数据库配置
DATABASE_URL="mysql://debate_user:your_secure_password@localhost:3306/multi_agent_debate"

# JWT密钥（用于会话管理，请生成一个随机字符串）
JWT_SECRET="your_random_jwt_secret_here"

# Manus AI配置（如果使用Manus平台）
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="your_manus_api_key"

# OpenAI配置（可选，如果使用OpenAI API）
OPENAI_API_KEY="your_openai_api_key"

# Anthropic配置（可选，如果使用Claude API）
ANTHROPIC_API_KEY="your_anthropic_api_key"

# OAuth配置（如果使用Manus OAuth）
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"
VITE_APP_ID="your_app_id"

# 应用配置
VITE_APP_TITLE="多智能体讨论系统"
VITE_APP_LOGO="/logo.svg"
```

**配置说明**

**DATABASE_URL** 是数据库连接字符串，格式为`mysql://用户名:密码@主机:端口/数据库名`。如果使用Docker运行MySQL，主机通常是`localhost`，端口是`3306`。如果使用远程数据库，需要替换为实际的主机地址。

**JWT_SECRET** 用于签名会话令牌，确保用户身份的安全性。请使用随机生成的长字符串，不要使用简单的密码。可以使用在线工具或命令行生成：

```bash
# 生成随机JWT密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**AI API密钥** 是调用AI服务的凭证。系统支持多种AI提供商，您至少需要配置其中一种。如果使用Manus内置AI，需要在Manus平台获取API密钥。如果使用OpenAI，需要在OpenAI官网注册并获取API密钥。如果使用Anthropic Claude，需要在Anthropic官网申请访问权限并获取API密钥。

**OAuth配置** 用于用户身份认证。如果您不需要用户登录功能，可以暂时跳过这部分配置。如果需要，请在Manus平台创建OAuth应用并获取APP_ID。

### 步骤6：初始化数据库

项目使用Drizzle ORM管理数据库模型，使用`db:push`命令可以自动创建所有必需的表结构。

```bash
# 推送数据库模型到数据库
pnpm db:push
```

该命令会读取`drizzle/schema.ts`中定义的数据库模型，并在数据库中创建对应的表。执行成功后，您会看到类似以下的输出：

```
✓ Pushing schema changes to database
✓ Created table: agents
✓ Created table: debate_sessions
✓ Created table: messages
✓ Database schema is up to date
```

**验证数据库初始化**

您可以使用MySQL客户端或数据库管理工具验证表是否创建成功：

```bash
# 连接到数据库
mysql -u debate_user -p multi_agent_debate

# 查看所有表
SHOW TABLES;

# 查看agents表结构
DESCRIBE agents;
```

您应该看到三个主要表：`agents`（智能体）、`debate_sessions`（讨论会话）和`messages`（消息）。

**初始化预设智能体**

数据库创建后，需要插入预设的智能体数据。项目提供了初始化脚本：

```bash
# 运行初始化脚本
pnpm db:seed
```

如果项目没有提供seed脚本，您可以手动执行SQL插入预设智能体：

```sql
-- 插入预设智能体
INSERT INTO agents (id, name, role, description, systemPrompt, aiProvider) VALUES
('supporter', '支持者', 'supporter', '积极支持者，提供正面观点', '你是一个积极的支持者，善于发现事物的优点和可行性...', 'openai'),
('opponent', '反对者', 'opponent', '质疑者，提出反对意见', '你是一个理性的反对者，善于发现问题和风险...', 'openai'),
('neutral', '中立者', 'neutral', '客观分析者，平衡观点', '你是一个中立的分析者，客观评估各方观点...', 'openai'),
('critic', '批判者', 'critic', '逻辑分析师，严格审查论证', '你是一个严谨的批判者，专注于逻辑严密性...', 'openai'),
('innovator', '创新者', 'innovator', '创意问题解决者', '你是一个富有创造力的创新者，善于提出新颖的想法...', 'openai');
```

### 步骤7：启动开发服务器

所有配置完成后，可以启动开发服务器。项目使用Vite作为前端开发服务器，Express作为后端服务器。

```bash
# 启动开发服务器（前端+后端）
pnpm dev
```

该命令会同时启动前端和后端服务。启动成功后，您会看到类似以下的输出：

```
> multi-agent-debate@1.0.0 dev
> concurrently "pnpm dev:server" "pnpm dev:client"

[server] Server running on http://localhost:3000/
[server] [OAuth] Initialized with baseURL: https://api.manus.im
[client] VITE v5.0.0  ready in 1234 ms
[client] ➜  Local:   http://localhost:5173/
[client] ➜  Network: use --host to expose
```

**端口说明**

默认情况下，后端服务器运行在3000端口，前端开发服务器运行在5173端口。前端会通过代理将API请求转发到后端。如果这些端口已被占用，您可以在`.env`文件中修改：

```env
PORT=3000  # 后端端口
VITE_PORT=5173  # 前端端口
```

**分别启动前后端**

如果您需要分别启动前端和后端（例如用于调试），可以使用以下命令：

```bash
# 仅启动后端
pnpm dev:server

# 在另一个终端窗口启动前端
pnpm dev:client
```

## 环境变量配置

环境变量是配置项目运行参数的关键机制。完整的环境变量配置确保系统各模块正常工作。

### 必需环境变量

以下环境变量是系统运行的必要配置，缺少任何一个都会导致系统无法正常启动或功能受限。

| 变量名 | 说明 | 示例值 | 必需性 |
|--------|------|--------|--------|
| `DATABASE_URL` | 数据库连接字符串 | `mysql://user:pass@localhost:3306/db` | 必需 |
| `JWT_SECRET` | JWT签名密钥 | `your_random_secret_32_chars_long` | 必需 |
| `BUILT_IN_FORGE_API_KEY` | Manus AI API密钥 | `manus_xxxxxxxxxxxxx` | 至少配置一种AI |
| `OPENAI_API_KEY` | OpenAI API密钥 | `sk-xxxxxxxxxxxxx` | 至少配置一种AI |

### 可选环境变量

以下环境变量用于启用特定功能或优化用户体验，可以根据实际需求选择性配置。

| 变量名 | 说明 | 默认值 | 用途 |
|--------|------|--------|------|
| `PORT` | 后端服务器端口 | `3000` | 自定义端口 |
| `VITE_PORT` | 前端开发服务器端口 | `5173` | 自定义端口 |
| `VITE_APP_TITLE` | 应用标题 | `多智能体讨论系统` | 自定义品牌 |
| `VITE_APP_LOGO` | 应用Logo路径 | `/logo.svg` | 自定义品牌 |
| `OAUTH_SERVER_URL` | OAuth服务器地址 | - | 启用用户登录 |
| `VITE_APP_ID` | OAuth应用ID | - | 启用用户登录 |

### AI API配置详解

系统支持多种AI提供商，您可以根据需求和预算选择合适的服务。

**Manus AI（推荐）**

Manus AI是系统内置的AI服务，提供稳定的API和合理的定价。配置方法：

```env
BUILT_IN_FORGE_API_URL="https://api.manus.im"
BUILT_IN_FORGE_API_KEY="your_manus_api_key"
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im"
VITE_FRONTEND_FORGE_API_KEY="your_frontend_api_key"
```

在Manus平台注册账号后，在"API密钥"页面生成新的密钥。注意区分后端密钥（`BUILT_IN_FORGE_API_KEY`）和前端密钥（`VITE_FRONTEND_FORGE_API_KEY`），后者权限受限，仅用于前端直接调用。

**OpenAI**

OpenAI提供GPT系列模型，包括GPT-4和GPT-3.5-turbo。配置方法：

```env
OPENAI_API_KEY="sk-xxxxxxxxxxxxx"
OPENAI_API_BASE="https://api.openai.com/v1"  # 可选，自定义API地址
```

在OpenAI官网注册并创建API密钥。注意OpenAI API有使用配额限制，超出配额会产生费用。

**Anthropic Claude**

Anthropic提供Claude系列模型，以安全性和长上下文著称。配置方法：

```env
ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxxx"
```

在Anthropic官网申请API访问权限并获取密钥。Claude API目前需要申请才能使用。

## 数据库配置

数据库是系统的核心组件，存储所有讨论数据和智能体信息。正确配置数据库确保数据的持久化和系统的稳定性。

### 连接字符串格式

数据库连接字符串遵循标准URI格式，包含认证信息、主机地址、端口和数据库名。

```
mysql://[用户名]:[密码]@[主机]:[端口]/[数据库名]?[参数]
```

**示例**

```env
# 本地MySQL
DATABASE_URL="mysql://root:password@localhost:3306/multi_agent_debate"

# 远程MySQL
DATABASE_URL="mysql://user:pass@db.example.com:3306/debate"

# MySQL with SSL
DATABASE_URL="mysql://user:pass@db.example.com:3306/debate?ssl=true"

# TiDB Cloud
DATABASE_URL="mysql://user:pass@gateway.tidbcloud.com:4000/debate?ssl=true"
```

### 数据库参数

连接字符串可以包含额外参数来优化性能和安全性。

| 参数 | 说明 | 示例 |
|------|------|------|
| `ssl` | 启用SSL加密连接 | `?ssl=true` |
| `charset` | 字符集 | `?charset=utf8mb4` |
| `timezone` | 时区 | `?timezone=+08:00` |
| `connectionLimit` | 连接池大小 | `?connectionLimit=10` |

### 数据库迁移

项目使用Drizzle ORM管理数据库模型和迁移。常用命令：

```bash
# 推送模型到数据库（开发环境）
pnpm db:push

# 生成迁移文件（生产环境）
pnpm db:generate

# 执行迁移
pnpm db:migrate

# 查看数据库状态
pnpm db:studio
```

**开发环境 vs 生产环境**

开发环境推荐使用`db:push`命令，它会直接同步模型到数据库，快速且方便。生产环境推荐使用`db:generate`和`db:migrate`命令，生成迁移文件并执行，确保数据库变更的可追溯性和可回滚性。

### 数据库备份

定期备份数据库是生产环境的最佳实践。

```bash
# 备份数据库
mysqldump -u debate_user -p multi_agent_debate > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u debate_user -p multi_agent_debate < backup_20260112.sql
```

## 启动项目

完成所有配置后，您可以启动项目并开始使用。

### 开发模式

开发模式启用热重载功能，代码修改后自动刷新，方便开发和调试。

```bash
# 启动开发服务器
pnpm dev
```

访问 http://localhost:5173 查看前端界面。前端会自动代理API请求到后端（http://localhost:3000）。

### 生产模式

生产模式会构建优化后的代码，提供更好的性能和更小的体积。

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

生产模式下，前端和后端都运行在3000端口，访问 http://localhost:3000 即可。

### 使用PM2管理进程

PM2是Node.js进程管理工具，提供自动重启、日志管理和监控功能，适合生产环境。

```bash
# 安装PM2
npm install -g pm2

# 使用PM2启动
pm2 start pnpm --name "multi-agent-debate" -- start

# 查看进程状态
pm2 status

# 查看日志
pm2 logs multi-agent-debate

# 重启进程
pm2 restart multi-agent-debate

# 停止进程
pm2 stop multi-agent-debate
```

## 验证部署

部署完成后，需要验证各项功能是否正常工作。

### 基本功能检查

**1. 访问主页**

打开浏览器访问 http://localhost:5173（开发模式）或 http://localhost:3000（生产模式），您应该看到系统主页，包括"开始新讨论"、"查看历史讨论"等按钮。

**2. 创建讨论**

点击"开始新讨论"按钮，输入讨论话题（如"远程工作的未来"），选择至少2个智能体（如支持者和反对者），设置轮数（如3轮），点击"开始讨论"。

**3. 观看讨论**

讨论开始后，您应该看到：
- 左侧讨论记录实时显示智能体的发言
- 右侧时间线视图按轮次展示讨论进程
- 顶部智能体卡片显示当前状态（思考中、发言中、空闲）
- 每条消息显示评分信息（逻辑分、创新分、表达分、总分）

**4. 查看总结**

讨论完成后，系统自动显示：
- 讨论亮点（最佳观点、最创新观点、精彩金句）
- 完整总结
- 关键观点
- 分歧点

### 数据库检查

验证数据是否正确存储到数据库。

```bash
# 连接到数据库
mysql -u debate_user -p multi_agent_debate

# 查看智能体数据
SELECT id, name, role FROM agents;

# 查看讨论会话
SELECT id, topic, status, createdAt FROM debate_sessions ORDER BY createdAt DESC LIMIT 5;

# 查看消息数据
SELECT id, sessionId, senderId, round, totalScore FROM messages ORDER BY createdAt DESC LIMIT 10;
```

### API测试

使用curl或Postman测试API接口。

```bash
# 测试健康检查接口
curl http://localhost:3000/health

# 测试获取智能体列表
curl http://localhost:3000/api/trpc/agents.list

# 测试创建讨论会话
curl -X POST http://localhost:3000/api/trpc/debates.create \
  -H "Content-Type: application/json" \
  -d '{"topic":"测试话题","agentIds":["supporter","opponent"],"totalRounds":3}'
```

### WebSocket测试

验证WebSocket连接是否正常。打开浏览器开发者工具（F12），切换到"网络"标签，筛选"WS"类型，您应该看到一个到`ws://localhost:3000/socket.io/`的WebSocket连接，状态为"101 Switching Protocols"。

## 常见问题

### Q1: 依赖安装失败

**问题**：运行`pnpm install`时出现错误，如网络超时、权限错误等。

**解决方法**：

```bash
# 方法1：清理缓存并重试
pnpm store prune
rm -rf node_modules
pnpm install

# 方法2：使用国内镜像
pnpm config set registry https://registry.npmmirror.com
pnpm install

# 方法3：使用npm代替pnpm
npm install
```

### Q2: 数据库连接失败

**问题**：启动服务器时出现"Error: connect ECONNREFUSED"或"Access denied for user"错误。

**解决方法**：

1. 检查MySQL服务是否运行：
```bash
# macOS
brew services list | grep mysql

# Linux
sudo systemctl status mysql

# Windows
services.msc  # 查看MySQL服务状态
```

2. 验证数据库连接信息：
```bash
# 使用.env中的凭证测试连接
mysql -u debate_user -p multi_agent_debate
```

3. 检查防火墙设置，确保3306端口未被阻止

4. 验证DATABASE_URL格式是否正确

### Q3: AI API调用失败

**问题**：讨论开始后智能体无法生成回复，控制台显示"LLM invoke failed"错误。

**解决方法**：

1. 验证API密钥是否正确配置：
```bash
# 检查.env文件
cat .env | grep API_KEY
```

2. 测试API密钥是否有效：
```bash
# 测试OpenAI API
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

3. 检查API配额是否用尽

4. 确认网络可以访问AI服务（某些地区可能需要代理）

### Q4: 端口已被占用

**问题**：启动服务器时出现"Error: listen EADDRINUSE: address already in use :::3000"错误。

**解决方法**：

```bash
# 方法1：查找并终止占用端口的进程
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# 方法2：修改端口
# 在.env文件中修改PORT变量
PORT=3001
```

### Q5: 前端无法连接后端

**问题**：前端页面显示"网络错误"或API请求失败。

**解决方法**：

1. 确认后端服务器正在运行：
```bash
curl http://localhost:3000/health
```

2. 检查Vite代理配置（`vite.config.ts`）：
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
}
```

3. 检查浏览器控制台的网络请求，确认请求地址正确

### Q6: WebSocket连接失败

**问题**：讨论房间页面显示"未连接"或"正在连接"状态。

**解决方法**：

1. 检查后端WebSocket服务是否启动：
```bash
# 查看服务器日志
pnpm dev:server
# 应该看到 "[WebSocket] Server initialized"
```

2. 验证Socket.IO路径配置：
```typescript
// 客户端
const socket = io('http://localhost:3000', {
  path: '/socket.io/'
});
```

3. 检查防火墙或代理是否阻止WebSocket连接

4. 尝试在浏览器开发者工具中手动测试WebSocket连接

## 故障排查

### 日志查看

日志是排查问题的重要工具，记录了系统运行的详细信息。

**开发模式日志**

开发模式下，日志直接输出到终端：

```bash
# 启动开发服务器并查看日志
pnpm dev

# 过滤特定关键词
pnpm dev | grep "Error"
```

**生产模式日志**

生产模式使用PM2管理进程，日志存储在文件中：

```bash
# 查看实时日志
pm2 logs multi-agent-debate

# 查看错误日志
pm2 logs multi-agent-debate --err

# 查看日志文件
cat ~/.pm2/logs/multi-agent-debate-out.log
cat ~/.pm2/logs/multi-agent-debate-error.log
```

### 数据库调试

数据库问题通常表现为数据无法保存或查询失败。

```bash
# 启用MySQL查询日志
# 编辑MySQL配置文件（my.cnf或my.ini）
[mysqld]
general_log = 1
general_log_file = /var/log/mysql/query.log

# 重启MySQL
sudo systemctl restart mysql

# 查看查询日志
tail -f /var/log/mysql/query.log
```

**使用Drizzle Studio调试**

Drizzle Studio提供图形化界面查看和编辑数据库：

```bash
# 启动Drizzle Studio
pnpm db:studio

# 访问 https://local.drizzle.studio
```

### 性能分析

如果系统响应缓慢，可以使用性能分析工具定位瓶颈。

**Node.js性能分析**

```bash
# 使用--inspect启动服务器
node --inspect server/index.js

# 在Chrome中访问 chrome://inspect
# 点击"Open dedicated DevTools for Node"
```

**数据库性能分析**

```sql
-- 查看慢查询
SHOW VARIABLES LIKE 'slow_query%';
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- 分析查询执行计划
EXPLAIN SELECT * FROM messages WHERE sessionId = 'xxx';

-- 查看索引使用情况
SHOW INDEX FROM messages;
```

### 重置环境

如果问题无法解决，可以尝试重置整个环境。

```bash
# 1. 停止所有服务
pm2 stop all

# 2. 清理依赖和缓存
rm -rf node_modules
rm -rf .next
rm -rf dist
pnpm store prune

# 3. 重置数据库
mysql -u root -p -e "DROP DATABASE IF EXISTS multi_agent_debate;"
mysql -u root -p -e "CREATE DATABASE multi_agent_debate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 4. 重新安装和初始化
pnpm install
pnpm db:push
pnpm db:seed

# 5. 重新启动
pnpm dev
```

## 下一步

部署完成后，您可以：

1. **阅读使用文档**：查看[Demo使用指南](./DEMO.md)了解系统的详细功能和使用场景

2. **阅读架构文档**：查看[系统架构文档](./ARCHITECTURE.md)了解系统的设计理念和技术细节

3. **自定义智能体**：在数据库中添加自定义智能体，定制讨论风格和专业领域

4. **部署到生产环境**：使用Docker、云服务器或Serverless平台部署系统

5. **贡献代码**：访问[GitHub仓库](https://github.com/jjj54788/multi-agent-debate)提交Issue或Pull Request

## 获取帮助

如果您在部署过程中遇到问题，可以通过以下方式获取帮助：

- **GitHub Issues**：https://github.com/jjj54788/multi-agent-debate/issues
- **文档**：查看项目docs目录下的其他文档
- **社区讨论**：在GitHub Discussions中提问和交流

---

**文档版本**: 1.0  
**最后更新**: 2026-01-12  
**作者**: Manus AI
