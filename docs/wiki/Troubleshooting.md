# 常见问题排查

本页面收集了ConsensusLab部署和使用过程中的常见问题及解决方案。

---

## 📑 目录

- [部署问题](#部署问题)
- [服务启动问题](#服务启动问题)
- [数据库问题](#数据库问题)
- [网络和访问问题](#网络和访问问题)
- [性能问题](#性能问题)
- [其他问题](#其他问题)

---

## 部署问题

### 问题1：部署脚本执行失败

**症状**：运行`deploy.sh`时出现权限错误或命令未找到

**解决方案**：

```bash
# 确保使用sudo运行
sudo ./deploy.sh

# 如果提示命令未找到，检查执行权限
chmod +x deploy.sh
ls -l deploy.sh  # 应该看到 -rwxr-xr-x

# 如果提示bash: ./deploy.sh: /bin/bash^M: bad interpreter
# 说明文件格式问题，转换为Unix格式
dos2unix deploy.sh
# 或
sed -i 's/\r$//' deploy.sh
```

### 问题2：Node.js版本不正确

**症状**：部署后提示Node.js版本过低

**解决方案**：

```bash
# 检查当前版本
node -v

# 如果版本低于v22，重新安装
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs

# 验证安装
node -v  # 应该显示 v22.x.x
```

### 问题3：pnpm安装失败

**症状**：`pnpm install`命令失败或超时

**解决方案**：

```bash
# 清除npm缓存
npm cache clean --force

# 重新安装pnpm
sudo npm uninstall -g pnpm
sudo npm install -g pnpm

# 使用国内镜像（如果在中国）
pnpm config set registry https://registry.npmmirror.com

# 重试安装
cd /opt/consensuslab
pnpm install
```

---

## 服务启动问题

### 问题4：端口被占用

**症状**：启动服务时提示`Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**：

```bash
# 查找占用端口3000的进程
sudo lsof -i :3000

# 或使用netstat
sudo netstat -tlnp | grep 3000

# 杀死占用进程
sudo kill -9 <PID>

# 或修改配置使用其他端口
cd /opt/consensuslab
nano .env
# 修改 PORT=3001

# 重启服务
pm2 restart consensuslab
```

### 问题5：PM2服务无法启动

**症状**：`pm2 start`命令执行后服务状态显示`errored`

**解决方案**：

```bash
# 查看详细错误信息
pm2 logs consensuslab --err

# 常见原因1：环境变量配置错误
cd /opt/consensuslab
cat .env  # 检查配置是否正确

# 常见原因2：数据库连接失败
# 测试数据库连接
mysql -u consensuslab_user -p consensuslab

# 常见原因3：依赖未正确安装
cd /opt/consensuslab
rm -rf node_modules
pnpm install

# 常见原因4：构建失败
pnpm build

# 手动运行测试
pnpm dev  # 查看详细错误信息

# 修复后重启
pm2 delete consensuslab
pm2 start ecosystem.config.js
```

### 问题6：服务运行一段时间后崩溃

**症状**：服务启动正常，但运行一段时间后自动停止

**解决方案**：

```bash
# 检查内存使用
pm2 monit

# 如果是内存不足，增加内存限制
pm2 delete consensuslab
pm2 start ecosystem.config.js --max-memory-restart 2G

# 或修改 ecosystem.config.js
nano ecosystem.config.js
# 修改 max_memory_restart: '2G'

# 检查系统资源
free -h  # 查看内存
df -h    # 查看磁盘空间

# 查看系统日志
sudo journalctl -u pm2-root -n 100
```

---

## 数据库问题

### 问题7：数据库连接失败

**症状**：服务启动失败，日志显示`Error: connect ECONNREFUSED 127.0.0.1:3306`

**解决方案**：

```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 如果未运行，启动MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# 测试数据库连接
mysql -u consensuslab_user -p consensuslab

# 如果提示密码错误，重置密码
sudo mysql
ALTER USER 'consensuslab_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;

# 更新.env文件中的密码
cd /opt/consensuslab
nano .env
# 修改 DATABASE_URL 中的密码

# 重启服务
pm2 restart consensuslab
```

### 问题8：数据库表不存在

**症状**：访问系统时提示`Table 'consensuslab.debates' doesn't exist`

**解决方案**：

```bash
# 重新初始化数据库
cd /opt/consensuslab
pnpm db:push

# 如果失败，手动检查数据库
mysql -u consensuslab_user -p consensuslab
SHOW TABLES;

# 如果表确实不存在，检查schema文件
cat drizzle/schema.ts

# 确保DATABASE_URL正确
cat .env | grep DATABASE_URL

# 重新运行迁移
pnpm db:push --force

# 重启服务
pm2 restart consensuslab
```

### 问题9：数据库连接数过多

**症状**：日志显示`Error: Too many connections`

**解决方案**：

```bash
# 检查当前连接数
mysql -u root -p
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';

# 增加最大连接数
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# 添加或修改：
# max_connections = 200

# 重启MySQL
sudo systemctl restart mysql

# 或者优化应用的连接池配置
# 修改 drizzle 配置减少连接数
```

---

## 网络和访问问题

### 问题10：无法访问3000端口

**症状**：浏览器访问`http://server-ip:3000`超时或拒绝连接

**解决方案**：

```bash
# 检查服务是否运行
pm2 status

# 检查端口是否监听
sudo netstat -tlnp | grep 3000

# 检查防火墙规则
sudo ufw status

# 如果端口未开放，添加规则
sudo ufw allow 3000/tcp
sudo ufw reload

# 如果使用云服务器，检查安全组规则
# 确保在云服务商控制台开放3000端口

# 测试本地访问
curl http://localhost:3000

# 如果本地可以访问但外部不行，检查服务器防火墙
sudo iptables -L -n
```

### 问题11：Nginx 502 Bad Gateway

**症状**：通过Nginx访问时显示502错误

**解决方案**：

```bash
# 检查后端服务是否运行
pm2 status

# 检查Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 常见原因1：后端服务未启动
pm2 start consensuslab

# 常见原因2：Nginx配置错误
sudo nginx -t
sudo nano /etc/nginx/sites-available/consensuslab
# 确保 proxy_pass http://localhost:3000;

# 常见原因3：SELinux阻止连接（CentOS/RHEL）
sudo setsebool -P httpd_can_network_connect 1

# 重启Nginx
sudo systemctl restart nginx
```

### 问题12：WebSocket连接失败

**症状**：实时功能不工作，浏览器控制台显示WebSocket错误

**解决方案**：

```bash
# 检查Nginx配置是否支持WebSocket
sudo nano /etc/nginx/sites-available/consensuslab

# 确保包含以下配置：
# proxy_http_version 1.1;
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection 'upgrade';
# proxy_cache_bypass $http_upgrade;

# 重新加载Nginx
sudo nginx -t
sudo systemctl reload nginx

# 如果使用CDN或负载均衡器，确保它们支持WebSocket
```

---

## 性能问题

### 问题13：系统响应缓慢

**症状**：页面加载慢，API请求超时

**解决方案**：

```bash
# 检查系统资源
top
htop  # 如果已安装

# 检查磁盘IO
iostat -x 1

# 检查数据库性能
mysql -u root -p
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Slow_queries';

# 优化数据库
# 添加索引、优化查询等

# 增加PM2实例数（集群模式）
pm2 delete consensuslab
pm2 start ecosystem.config.js -i max

# 启用Nginx缓存
sudo nano /etc/nginx/sites-available/consensuslab
# 添加缓存配置

# 重启服务
pm2 restart all
sudo systemctl restart nginx
```

### 问题14：内存使用过高

**症状**：服务器内存占用持续增长

**解决方案**：

```bash
# 检查内存使用
free -h
pm2 monit

# 设置内存限制
pm2 delete consensuslab
pm2 start ecosystem.config.js --max-memory-restart 1G

# 检查是否有内存泄漏
pm2 logs consensuslab

# 定期重启服务（临时方案）
crontab -e
# 添加：0 3 * * * pm2 restart consensuslab

# 升级服务器内存（长期方案）
```

---

## 其他问题

### 问题15：日志文件过大

**症状**：磁盘空间不足，日志文件占用大量空间

**解决方案**：

```bash
# 检查日志大小
du -sh ~/.pm2/logs/

# 清空日志
pm2 flush

# 安装日志轮转
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

# 配置Nginx日志轮转
sudo nano /etc/logrotate.d/nginx
# 确保包含正确的轮转配置
```

### 问题16：更新代码后功能异常

**症状**：`git pull`更新代码后系统出现错误

**解决方案**：

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

# 如果还有问题，查看日志
pm2 logs consensuslab --err

# 如果需要回滚
git log --oneline  # 查看历史版本
git checkout <commit-hash>
pnpm install
pnpm build
pm2 restart consensuslab
```

### 问题17：API密钥无效

**症状**：AI功能不工作，提示API密钥错误

**解决方案**：

```bash
# 检查环境变量
cd /opt/consensuslab
cat .env | grep API_KEY

# 确保密钥正确且有效
# 登录Manus平台检查密钥状态

# 更新密钥
nano .env
# 修改 BUILT_IN_FORGE_API_KEY 和 VITE_FRONTEND_FORGE_API_KEY

# 重启服务
pm2 restart consensuslab

# 测试API连接
curl -H "Authorization: Bearer your_api_key" https://api.manus.im/v1/models
```

---

## 获取更多帮助

如果以上方案都无法解决你的问题，请：

1. **查看详细日志**
   ```bash
   pm2 logs consensuslab --lines 100
   ```

2. **搜索GitHub Issues**
   https://github.com/jjj54788/consensuslab/issues

3. **提交新Issue**
   https://github.com/jjj54788/consensuslab/issues/new
   
   请包含以下信息：
   - 操作系统版本
   - Node.js版本
   - 错误日志
   - 复现步骤

4. **加入讨论区**
   https://github.com/jjj54788/consensuslab/discussions

---

[← 返回首页](Home) | [服务器部署](Server-Deployment) | [配置说明](Configuration)
