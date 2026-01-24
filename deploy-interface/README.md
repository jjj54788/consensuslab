# ConsensusLab 一键部署 Web 界面

一个简单的Python Web界面，用于通过SSH连接到远程服务器并执行部署脚本。

## 功能特性

- 🚀 **一键部署**: 点击按钮即可启动部署流程
- 📡 **实时日志**: 使用Server-Sent Events实时显示部署日志
- 🔐 **安全连接**: 通过SSH连接到远程服务器
- 📊 **状态监控**: 实时显示部署状态和进度
- 🎨 **美观界面**: 现代化的渐变UI设计
- ⚙️ **环境配置**: 通过.env文件灵活配置

## 系统要求

- Python 3.7 或更高版本
- pip (Python包管理器)

## 快速开始

### 1. 安装依赖

```bash
# 进入项目目录
cd deploy-interface

# 安装Python依赖
pip install -r requirements.txt

# 或使用pip3
pip3 install -r requirements.txt
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写SSH连接信息：

```env
# SSH Configuration
SSH_HOST=10.218.163.144
SSH_PORT=22
SSH_USERNAME=ai4news
SSH_PASSWORD=your_actual_password_here

# Deployment Configuration
DEPLOY_PATH=/home/ai4news/Sen_Li/consensuslab/
DEPLOY_SCRIPT=./update-state-standalone.sh
```

**重要**: 必须设置 `SSH_PASSWORD`，否则无法连接到服务器。

### 3. 启动服务

```bash
python deploy.py
```

或使用:

```bash
python3 deploy.py
```

### 4. 访问界面

在浏览器中打开:

```
http://localhost:5000
```

如果要从其他设备访问，使用服务器的IP地址:

```
http://your-server-ip:5000
```

## 使用方法

1. **访问Web界面**: 在浏览器中打开 `http://localhost:5000`
2. **查看配置**: 页面顶部会显示目标服务器和部署路径信息
3. **点击部署按钮**: 点击"开始部署"按钮启动部署流程
4. **观察日志**: 部署日志会实时显示在页面下方的日志区域
5. **等待完成**: 当看到"🎉 一键部署成功！"消息时，部署完成

## 配置说明

### SSH配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `SSH_HOST` | 目标服务器IP或域名 | `10.218.163.144` |
| `SSH_PORT` | SSH端口 | `22` |
| `SSH_USERNAME` | SSH用户名 | `ai4news` |
| `SSH_PASSWORD` | SSH密码 | (必须设置) |

### 部署配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DEPLOY_PATH` | 部署目录路径 | `/home/ai4news/Sen_Li/consensuslab/` |
| `DEPLOY_SCRIPT` | 要执行的脚本 | `./update-state-standalone.sh` |

### Flask配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `FLASK_ENV` | Flask运行环境 | `production` |
| `FLASK_PORT` | Web服务端口 | `5000` |

## 项目结构

```
deploy-interface/
├── deploy.py              # Flask后端主程序
├── templates/
│   └── index.html         # Web界面HTML模板
├── requirements.txt       # Python依赖列表
├── .env                   # 环境配置文件
├── .env.example          # 环境配置示例
└── README.md             # 本文件
```

## 技术架构

### 后端
- **Flask**: Python Web框架
- **Paramiko**: SSH客户端库，用于连接远程服务器
- **python-dotenv**: 环境变量管理
- **Flask-CORS**: 跨域资源共享支持

### 前端
- **Vanilla JavaScript**: 原生JS，无需额外框架
- **Server-Sent Events (SSE)**: 实时日志流传输
- **CSS3**: 现代化渐变UI设计

### 工作流程

1. 用户点击部署按钮
2. 前端发送POST请求到 `/api/deploy`
3. 后端创建SSH连接到目标服务器
4. 执行部署脚本，实时捕获输出
5. 通过SSE将日志推送到前端
6. 前端实时显示日志和状态
7. 部署完成，显示成功消息

## API接口

### POST /api/deploy
启动部署流程

**响应示例:**
```json
{
  "success": true,
  "message": "部署已启动"
}
```

### GET /api/status
获取当前部署状态

**响应示例:**
```json
{
  "running": false,
  "success": true,
  "error": null,
  "start_time": "2026-01-21T15:30:00",
  "end_time": "2026-01-21T15:32:00"
}
```

### GET /api/logs
SSE日志流 (Server-Sent Events)

**事件格式:**
```
data: {"timestamp": "2026-01-21 15:30:01", "level": "INFO", "message": "连接成功"}
```

### GET /api/config
获取配置信息（不包含密码）

**响应示例:**
```json
{
  "host": "10.218.163.144",
  "port": 22,
  "username": "ai4news",
  "deploy_path": "/home/ai4news/Sen_Li/consensuslab/",
  "deploy_script": "./update-state-standalone.sh",
  "has_password": true
}
```

## 故障排查

### 1. SSH连接失败

**问题**: 出现"SSH认证失败"错误

**解决方案**:
- 检查 `.env` 文件中的 `SSH_PASSWORD` 是否正确
- 确认 `SSH_USERNAME` 和 `SSH_HOST` 配置正确
- 测试SSH连接: `ssh ai4news@10.218.163.144`

### 2. 脚本执行失败

**问题**: 部署脚本返回非零退出码

**解决方案**:
- 检查脚本路径是否正确
- 确认脚本有执行权限: `chmod +x update-state-standalone.sh`
- 手动SSH到服务器测试脚本: `cd /path/to/script && ./update-state-standalone.sh`

### 3. 端口被占用

**问题**: `Address already in use` 错误

**解决方案**:
```bash
# 查找占用5000端口的进程
lsof -i :5000

# 结束进程
kill -9 <PID>

# 或更改端口
# 在 .env 中设置: FLASK_PORT=5001
```

### 4. 依赖安装失败

**问题**: pip install 失败

**解决方案**:
```bash
# 升级pip
pip install --upgrade pip

# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 或使用虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## 生产环境部署

### 使用Gunicorn (推荐)

```bash
# 安装Gunicorn
pip install gunicorn

# 启动服务
gunicorn -w 4 -b 0.0.0.0:5000 deploy:app
```

### 使用systemd服务

创建服务文件 `/etc/systemd/system/deploy-interface.service`:

```ini
[Unit]
Description=ConsensusLab Deploy Interface
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/deploy-interface
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 deploy.py
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
sudo systemctl daemon-reload
sudo systemctl enable deploy-interface
sudo systemctl start deploy-interface
```

### 使用Nginx反向代理

Nginx配置示例:

```nginx
server {
    listen 80;
    server_name deploy.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header X-Accel-Buffering no;
    }
}
```

## 安全建议

1. **保护.env文件**: 确保 `.env` 不被提交到版本控制系统
2. **使用HTTPS**: 生产环境建议使用SSL/TLS加密
3. **限制访问**: 使用防火墙规则限制访问IP
4. **使用SSH密钥**: 更安全的方式是使用SSH密钥而不是密码
5. **定期更新**: 保持依赖库为最新版本

## 许可证

MIT License

## 支持

如有问题，请创建Issue或联系开发团队。

---

**开发团队**: ConsensusLab
**最后更新**: 2026-01-21
