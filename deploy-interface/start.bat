@echo off
chcp 65001 >nul

echo ========================================
echo ConsensusLab 一键部署服务
echo ========================================
echo.

REM Check if .env exists
if not exist ".env" (
    echo ❌ 错误: .env 文件不存在
    echo 请复制 .env.example 到 .env 并配置SSH密码
    echo.
    echo 运行: copy .env.example .env
    echo 然后编辑 .env 文件设置 SSH_PASSWORD
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: Python 未安装
    echo 请先安装 Python 3.7 或更高版本
    pause
    exit /b 1
)

REM Check if dependencies are installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo 📦 安装依赖...
    pip install -r requirements.txt
    echo.
)

REM Start the server
echo 🚀 启动服务...
echo.
python deploy.py

pause
