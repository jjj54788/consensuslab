#!/bin/bash

# ConsensusLab Deploy Interface Startup Script

echo "========================================"
echo "ConsensusLab 一键部署服务"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ 错误: .env 文件不存在"
    echo "请复制 .env.example 到 .env 并配置SSH密码"
    echo ""
    echo "运行: cp .env.example .env"
    echo "然后编辑 .env 文件设置 SSH_PASSWORD"
    exit 1
fi

# Check if SSH_PASSWORD is set
if ! grep -q "^SSH_PASSWORD=." .env; then
    echo "⚠️  警告: SSH_PASSWORD 未配置"
    echo "请编辑 .env 文件设置 SSH_PASSWORD"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误: Python 3 未安装"
    echo "请先安装 Python 3.7 或更高版本"
    exit 1
fi

# Check if dependencies are installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "📦 安装依赖..."
    pip3 install -r requirements.txt
    echo ""
fi

# Start the server
echo "🚀 启动服务..."
echo ""
python3 deploy.py
