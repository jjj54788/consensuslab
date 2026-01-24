#!/bin/bash

# Quick Deploy Script - Upload Fixes to Server

SERVER="ai4news@10.218.163.144"
BASE_PATH="/home/ai4news/Sen_Li/consensuslab"

echo "=========================================="
echo "部署修复文件到服务器"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "deploy.py" ]; then
    echo "❌ 错误: 请在 deploy-interface 目录下运行此脚本"
    exit 1
fi

echo "📤 上传文件到服务器..."
echo ""

# Upload deploy.py
echo "1. 上传 deploy.py..."
scp deploy.py "$SERVER:$BASE_PATH/deploy-interface/"

# Upload update-standalone.sh
echo "2. 上传 update-standalone.sh..."
scp ../update-standalone.sh "$SERVER:$BASE_PATH/"

echo ""
echo "🔧 设置文件权限..."

# Make scripts executable and restart service
ssh "$SERVER" << 'EOF'
cd /home/ai4news/Sen_Li/consensuslab
chmod +x update-standalone.sh
chmod +x deploy-interface/deploy.py

echo ""
echo "📋 检查文件..."
ls -lh update-standalone.sh deploy-interface/deploy.py

echo ""
echo "🔄 重启部署服务..."
cd deploy-interface
pkill -f "python.*deploy.py" || true
sleep 2

echo ""
echo "🚀 启动部署服务..."
nohup python3 deploy.py > deploy.log 2>&1 &

sleep 3

echo ""
echo "📊 检查服务状态..."
if pgrep -f "python.*deploy.py" > /dev/null; then
    echo "✅ 部署服务运行中"
    echo ""
    echo "查看日志: tail -f ~/Sen_Li/consensuslab/deploy-interface/deploy.log"
else
    echo "❌ 部署服务未启动"
    echo "请手动检查日志"
fi
EOF

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "访问: http://10.218.163.144:5000"
echo ""
