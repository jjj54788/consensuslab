# Deploy Interface Bug Fixes

## Issues Encountered

### Issue 1: Flask Context Error in SSE Stream
**Error:**
```
RuntimeError: Working outside of application context.
This typically means that you attempted to use functionality that needed
the current application. To solve this, set up an application context with app.app_context().
```

**Root Cause:**
- The `/api/logs` endpoint uses Server-Sent Events (SSE) with a generator function
- Inside the generator, `jsonify()` was used to serialize log entries
- `jsonify()` requires a Flask application context, which is not available in the generator

**Fix Applied:**
```python
# BEFORE (caused error)
yield f"data: {jsonify(log_entry).get_data(as_text=True)}\n\n"

# AFTER (fixed)
yield f"data: {json.dumps(log_entry)}\n\n"
```

**Explanation:**
- Replaced `jsonify()` with `json.dumps()`
- `json.dumps()` is a standard Python function that doesn't require Flask context
- Both produce the same JSON output

---

### Issue 2: pnpm Command Not Found
**Error:**
```
./update-standalone.sh: line 10: pnpm: command not found
脚本执行失败 (退出码: 127)
```

**Root Cause:**
- When SSH executes commands in non-interactive mode, it uses a minimal shell environment
- The shell doesn't load `.bashrc` or `.bash_profile`
- Therefore, pnpm (installed via npm or nvm) is not in the PATH
- Even though `pnpm --version` works in an interactive shell, it fails via SSH

**Fix Applied - Solution 1 (Python Script):**
```python
# BEFORE
command = f"cd {DEPLOY_PATH} && {DEPLOY_SCRIPT}"

# AFTER
command = f"bash -l -c 'cd {DEPLOY_PATH} && {DEPLOY_SCRIPT}'"
```

**Explanation:**
- `bash -l` starts a login shell
- Login shells load `.bash_profile` and `.bashrc`
- This ensures pnpm and other user-installed tools are in PATH

**Fix Applied - Solution 2 (Bash Script):**
```bash
# Added to update-standalone.sh

# Source environment to get pnpm in PATH
if [ -f "$HOME/.bashrc" ]; then
    source "$HOME/.bashrc"
fi

if [ -f "$HOME/.bash_profile" ]; then
    source "$HOME/.bash_profile"
fi

# Check if pnpm is available, fallback to npm
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: pnpm 未找到"
    echo "尝试使用 npm 作为替代..."
    if command -v npm &> /dev/null; then
        alias pnpm='npm'
    else
        echo "❌ npm 也未找到，请安装 Node.js 和 pnpm"
        exit 1
    fi
fi
```

**Explanation:**
- Script now explicitly sources bash profile files
- Checks if pnpm is available
- Falls back to npm if pnpm is not found
- Provides clear error messages

---

## Files Modified

### 1. `deploy-interface/deploy.py`
**Changes:**
- Added `import json`
- Changed SSE log streaming from `jsonify()` to `json.dumps()`
- Modified SSH command to use `bash -l -c` for login shell

**Lines Changed:**
- Line 7: Added `import json`
- Line 195: Changed `jsonify(log_entry).get_data(as_text=True)` to `json.dumps(log_entry)`
- Line 97: Changed command format to use `bash -l -c`

### 2. `update-standalone.sh` (Created)
**New Features:**
- Automatic environment sourcing
- pnpm availability check with npm fallback
- 4-step deployment process with clear progress indicators
- Error handling with `set -e`
- PM2 restart with fallback to start

**Deployment Steps:**
1. Pull latest code from git
2. Install dependencies with pnpm
3. Build project
4. Restart PM2

### 3. `deploy-interface/.env` and `.env.example`
**Changes:**
- Updated `DEPLOY_SCRIPT` from `./update-state-standalone.sh` to `./update-standalone.sh`
- Fixed script name typo

---

## Testing After Fix

### Test 1: SSE Log Streaming
**Expected Result:**
- No Flask context errors in logs
- Real-time logs appear in browser
- Smooth log streaming without interruptions

**Verification:**
```bash
# Check server logs for errors
# Should NOT see "RuntimeError: Working outside of application context"
```

### Test 2: pnpm Execution
**Expected Result:**
- Deployment script finds pnpm successfully
- All commands execute without "command not found" errors
- Exit code 0 (success)

**Verification:**
```bash
# Check deployment logs
# Should see:
# ✅ 代码更新完成
# ✅ 依赖安装完成
# ✅ 构建完成
# ✅ PM2 重启完成
```

---

## How the Fixes Work Together

```
┌──────────────────────────────────────────────────────────┐
│ User clicks "开始部署" button                             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Flask Backend: POST /api/deploy                          │
│ - Starts SSH connection                                  │
│ - Uses: bash -l -c 'cd path && ./script.sh'             │
│   (FIX 1: Login shell loads full environment)            │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ SSH Connection to Server                                 │
│ - Bash login shell sources .bashrc/.bash_profile         │
│ - pnpm and other tools now in PATH                       │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Execute: update-standalone.sh                            │
│ - Script sources environment files again (redundancy)    │
│ - Checks for pnpm, falls back to npm if needed          │
│   (FIX 2: Script-level environment handling)             │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Deployment Steps Execute                                 │
│ 1. git pull origin standalone                            │
│ 2. pnpm install --frozen-lockfile                        │
│ 3. pnpm run build                                        │
│ 4. pm2 restart consensuslab                              │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Logs Stream Back via SSE                                 │
│ - Uses json.dumps() instead of jsonify()                 │
│   (FIX 3: No Flask context needed)                       │
│ - Real-time updates to browser                           │
└──────────────────────────────────────────────────────────┘
```

---

## Deployment Instructions

### Step 1: Upload Fixed Files to Server

```bash
# From your local machine
cd D:\05 Codes\Other Codes\consensuslab

# Upload deploy.py
scp deploy-interface/deploy.py ai4news@10.218.163.144:~/Sen_Li/consensuslab/deploy-interface/

# Upload update-standalone.sh
scp update-standalone.sh ai4news@10.218.163.144:~/Sen_Li/consensuslab/

# Make script executable
ssh ai4news@10.218.163.144
chmod +x ~/Sen_Li/consensuslab/update-standalone.sh
```

### Step 2: Restart Deploy Interface

```bash
# On the server
cd ~/Sen_Li/consensuslab/deploy-interface

# Stop current process (Ctrl+C if running in foreground)
# Or kill the process if running in background

# Restart
python3 deploy.py
```

### Step 3: Test Deployment

1. Open browser: `http://your-server-ip:5000`
2. Click "开始部署" button
3. Watch logs - should see no errors
4. Verify success message appears

---

## Why These Fixes Work

### SSH Non-Interactive Shell Environment

When SSH runs a command like:
```bash
ssh user@host "command"
```

It uses a **non-interactive non-login shell** which:
- Does NOT read `.bashrc`
- Does NOT read `.bash_profile`
- Uses minimal PATH (usually just `/usr/bin:/bin`)

By using `bash -l -c`, we force a **login shell** which:
- DOES read `.bash_profile`
- DOES read `.bashrc` (if called from profile)
- Loads full user environment
- Includes all user-installed tools (nvm, pnpm, etc.)

### Flask Context in Generators

Flask's `jsonify()` creates a Response object that requires:
- Current application context (`current_app`)
- Request context
- Active Flask request

Generator functions in SSE run **outside** the request lifecycle:
- The HTTP response has already been sent
- Request context is no longer active
- `current_app` is not available

Using `json.dumps()`:
- Standard library function
- No Flask dependencies
- Works anywhere in Python
- Same JSON output

---

## Alternative Solutions (Not Used)

### For pnpm Issue:

**Alternative 1: Use full path**
```bash
/home/ai4news/.local/share/pnpm/pnpm install
```
❌ Hard-coded path, not portable

**Alternative 2: Add to PATH in script**
```bash
export PATH="$HOME/.local/share/pnpm:$PATH"
```
❌ Path location varies by installation

**Alternative 3: Use npm instead**
```bash
npm install && npm run build
```
❌ Loses pnpm-specific features

**Our Solution: Source environment + fallback** ✅
- Portable across systems
- Handles multiple installation methods
- Fallback to npm if pnpm unavailable
- Clear error messages

### For Flask Context Issue:

**Alternative 1: Use app.app_context()**
```python
with app.app_context():
    yield f"data: {jsonify(log_entry).get_data(as_text=True)}\n\n"
```
❌ Doesn't work in generators, context exits immediately

**Alternative 2: Create new app instance**
❌ Overhead, unnecessary complexity

**Our Solution: Use json.dumps()** ✅
- Simple, efficient
- No context needed
- Standard Python

---

## Summary

✅ **Fixed SSE streaming** - Replaced `jsonify()` with `json.dumps()`
✅ **Fixed pnpm PATH** - Use login shell with `bash -l -c`
✅ **Added fallback** - Script sources environment and falls back to npm
✅ **Better errors** - Clear messages when tools are missing
✅ **Created script** - Complete `update-standalone.sh` with 4-step process

**Status:** Ready for deployment
**Tested:** ⏳ Awaiting user testing
**Documentation:** Complete

---

**Date:** 2026-01-23
**Version:** 1.0.1
**Author:** ConsensusLab Dev Team
