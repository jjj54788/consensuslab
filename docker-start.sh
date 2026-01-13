#!/bin/bash

# 多智能体讨论系统 - Docker 快速启动脚本

set -e

echo "🚀 多智能体讨论系统 - Docker 快速启动"
echo "=========================================="

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "❌ 错误: 未找到 .env 文件"
    echo ""
    echo "请按以下步骤操作："
    echo "1. 复制环境变量模板："
    echo "   cp docs/DOCKER_ENV.md .env"
    echo "2. 编辑 .env 文件，填写必需的配置项"
    echo "3. 重新运行此脚本"
    echo ""
    echo "详细说明请查看: docs/DOCKER_ENV.md"
    exit 1
fi

echo "✅ 找到 .env 配置文件"

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未安装 Docker"
    echo "请访问 https://docs.docker.com/get-docker/ 安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: 未安装 Docker Compose"
    echo "请访问 https://docs.docker.com/compose/install/ 安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 和 Docker Compose 已安装"

# 停止并删除旧容器
echo ""
echo "📦 清理旧容器..."
docker-compose down 2>/dev/null || true

# 构建镜像
echo ""
echo "🔨 构建 Docker 镜像..."
docker-compose build

# 启动服务
echo ""
echo "🚀 启动服务..."
docker-compose up -d

# 等待 MySQL 就绪
echo ""
echo "⏳ 等待 MySQL 数据库就绪..."
sleep 10

# 检查服务状态
echo ""
echo "📊 服务状态："
docker-compose ps

# 执行数据库迁移
echo ""
echo "🗄️  执行数据库迁移..."
docker-compose exec app pnpm db:push

# 插入种子数据
echo ""
echo "🌱 插入智能体种子数据..."
docker-compose exec app tsx scripts/seed-agents.ts

echo ""
echo "=========================================="
echo "✨ 启动完成！"
echo ""
echo "📝 访问地址: http://localhost:3000"
echo ""
echo "常用命令："
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
echo "详细文档请查看: docs/DEPLOYMENT.md"
echo "=========================================="
