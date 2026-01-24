# 快速开始指南

## 5分钟快速部署

### 第一步: 安装Python依赖

```bash
cd deploy-interface
pip install -r requirements.txt
```

### 第二步: 配置SSH密码

编辑 `.env` 文件，填写SSH密码：

```env
SSH_PASSWORD=your_actual_password
```

**重要**: 必须设置真实的SSH密码！

### 第三步: 启动服务

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

**或直接运行:**
```bash
python deploy.py
```

### 第四步: 访问界面

在浏览器打开:
```
http://localhost:5000
```

### 第五步: 开始部署

1. 点击页面上的 **"开始部署"** 按钮
2. 等待部署完成
3. 看到 **"🎉 一键部署成功！"** 即表示部署完成

---

## 常见问题

### Q: 提示"SSH_PASSWORD not configured"?
**A**: 编辑 `.env` 文件，设置正确的SSH密码

### Q: 提示"No module named 'flask'"?
**A**: 运行 `pip install -r requirements.txt` 安装依赖

### Q: 端口5000被占用?
**A**: 修改 `.env` 文件中的 `FLASK_PORT=5001`

### Q: SSH连接超时?
**A**: 检查服务器IP地址和网络连接

---

## 架构图

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │────────▶│ Flask Server │────────▶│ SSH Server  │
│  (Frontend) │◀────────│  (Backend)   │◀────────│  (Remote)   │
└─────────────┘  SSE    └──────────────┘  SSH    └─────────────┘
                 Logs                              Execute Script
```

---

## 目录结构

```
deploy-interface/
├── deploy.py           ← Python后端主程序
├── templates/
│   └── index.html      ← Web界面
├── .env               ← 配置文件（需要你填写密码）
├── requirements.txt   ← Python依赖
├── start.sh           ← Linux/Mac启动脚本
├── start.bat          ← Windows启动脚本
└── README.md          ← 完整文档
```

---

## 完整配置示例

`.env` 文件完整配置:

```env
# SSH配置
SSH_HOST=10.218.163.144
SSH_PORT=22
SSH_USERNAME=ai4news
SSH_PASSWORD=your_password_here    # ← 必须填写！

# 部署配置
DEPLOY_PATH=/home/ai4news/Sen_Li/consensuslab/
DEPLOY_SCRIPT=./update-state-standalone.sh

# Flask配置（可选）
FLASK_ENV=production
FLASK_PORT=5000
```

---

## 下一步

查看完整文档: [README.md](README.md)

- 生产环境部署
- 安全建议
- 故障排查
- API接口文档

---

**需要帮助?** 请查看 [README.md](README.md) 或联系开发团队
