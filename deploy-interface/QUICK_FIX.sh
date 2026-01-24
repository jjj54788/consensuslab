#!/bin/bash

echo "=========================================="
echo "一键修复 pnpm 问题"
echo "=========================================="
echo ""

echo "📤 上传修复文件..."
echo ""

# Upload v2 script
echo "1/4 上传 update-standalone-v2.sh..."
scp ../update-standalone-v2.sh ai4news@10.218.163.144:~/Sen_Li/consensuslab/

# Upload diagnostic script
echo "2/4 上传 find-pnpm.sh..."
scp ../find-pnpm.sh ai4news@10.218.163.144:~/Sen_Li/consensuslab/

# Set permissions
echo "3/4 设置执行权限..."
ssh ai4news@10.218.163.144 "chmod +x ~/Sen_Li/consensuslab/update-standalone-v2.sh ~/Sen_Li/consensuslab/find-pnpm.sh"

# Test the script
echo "4/4 测试新脚本..."
echo ""
echo "=========================================="
echo "运行诊断脚本..."
echo "=========================================="
ssh ai4news@10.218.163.144 "cd ~/Sen_Li/consensuslab && ./find-pnpm.sh"

echo ""
echo "=========================================="
echo "✅ 文件已上传！"
echo "=========================================="
echo ""
echo "📝 下一步:"
echo ""
echo "1. 编辑 .env 文件:"
echo "   DEPLOY_SCRIPT=./update-standalone-v2.sh"
echo ""
echo "2. 重启部署服务:"
echo "   cd deploy-interface"
echo "   python3 deploy.py"
echo ""
echo "3. 访问: http://10.218.163.144:5000"
echo "   点击\"开始部署\"测试"
echo ""
