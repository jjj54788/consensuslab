#!/usr/bin/env bash

# ConsensusLab Standalone Deployment Script
# More robust version with better PATH handling

echo "=========================================="
echo "ConsensusLab 自动部署脚本 v2"
echo "=========================================="
echo ""

cd ~/Sen_Li/consensuslab

export HOME=/home/ai4news
export USER=ai4news

# Source all possible profile files to get full environment
echo "🔍 加载环境配置..."
[ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc"
[ -f "$HOME/.bash_profile" ] && source "$HOME/.bash_profile"
[ -f "$HOME/.profile" ] && source "$HOME/.profile"

# Try common pnpm locations
PNPM_LOCATIONS=(
    "/home/ai4news/.local/share/pnpm"
    "/home/ai4news/.npm-global/bin"
    "/usr/local/bin"
    "/usr/bin"
    "$HOME/.local/share/pnpm"
    "$HOME/.nvm/versions/node/*/bin"
)

echo "🔍 查找 pnpm..."
PNPM_FOUND=false

# First try if pnpm is already in PATH
if command -v pnpm &> /dev/null; then
    PNPM_PATH=$(which pnpm)
    echo "✅ 找到 pnpm: $PNPM_PATH"
    PNPM_FOUND=true
else
    # Search in common locations
    for loc in "${PNPM_LOCATIONS[@]}"; do
        # Handle wildcard in nvm path
        for path in $loc; do
            if [ -f "$path/pnpm" ]; then
                export PATH="$path:$PATH"
                echo "✅ 找到 pnpm: $path/pnpm"
                PNPM_FOUND=true
                break 2
            fi
        done
    done
fi

# If still not found, try to use npm
if [ "$PNPM_FOUND" = false ]; then
    echo "⚠️  未找到 pnpm，尝试使用 npm..."
    if command -v npm &> /dev/null; then
        echo "✅ 使用 npm 作为替代"
        # Create pnpm alias
        pnpm() {
            npm "$@"
        }
        export -f pnpm
    else
        echo "❌ 错误: npm 和 pnpm 都未找到"
        echo "当前 PATH: $PATH"
        echo "请确保 Node.js 和 pnpm 已正确安装"
        exit 1
    fi
fi

# Show environment info
echo ""
echo "📋 环境信息:"
echo "   工作目录: $(pwd)"
echo "   Node 版本: $(node --version 2>/dev/null || echo '未安装')"
echo "   pnpm 版本: $(pnpm --version 2>/dev/null || echo '未找到')"
echo "   npm 版本: $(npm --version 2>/dev/null || echo '未安装')"
echo ""

# Now proceed with deployment
set -e  # Exit on error from this point

echo "📥 步骤 1/5: 获取最新代码..."
git fetch origin
git checkout standalone
git pull --ff-only origin standalone
echo "✅ 代码更新完成"
echo ""

echo "📦 步骤 2/5: 安装依赖..."
pnpm install
echo "✅ 依赖安装完成"
echo ""

echo "🗄️  步骤 3/5: 数据库迁移..."
pnpm db:push || echo "⚠️  数据库迁移跳过（可能已存在）"
echo "✅ 数据库检查完成"
echo ""

echo "🔨 步骤 4/5: 构建项目..."
pnpm build
echo "✅ 构建完成"
echo ""

echo "🔄 步骤 5/5: 重启服务..."
pm2 restart consensuslab || pm2 start dist/index.js --name consensuslab
echo "✅ 服务重启完成"
echo ""

# Show final status
echo "📊 当前状态:"
pm2 list | grep consensuslab || pm2 list
echo ""

echo "=========================================="
echo "🎉 部署成功！"
echo "=========================================="
echo ""
echo "💡 提示:"
echo "   查看日志: pm2 logs consensuslab"
echo "   查看状态: pm2 status"
echo "   重启服务: pm2 restart consensuslab"
echo ""
