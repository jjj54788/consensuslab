#!/bin/bash

# ConsensusLab Standalone Version Deployment Script
# This script pulls latest code, builds, and restarts the application

set -e  # Exit on any error

echo "=========================================="
echo "ConsensusLab 自动部署脚本"
echo "=========================================="
echo ""

# Source environment to get pnpm and other tools in PATH
if [ -f "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc"
fi

if [ -f "$HOME/.bash_profile" ]; then
    source "$HOME/.bash_profile"
fi

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: pnpm 未找到"
    echo "尝试使用 npm 作为替代..."

    # Try to use npm if pnpm is not available
    if command -v npm &> /dev/null; then
        alias pnpm='npm'
    else
        echo "❌ npm 也未找到，请安装 Node.js 和 pnpm"
        exit 1
    fi
fi

echo "📋 当前工作目录: $(pwd)"
echo ""

# Step 1: Pull latest code
echo "📥 步骤 1/4: 拉取最新代码..."
git stash
git checkout standalone
git pull origin standalone
echo "✅ 代码更新完成"
echo ""

# Step 2: Install dependencies
echo "📦 步骤 2/4: 安装依赖..."
pnpm install --frozen-lockfile
echo "✅ 依赖安装完成"
echo ""

# Step 3: Build
echo "🔨 步骤 3/4: 构建项目..."
pnpm run build
echo "✅ 构建完成"
echo ""

# Step 4: Restart PM2
echo "🔄 步骤 4/4: 重启 PM2..."
pm2 restart consensuslab || pm2 start dist/index.js --name consensuslab
echo "✅ PM2 重启完成"
echo ""

# Show status
echo "📊 当前状态:"
pm2 list | grep consensuslab || echo "PM2 进程信息不可用"
echo ""

echo "=========================================="
echo "🎉 部署完成！"
echo "=========================================="
echo ""
echo "查看日志: pm2 logs consensuslab"
echo "查看状态: pm2 status"
echo ""
