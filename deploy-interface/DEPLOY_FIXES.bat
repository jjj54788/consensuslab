@echo off
chcp 65001 >nul

echo ==========================================
echo 部署修复文件到服务器
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "deploy.py" (
    echo ❌ 错误: 请在 deploy-interface 目录下运行此脚本
    pause
    exit /b 1
)

echo 📤 上传文件到服务器...
echo.

REM Upload deploy.py
echo 1. 上传 deploy.py...
scp deploy.py ai4news@10.218.163.144:/home/ai4news/Sen_Li/consensuslab/deploy-interface/

REM Upload update-standalone.sh
echo 2. 上传 update-standalone.sh...
scp ..\update-standalone.sh ai4news@10.218.163.144:/home/ai4news/Sen_Li/consensuslab/

echo.
echo 🔧 设置权限并重启服务...

REM SSH into server and restart service
ssh ai4news@10.218.163.144 "cd /home/ai4news/Sen_Li/consensuslab && chmod +x update-standalone.sh && cd deploy-interface && pkill -f 'python.*deploy.py' || true && sleep 2 && nohup python3 deploy.py > deploy.log 2>&1 & sleep 3 && pgrep -f 'python.*deploy.py' && echo '✅ 部署服务已启动'"

echo.
echo ==========================================
echo ✅ 部署完成！
echo ==========================================
echo.
echo 访问: http://10.218.163.144:5000
echo.

pause
