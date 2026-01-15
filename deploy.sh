#!/bin/bash

###############################################################################
# ConsensusLab 一键部署脚本
# 适用于 Ubuntu 20.04/22.04 服务器
# 
# 使用方法：
#   chmod +x deploy.sh
#   sudo ./deploy.sh
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否以root权限运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 sudo 运行此脚本"
        exit 1
    fi
}

# 检查系统版本
check_system() {
    log_info "检查系统版本..."
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        log_info "检测到系统: $OS $VER"
        
        if [[ "$ID" != "ubuntu" ]]; then
            log_warning "此脚本专为 Ubuntu 设计，其他系统可能需要调整"
        fi
    else
        log_error "无法检测系统版本"
        exit 1
    fi
}

# 更新系统
update_system() {
    log_info "更新系统包..."
    apt-get update -y
    apt-get upgrade -y
    log_success "系统更新完成"
}

# 安装基础依赖
install_dependencies() {
    log_info "安装基础依赖..."
    apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        ca-certificates \
        gnupg \
        lsb-release \
        software-properties-common
    log_success "基础依赖安装完成"
}

# 安装 Node.js 22
install_nodejs() {
    log_info "安装 Node.js 22..."
    
    # 检查是否已安装
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 22 ]; then
            log_success "Node.js $NODE_VERSION 已安装"
            return
        else
            log_warning "检测到旧版本 Node.js，将升级到 v22"
        fi
    fi
    
    # 添加 NodeSource 仓库
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    
    # 安装 Node.js
    apt-get install -y nodejs
    
    # 验证安装
    node -v
    npm -v
    
    log_success "Node.js 安装完成"
}

# 安装 pnpm
install_pnpm() {
    log_info "安装 pnpm..."
    
    if command -v pnpm &> /dev/null; then
        log_success "pnpm 已安装"
        return
    fi
    
    npm install -g pnpm
    pnpm -v
    
    log_success "pnpm 安装完成"
}

# 安装 MySQL
install_mysql() {
    log_info "安装 MySQL 8.0..."
    
    if command -v mysql &> /dev/null; then
        log_success "MySQL 已安装"
        return
    fi
    
    # 安装 MySQL
    apt-get install -y mysql-server
    
    # 启动 MySQL
    systemctl start mysql
    systemctl enable mysql
    
    log_success "MySQL 安装完成"
    log_warning "请手动运行 'sudo mysql_secure_installation' 来配置 MySQL 安全设置"
}

# 配置 MySQL 数据库
setup_database() {
    log_info "配置数据库..."
    
    # 读取数据库配置
    read -p "请输入数据库名称 [consensuslab]: " DB_NAME
    DB_NAME=${DB_NAME:-consensuslab}
    
    read -p "请输入数据库用户名 [consensuslab_user]: " DB_USER
    DB_USER=${DB_USER:-consensuslab_user}
    
    read -sp "请输入数据库密码: " DB_PASSWORD
    echo
    
    if [ -z "$DB_PASSWORD" ]; then
        log_error "数据库密码不能为空"
        exit 1
    fi
    
    # 创建数据库和用户
    mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
    mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"
    
    # 保存数据库配置
    export DATABASE_URL="mysql://$DB_USER:$DB_PASSWORD@localhost:3306/$DB_NAME"
    
    log_success "数据库配置完成"
}

# 克隆项目
clone_project() {
    log_info "克隆项目..."
    
    PROJECT_DIR="/opt/consensuslab"
    
    if [ -d "$PROJECT_DIR" ]; then
        log_warning "项目目录已存在，将更新代码..."
        cd "$PROJECT_DIR"
        git pull
    else
        git clone https://github.com/jjj54788/consensuslab.git "$PROJECT_DIR"
        cd "$PROJECT_DIR"
    fi
    
    log_success "项目代码已准备好"
}

# 配置环境变量
configure_env() {
    log_info "配置环境变量..."
    
    cd "$PROJECT_DIR"
    
    if [ -f .env ]; then
        log_warning ".env 文件已存在，将备份为 .env.backup"
        cp .env .env.backup
    fi
    
    # 生成 JWT Secret
    JWT_SECRET=$(openssl rand -hex 32)
    
    # 读取 API 配置
    echo
    log_info "请配置 AI API（可选，留空则跳过）"
    read -p "请输入 Manus API Key（留空跳过）: " MANUS_API_KEY
    
    # 创建 .env 文件
    cat > .env << EOF
# 数据库配置
DATABASE_URL=$DATABASE_URL

# JWT 密钥
JWT_SECRET=$JWT_SECRET

# AI API 配置
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=${MANUS_API_KEY:-your-api-key-here}
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=${MANUS_API_KEY:-your-api-key-here}

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
EOF
    
    log_success "环境变量配置完成"
}

# 安装项目依赖
install_project_deps() {
    log_info "安装项目依赖..."
    
    cd "$PROJECT_DIR"
    pnpm install
    
    log_success "项目依赖安装完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    cd "$PROJECT_DIR"
    pnpm db:push
    
    log_success "数据库初始化完成"
}

# 构建项目
build_project() {
    log_info "构建项目..."
    
    cd "$PROJECT_DIR"
    pnpm build
    
    log_success "项目构建完成"
}

# 安装 PM2
install_pm2() {
    log_info "安装 PM2..."
    
    if command -v pm2 &> /dev/null; then
        log_success "PM2 已安装"
        return
    fi
    
    npm install -g pm2
    pm2 -v
    
    log_success "PM2 安装完成"
}

# 配置 PM2
configure_pm2() {
    log_info "配置 PM2..."
    
    cd "$PROJECT_DIR"
    
    # 创建 PM2 配置文件
    cat > ecosystem.config.js << 'EOF'
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
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
    
    # 创建日志目录
    mkdir -p logs
    
    log_success "PM2 配置完成"
}

# 启动服务
start_service() {
    log_info "启动服务..."
    
    cd "$PROJECT_DIR"
    
    # 停止旧服务
    pm2 delete consensuslab 2>/dev/null || true
    
    # 启动新服务
    pm2 start ecosystem.config.js
    
    # 保存 PM2 配置
    pm2 save
    
    # 设置开机自启
    pm2 startup systemd -u root --hp /root
    
    log_success "服务启动完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        ufw allow 3000/tcp
        ufw allow 22/tcp
        ufw --force enable
        log_success "防火墙配置完成"
    else
        log_warning "未检测到 ufw，请手动配置防火墙开放 3000 端口"
    fi
}

# 安装 Nginx（可选）
install_nginx() {
    log_info "是否安装 Nginx 作为反向代理？(y/n)"
    read -p "> " INSTALL_NGINX
    
    if [ "$INSTALL_NGINX" != "y" ]; then
        log_info "跳过 Nginx 安装"
        return
    fi
    
    log_info "安装 Nginx..."
    apt-get install -y nginx
    
    # 配置 Nginx
    cat > /etc/nginx/sites-available/consensuslab << 'EOF'
server {
    listen 80;
    server_name _;

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
EOF
    
    # 启用配置
    ln -sf /etc/nginx/sites-available/consensuslab /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    nginx -t
    
    # 重启 Nginx
    systemctl restart nginx
    systemctl enable nginx
    
    # 配置防火墙
    if command -v ufw &> /dev/null; then
        ufw allow 80/tcp
        ufw allow 443/tcp
    fi
    
    log_success "Nginx 安装配置完成"
}

# 显示部署信息
show_info() {
    echo
    echo "=========================================="
    log_success "ConsensusLab 部署完成！"
    echo "=========================================="
    echo
    log_info "项目目录: $PROJECT_DIR"
    log_info "访问地址: http://$(hostname -I | awk '{print $1}'):3000"
    echo
    log_info "常用命令:"
    echo "  查看服务状态: pm2 status"
    echo "  查看日志: pm2 logs consensuslab"
    echo "  重启服务: pm2 restart consensuslab"
    echo "  停止服务: pm2 stop consensuslab"
    echo
    log_info "配置文件:"
    echo "  环境变量: $PROJECT_DIR/.env"
    echo "  PM2 配置: $PROJECT_DIR/ecosystem.config.js"
    echo
    log_warning "重要提示:"
    echo "  1. 请修改 .env 文件中的 API 密钥"
    echo "  2. 建议配置 SSL 证书（使用 certbot）"
    echo "  3. 定期备份数据库"
    echo
}

# 主函数
main() {
    echo "=========================================="
    echo "  ConsensusLab 一键部署脚本"
    echo "=========================================="
    echo
    
    check_root
    check_system
    
    log_info "开始部署..."
    echo
    
    update_system
    install_dependencies
    install_nodejs
    install_pnpm
    install_mysql
    setup_database
    clone_project
    configure_env
    install_project_deps
    init_database
    build_project
    install_pm2
    configure_pm2
    start_service
    configure_firewall
    install_nginx
    
    show_info
}

# 执行主函数
main
