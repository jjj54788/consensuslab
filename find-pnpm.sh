#!/usr/bin/env bash

# Diagnostic script to find pnpm location

echo "=========================================="
echo "查找 pnpm 安装位置"
echo "=========================================="
echo ""

# Load environment
[ -f "$HOME/.bashrc" ] && source "$HOME/.bashrc"
[ -f "$HOME/.bash_profile" ] && source "$HOME/.bash_profile"
[ -f "$HOME/.profile" ] && source "$HOME/.profile"

echo "1. 当前环境信息:"
echo "   HOME: $HOME"
echo "   USER: $USER"
echo "   PATH: $PATH"
echo ""

echo "2. 检查 pnpm 命令:"
if command -v pnpm &> /dev/null; then
    PNPM_PATH=$(which pnpm)
    echo "   ✅ pnpm 可用"
    echo "   位置: $PNPM_PATH"
    echo "   版本: $(pnpm --version)"

    # Check if it's a symlink
    if [ -L "$PNPM_PATH" ]; then
        REAL_PATH=$(readlink -f "$PNPM_PATH")
        echo "   实际位置: $REAL_PATH"
    fi
else
    echo "   ❌ pnpm 不在 PATH 中"
fi
echo ""

echo "3. 搜索常见位置:"
SEARCH_PATHS=(
    "/home/ai4news/.local/share/pnpm"
    "/home/ai4news/.npm-global/bin"
    "/usr/local/bin"
    "/usr/bin"
    "$HOME/.local/share/pnpm"
    "$HOME/.nvm/versions/node"
    "$HOME/.config/pnpm"
)

for path in "${SEARCH_PATHS[@]}"; do
    if [ -e "$path" ]; then
        echo "   ✓ 存在: $path"
        if [ -f "$path/pnpm" ]; then
            echo "      → pnpm 可执行文件在此"
        fi
        if [ -d "$path" ]; then
            PNPM_FILES=$(find "$path" -name "pnpm" -type f 2>/dev/null)
            if [ ! -z "$PNPM_FILES" ]; then
                echo "      → 找到 pnpm 文件:"
                echo "$PNPM_FILES" | sed 's/^/         /'
            fi
        fi
    else
        echo "   ✗ 不存在: $path"
    fi
done
echo ""

echo "4. 全局搜索 pnpm (可能较慢):"
echo "   搜索中..."
find /home /usr /opt -name "pnpm" -type f 2>/dev/null | head -20
echo ""

echo "5. npm 全局安装位置:"
if command -v npm &> /dev/null; then
    echo "   npm prefix: $(npm config get prefix)"
    echo "   npm bin: $(npm bin -g)"
else
    echo "   ❌ npm 未安装"
fi
echo ""

echo "6. Node.js 信息:"
if command -v node &> /dev/null; then
    echo "   Node 版本: $(node --version)"
    echo "   Node 位置: $(which node)"
else
    echo "   ❌ Node.js 未安装"
fi
echo ""

echo "7. 环境变量文件内容:"
echo "   ~/.bashrc 中的 PATH 设置:"
grep -n "PATH.*pnpm" ~/.bashrc 2>/dev/null || echo "   (未找到 pnpm 相关设置)"
echo ""
echo "   ~/.bash_profile 中的 PATH 设置:"
grep -n "PATH.*pnpm" ~/.bash_profile 2>/dev/null || echo "   (未找到 pnpm 相关设置)"
echo ""

echo "=========================================="
echo "诊断完成"
echo "=========================================="
echo ""
echo "💡 如何使用此信息:"
echo "   1. 找到 pnpm 的实际位置"
echo "   2. 将该路径添加到 update-standalone.sh 的 PATH 中"
echo "   3. 或使用 update-standalone-v2.sh (自动查找)"
echo ""
