# ConsensusLab 服务器部署指南

本文档详细介绍如何在全新的 Ubuntu 服务器上部署 ConsensusLab 多智能体协商平台。

---

## 📋 目录

- [服务器要求](#服务器要求)
- [快速部署（推荐）](#快速部署推荐)
- [手动部署](#手动部署)
- [配置说明](#配置说明)
- [服务管理](#服务管理)
- [常见问题](#常见问题)
- [安全建议](#安全建议)
- [性能优化](#性能优化)

---

## 服务器要求

### 最低配置

- **操作系统**: Ubuntu 20.04 LTS 或 22.04 LTS
- **CPU**: 2核
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 公网IP，开放 80/443/3000 端口

### 推荐配置

- **操作系统**: Ubuntu 22.04 LTS
- **CPU**: 4核
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 公网IP，10Mbps+ 带宽

### 软件依赖

部署脚本会自动安装以下软件：

- Node.js 22.x
- pnpm 9.x
- MySQL 8.0
- PM2（进程管理器）
- Nginx（可选，反向代理）

---

## 快速部署（推荐）

使用一键部署脚本可以在 5-10 分钟内完成整个部署过程。

### 步骤 1: 连接到服务器

```bash
ssh root@your-server-ip
```

或使用密钥登录：

```bash
ssh -i /path/to/private-key root@your-server-ip
```

### 步骤 2: 下载部署脚本

```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/jjj54788/consensuslab/main/deploy.sh

# 或使用 curl
curl -O https://raw.githubusercontent.com/jjj54788/consensuslab/main/deploy.sh
```

### 步骤 3: 运行部署脚本

```bash
# 添加执行权限
chmod +x deploy.sh

# 运行脚本（需要 root 权限）
sudo ./deploy.sh
```

### 步骤 4: 按提示配置

脚本会交互式地询问以下信息：

1. **数据库名称**（默认：consensuslab）
2. **数据库用户名**（默认：consensuslab_user）
3. **数据库密码**（必填，请设置强密码）
4. **Manus API Key**（可选，留空则跳过）
5. **是否安装 Nginx**（y/n）

### 步骤 5: 访问系统

部署完成后，访问：

```
http://your-server-ip:3000
```

如果安装了 Nginx，也可以直接访问：

```
http://your-server-ip
```

---

## 手动部署

如果你希望手动控制每个步骤，可以按照以下流程操作。

### 1. 更新系统

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. 安装基础依赖

```bash
sudo apt-get install -y curl wget git build-essential ca-certificates gnupg
```

### 3. 安装 Node.js 22

```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -

# 安装 Node.js
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

### 4. 安装 pnpm

```bash
sudo npm install -g pnpm
pnpm -v
```

### 5. 安装 MySQL

```bash
# 安装 MySQL
sudo apt-get install -y mysql-server

# 启动 MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 配置安全设置
sudo mysql_secure_installation
```

### 6. 创建数据库

```bash
# 登录 MySQL
sudo mysql

# 创建数据库和用户
CREATE DATABASE consensuslab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'consensuslab_user'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON consensuslab.* TO 'consensuslab_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 7. 克隆项目

```bash
# 克隆到 /opt 目录
cd /opt
sudo git clone https://github.com/jjj54788/consensuslab.git
cd consensuslab

# 设置权限
sudo chown -R $USER:$USER /opt/consensuslab
```

### 8. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

填写以下必需配置：

```env
DATABASE_URL=mysql://consensuslab_user:your_strong_password@localhost:3306/consensuslab
JWT_SECRET=your_jwt_secret_here
BUILT_IN_FORGE_API_KEY=your_manus_api_key
```

### 9. 安装依赖

```bash
pnpm install
```

### 10. 初始化数据库

```bash
pnpm db:push
```

### 11. 构建项目

```bash
pnpm build
```

### 12. 安装 PM2

```bash
sudo npm install -g pm2
```

### 13. 启动服务

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup systemd
```

### 14. 配置防火墙

```bash
# 允许必要端口
sudo ufw allow 22/tcp
sudo ufw allow 3000/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 启用防火墙
sudo ufw enable
```

---

## 配置说明

### 环境变量详解

创建 `.env` 文件并配置以下变量：

#### 必需配置

```env
# 数据库连接字符串
DATABASE_URL=mysql://user:password@localhost:3306/database_name

# JWT 密钥（用于用户认证）
JWT_SECRET=your-random-secret-key-here

# AI API 配置
BUILT_IN_FORGE_API_KEY=your-manus-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key
```

#### 可选配置

```env
# OAuth 配置（如果使用 Manus OAuth）
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=your-app-id

# 应用配置
VITE_APP_TITLE=ConsensusLab
VITE_APP_LOGO=/logo.svg

# 所有者信息
OWNER_OPEN_ID=admin
OWNER_NAME=Admin
```

### PM2 配置

`ecosystem.config.js` 文件配置：

```javascript
module.exports = {
  apps: [{
    name: 'consensuslab',
    script: 'server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### Nginx 配置

如果使用 Nginx 作为反向代理，配置文件位于 `/etc/nginx/sites-available/consensuslab`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 服务管理

### PM2 常用命令

```bash
# 查看所有服务状态
pm2 status

# 查看特定服务状态
pm2 show consensuslab

# 查看实时日志
pm2 logs consensuslab

# 查看错误日志
pm2 logs consensuslab --err

# 重启服务
pm2 restart consensuslab

# 停止服务
pm2 stop consensuslab

# 删除服务
pm2 delete consensuslab

# 监控服务
pm2 monit
```

### 系统服务管理

```bash
# MySQL 服务
sudo systemctl status mysql
sudo systemctl restart mysql
sudo systemctl stop mysql

# Nginx 服务
sudo systemctl status nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
```

### 日志查看

```bash
# PM2 日志
pm2 logs consensuslab

# Nginx 访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# MySQL 日志
sudo tail -f /var/log/mysql/error.log
```

---

## 常见问题

### 1. 端口被占用

**问题**：启动服务时提示端口 3000 已被占用

**解决方案**：

```bash
# 查找占用端口的进程
sudo lsof -i :3000

# 杀死进程
sudo kill -9 <PID>

# 或修改 .env 文件中的 PORT 配置
```

### 2. 数据库连接失败

**问题**：服务启动失败，提示数据库连接错误

**解决方案**：

```bash
# 检查 MySQL 服务状态
sudo systemctl status mysql

# 测试数据库连接
mysql -u consensuslab_user -p consensuslab

# 检查 .env 文件中的 DATABASE_URL 是否正确
```

### 3. PM2 服务无法启动

**问题**：PM2 启动服务失败

**解决方案**：

```bash
# 查看详细错误信息
pm2 logs consensuslab --err

# 检查 Node.js 版本
node -v  # 应该是 v22.x

# 手动运行服务测试
cd /opt/consensuslab
pnpm dev
```

### 4. 内存不足

**问题**：服务运行一段时间后崩溃

**解决方案**：

```bash
# 增加 PM2 内存限制
pm2 restart consensuslab --max-memory-restart 2G

# 或修改 ecosystem.config.js
max_memory_restart: '2G'
```

### 5. Nginx 502 Bad Gateway

**问题**：通过 Nginx 访问时出现 502 错误

**解决方案**：

```bash
# 检查后端服务是否运行
pm2 status

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
```

---

## 安全建议

### 1. 防火墙配置

```bash
# 只开放必要端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. SSH 安全

```bash
# 禁用 root 登录
sudo nano /etc/ssh/sshd_config
# 设置: PermitRootLogin no

# 使用密钥认证
# 设置: PasswordAuthentication no

# 重启 SSH 服务
sudo systemctl restart sshd
```

### 3. MySQL 安全

```bash
# 运行安全配置
sudo mysql_secure_installation

# 禁止远程 root 登录
# 删除测试数据库
# 设置强密码策略
```

### 4. 定期更新

```bash
# 更新系统包
sudo apt-get update
sudo apt-get upgrade -y

# 更新 Node.js 包
cd /opt/consensuslab
pnpm update
```

### 5. 配置 SSL 证书

使用 Let's Encrypt 免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 性能优化

### 1. 数据库优化

编辑 `/etc/mysql/mysql.conf.d/mysqld.cnf`：

```ini
[mysqld]
# 连接池配置
max_connections = 200
max_connect_errors = 100

# 缓存配置
query_cache_type = 1
query_cache_size = 64M

# InnoDB 配置
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
```

重启 MySQL：

```bash
sudo systemctl restart mysql
```

### 2. Node.js 优化

修改 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'consensuslab',
    script: 'server/index.ts',
    instances: 'max',  // 使用所有 CPU 核心
    exec_mode: 'cluster',  // 集群模式
    max_memory_restart: '2G',
    node_args: '--max-old-space-size=2048'
  }]
};
```

### 3. Nginx 优化

编辑 `/etc/nginx/nginx.conf`：

```nginx
http {
    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
    
    # 缓存配置
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
    
    # 连接优化
    keepalive_timeout 65;
    keepalive_requests 100;
}
```

### 4. 监控和日志

安装监控工具：

```bash
# 安装 htop
sudo apt-get install -y htop

# 安装 iotop
sudo apt-get install -y iotop

# 使用 PM2 监控
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 备份和恢复

### 数据库备份

```bash
# 创建备份脚本
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

mysqldump -u consensuslab_user -p'your_password' consensuslab > $BACKUP_DIR/consensuslab_$DATE.sql
gzip $BACKUP_DIR/consensuslab_$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-db.sh

# 添加到 crontab（每天凌晨 2 点备份）
crontab -e
# 添加: 0 2 * * * /opt/backup-db.sh
```

### 数据库恢复

```bash
# 解压备份文件
gunzip /opt/backups/consensuslab_20240115_020000.sql.gz

# 恢复数据库
mysql -u consensuslab_user -p consensuslab < /opt/backups/consensuslab_20240115_020000.sql
```

---

## 更新部署

### 更新代码

```bash
cd /opt/consensuslab

# 拉取最新代码
git pull

# 安装新依赖
pnpm install

# 更新数据库
pnpm db:push

# 重新构建
pnpm build

# 重启服务
pm2 restart consensuslab
```

### 回滚版本

```bash
cd /opt/consensuslab

# 查看历史版本
git log --oneline

# 回滚到指定版本
git checkout <commit-hash>

# 重新部署
pnpm install
pnpm build
pm2 restart consensuslab
```

---

## 联系支持

如果遇到问题，可以通过以下方式获取帮助：

- **GitHub Issues**: https://github.com/jjj54788/consensuslab/issues
- **文档**: https://github.com/jjj54788/consensuslab/tree/main/docs
- **讨论区**: https://github.com/jjj54788/consensuslab/discussions

---

**祝部署顺利！** 🚀
