# pnpm 路径问题修复指南

## 问题现象

```
./update-standalone.sh: line 14: pnpm: command not found
脚本执行失败 (退出码: 127)
```

即使脚本中设置了 PATH，pnpm 仍然找不到。

## 原因分析

1. **pnpm 不在指定的路径**
   - 脚本中写的路径: `/home/ai4news/.local/share/pnpm`
   - pnpm 实际可能在其他位置（如 nvm 目录、npm 全局目录等）

2. **环境变量未完全加载**
   - bash login shell 可能没有完全加载所有环境

## 解决方案（3选1）

### 方案1: 使用新版部署脚本（推荐）✅

我创建了一个更智能的脚本 `update-standalone-v2.sh`，它会：
- 自动搜索多个可能的 pnpm 位置
- 加载所有环境配置文件
- 如果找不到 pnpm，自动使用 npm 作为替代
- 显示详细的诊断信息

**步骤：**

```bash
# 1. 上传新脚本
scp update-standalone-v2.sh ai4news@10.218.163.144:~/Sen_Li/consensuslab/

# 2. SSH 到服务器
ssh ai4news@10.218.163.144

# 3. 设置权限
chmod +x ~/Sen_Li/consensuslab/update-standalone-v2.sh

# 4. 测试运行
cd ~/Sen_Li/consensuslab
./update-standalone-v2.sh
```

如果测试成功，更新部署界面配置：

编辑 `deploy-interface/.env`:
```env
DEPLOY_SCRIPT=./update-standalone-v2.sh
```

---

### 方案2: 找到 pnpm 的真实位置

使用诊断脚本找到 pnpm：

```bash
# 1. 上传诊断脚本
scp find-pnpm.sh ai4news@10.218.163.144:~/Sen_Li/consensuslab/

# 2. SSH 到服务器
ssh ai4news@10.218.163.144

# 3. 运行诊断
cd ~/Sen_Li/consensuslab
chmod +x find-pnpm.sh
./find-pnpm.sh
```

诊断脚本会显示：
- pnpm 的位置
- Node.js 和 npm 的位置
- PATH 环境变量的内容
- 所有可能的 pnpm 安装位置

找到正确的路径后，更新 `update-standalone.sh`:

```bash
# 例如，如果 pnpm 在 /usr/local/bin
export PATH="/usr/local/bin:$PATH"

# 或在 nvm 目录
export PATH="$HOME/.nvm/versions/node/v18.16.0/bin:$PATH"
```

---

### 方案3: 直接使用 pnpm 完整路径

在交互式 shell 中找到 pnpm 的完整路径：

```bash
# SSH 到服务器
ssh ai4news@10.218.163.144

# 查找 pnpm 位置
which pnpm
# 输出例如: /home/ai4news/.nvm/versions/node/v18.16.0/bin/pnpm
```

然后在 `update-standalone.sh` 中使用完整路径：

```bash
#!/usr/bin/env bash
set -e

cd ~/Sen_Li/consensuslab

# 使用完整路径
PNPM_PATH="/home/ai4news/.nvm/versions/node/v18.16.0/bin/pnpm"

git fetch origin
git checkout standalone
git pull --ff-only origin standalone

$PNPM_PATH install
$PNPM_PATH db:push
$PNPM_PATH build

pm2 restart consensuslab
```

---

## 快速部署新脚本（推荐）

**Windows 用户：**

创建文件 `deploy-v2.bat`:
```batch
@echo off
scp update-standalone-v2.sh ai4news@10.218.163.144:~/Sen_Li/consensuslab/
ssh ai4news@10.218.163.144 "chmod +x ~/Sen_Li/consensuslab/update-standalone-v2.sh"
echo 已部署新版脚本
pause
```

运行 `deploy-v2.bat`

**Linux/Mac 用户：**

```bash
scp update-standalone-v2.sh ai4news@10.218.163.144:~/Sen_Li/consensuslab/
ssh ai4news@10.218.163.144 "chmod +x ~/Sen_Li/consensuslab/update-standalone-v2.sh"
```

---

## 更新部署界面配置

编辑 `deploy-interface/.env`:

```env
# 修改这一行
DEPLOY_SCRIPT=./update-standalone-v2.sh
```

重启部署服务：

```bash
cd ~/Sen_Li/consensuslab/deploy-interface
pkill -f "python.*deploy.py"
python3 deploy.py
```

---

## 验证修复

1. 访问部署界面: `http://10.218.163.144:5000`
2. 点击"开始部署"按钮
3. 观察日志，应该看到：
   ```
   🔍 加载环境配置...
   🔍 查找 pnpm...
   ✅ 找到 pnpm: /path/to/pnpm
   📋 环境信息:
      工作目录: /home/ai4news/Sen_Li/consensuslab
      Node 版本: v18.16.0
      pnpm 版本: 10.4.1
   📥 步骤 1/5: 获取最新代码...
   ✅ 代码更新完成
   📦 步骤 2/5: 安装依赖...
   ✅ 依赖安装完成
   🗄️  步骤 3/5: 数据库迁移...
   ✅ 数据库检查完成
   🔨 步骤 4/5: 构建项目...
   ✅ 构建完成
   🔄 步骤 5/5: 重启服务...
   ✅ 服务重启完成
   🎉 部署成功！
   ```

---

## 常见问题

### Q1: 为什么交互式 shell 能用 pnpm，但脚本不行？

**A:** 交互式 shell 会加载 `.bashrc` 和 `.bash_profile`，但 SSH 非交互式执行命令时不会。我们通过以下方式解决：
- 使用 `bash -l -c` 强制使用 login shell
- 在脚本中手动 source 环境文件
- 搜索多个可能的 pnpm 位置

### Q2: update-standalone-v2.sh 和原来的有什么区别？

**A:** 新版本的改进：
- ✅ 自动搜索 7 个常见的 pnpm 位置
- ✅ 加载所有可能的环境配置文件
- ✅ 显示详细的诊断信息
- ✅ 自动回退到 npm（如果 pnpm 不可用）
- ✅ 更好的错误处理和提示
- ✅ 5 个清晰的部署步骤

### Q3: 如果还是不行怎么办？

**A:** 运行诊断脚本：
```bash
cd ~/Sen_Li/consensuslab
./find-pnpm.sh > pnpm-diagnostic.log
cat pnpm-diagnostic.log
```

将诊断日志发送给我，我会帮你分析问题。

---

## 文件清单

| 文件名 | 说明 |
|--------|------|
| `update-standalone.sh` | 原始部署脚本（有 PATH 问题）|
| `update-standalone-v2.sh` | 新版部署脚本（自动查找 pnpm）✅ |
| `find-pnpm.sh` | 诊断脚本（帮助找到 pnpm 位置）|
| `PNPM_FIX_GUIDE.md` | 本指南 |

---

## 总结

**推荐方案**: 使用 `update-standalone-v2.sh`

这是最简单可靠的解决方案，它会自动处理所有 PATH 问题。

**部署步骤（3步）**:
```bash
# 1. 上传新脚本
scp update-standalone-v2.sh ai4news@10.218.163.144:~/Sen_Li/consensuslab/

# 2. 设置权限
ssh ai4news@10.218.163.144 "chmod +x ~/Sen_Li/consensuslab/update-standalone-v2.sh"

# 3. 更新配置
# 编辑 deploy-interface/.env，修改:
# DEPLOY_SCRIPT=./update-standalone-v2.sh
```

重启部署服务，问题解决！🎉
