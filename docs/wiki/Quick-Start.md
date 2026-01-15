# 快速开始

本指南将帮助你在5-10分钟内在Ubuntu服务器上部署ConsensusLab。

---

## 前提条件

在开始之前，请确保你有：

- 一台Ubuntu 20.04或22.04服务器
- Root或sudo权限
- 服务器已连接到互联网
- 至少4GB RAM和20GB可用存储空间

---

## 一键部署

### 步骤1：连接到服务器

使用SSH连接到你的服务器：

```bash
ssh root@your-server-ip
```

或使用密钥登录：

```bash
ssh -i /path/to/private-key root@your-server-ip
```

### 步骤2：下载部署脚本

```bash
# 使用wget下载
wget https://raw.githubusercontent.com/jjj54788/consensuslab/main/deploy.sh

# 或使用curl下载
curl -O https://raw.githubusercontent.com/jjj54788/consensuslab/main/deploy.sh
```

### 步骤3：运行部署脚本

```bash
# 添加执行权限
chmod +x deploy.sh

# 运行脚本（需要root权限）
sudo ./deploy.sh
```

### 步骤4：配置参数

脚本会交互式地询问以下信息：

| 参数 | 说明 | 默认值 | 是否必填 |
|------|------|--------|----------|
| 数据库名称 | MySQL数据库名 | consensuslab | 否 |
| 数据库用户名 | MySQL用户名 | consensuslab_user | 否 |
| 数据库密码 | MySQL密码 | 无 | **是** |
| Manus API Key | AI API密钥 | 无 | 否 |
| 安装Nginx | 是否安装反向代理 | 否 | 否 |

**重要提示**：
- 数据库密码必须设置，建议使用强密码（至少12位，包含大小写字母、数字和特殊字符）
- Manus API Key可以留空，稍后在配置文件中添加
- 如果选择安装Nginx，脚本会自动配置反向代理

### 步骤5：等待部署完成

部署脚本会自动完成以下操作：

1. ✅ 更新系统包
2. ✅ 安装Node.js 22.x
3. ✅ 安装pnpm包管理器
4. ✅ 安装MySQL 8.0数据库
5. ✅ 创建数据库和用户
6. ✅ 克隆项目代码到/opt/consensuslab
7. ✅ 配置环境变量
8. ✅ 安装项目依赖
9. ✅ 初始化数据库表结构
10. ✅ 构建生产版本
11. ✅ 安装PM2进程管理器
12. ✅ 启动服务并设置开机自启
13. ✅ 配置防火墙规则
14. ✅ 安装和配置Nginx（如果选择）

整个过程大约需要5-10分钟，具体时间取决于服务器性能和网络速度。

### 步骤6：访问系统

部署完成后，你会看到类似以下的成功消息：

```
========================================
部署完成！
========================================

ConsensusLab 已成功部署并启动！

访问地址:
  - http://your-server-ip:3000
  - http://your-server-ip (如果安装了Nginx)

服务管理:
  pm2 status              # 查看服务状态
  pm2 logs consensuslab   # 查看日志
  pm2 restart consensuslab # 重启服务

配置文件: /opt/consensuslab/.env
项目目录: /opt/consensuslab

========================================
```

现在你可以通过浏览器访问系统：

- **直接访问**: `http://your-server-ip:3000`
- **通过Nginx**: `http://your-server-ip`（如果安装了Nginx）

---

## 部署后配置

### 配置API密钥

如果在部署时没有配置Manus API Key，可以手动编辑环境变量文件：

```bash
# 编辑环境变量
cd /opt/consensuslab
nano .env
```

找到并修改以下配置：

```env
BUILT_IN_FORGE_API_KEY=your_actual_manus_api_key
VITE_FRONTEND_FORGE_API_KEY=your_actual_frontend_api_key
```

保存后重启服务：

```bash
pm2 restart consensuslab
```

### 配置域名（可选）

如果你有域名并希望使用域名访问，需要：

1. 将域名的A记录指向服务器IP
2. 修改Nginx配置：

```bash
sudo nano /etc/nginx/sites-available/consensuslab
```

修改`server_name`行：

```nginx
server_name your-domain.com;
```

测试并重启Nginx：

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 配置SSL证书（推荐）

使用Let's Encrypt免费SSL证书：

```bash
# 安装Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书（会自动配置Nginx）
sudo certbot --nginx -d your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

---

## 验证部署

### 检查服务状态

```bash
# 查看PM2服务状态
pm2 status

# 应该看到类似输出：
# ┌─────┬──────────────┬─────────┬─────────┬─────────┬──────────┐
# │ id  │ name         │ mode    │ ↺       │ status  │ cpu      │
# ├─────┼──────────────┼─────────┼─────────┼─────────┼──────────┤
# │ 0   │ consensuslab │ fork    │ 0       │ online  │ 0%       │
# └─────┴──────────────┴─────────┴─────────┴─────────┴──────────┘
```

### 检查日志

```bash
# 查看实时日志
pm2 logs consensuslab

# 只查看错误日志
pm2 logs consensuslab --err
```

### 测试数据库连接

```bash
# 登录MySQL
mysql -u consensuslab_user -p consensuslab

# 查看表
SHOW TABLES;

# 应该看到类似输出：
# +-------------------------+
# | Tables_in_consensuslab  |
# +-------------------------+
# | debates                 |
# | messages                |
# | users                   |
# | ...                     |
# +-------------------------+

# 退出MySQL
EXIT;
```

---

## 常用管理命令

### 服务管理

```bash
# 查看服务状态
pm2 status

# 查看详细信息
pm2 show consensuslab

# 重启服务
pm2 restart consensuslab

# 停止服务
pm2 stop consensuslab

# 查看日志
pm2 logs consensuslab

# 清空日志
pm2 flush
```

### 系统服务

```bash
# MySQL服务
sudo systemctl status mysql
sudo systemctl restart mysql

# Nginx服务
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx  # 重新加载配置
```

---

## 下一步

现在你已经成功部署了ConsensusLab！接下来可以：

- **[了解核心功能](Features)** - 探索系统的所有功能
- **[配置详解](Configuration)** - 深入了解配置选项
- **[性能优化](Performance-Optimization)** - 优化系统性能
- **[安全加固](Security)** - 提升系统安全性

---

## 遇到问题？

如果部署过程中遇到问题，请查看：

- **[常见问题](Troubleshooting)** - 快速解决常见问题
- **[详细部署指南](Server-Deployment)** - 手动部署步骤和深入说明
- **[GitHub Issues](https://github.com/jjj54788/consensuslab/issues)** - 报告问题或寻求帮助

---

[← 返回首页](Home) | [服务器部署 →](Server-Deployment)
