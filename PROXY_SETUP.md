# Proxy Configuration Guide

## Problem

The error you're getting indicates a network connectivity issue:
```
ConnectTimeoutError: Connect Timeout Error (attempted addresses: 172.66.0.243:443, 162.159.140.245:443, timeout: 10000ms)
code: 'UND_ERR_CONNECT_TIMEOUT'
```

This means your server **cannot directly reach OpenAI's API** (api.openai.com). This is common in:
- Corporate networks with firewalls
- Servers in China or regions with restricted access
- Environments requiring proxy for external connections

## Solution Implemented

I've added **proxy support** to the application with these changes:

### 1. Automatic Proxy Detection
The application now automatically reads proxy configuration from environment variables:
- `HTTPS_PROXY` (preferred for HTTPS connections)
- `https_proxy` (lowercase variant)
- `HTTP_PROXY` (fallback)
- `http_proxy` (lowercase fallback)

### 2. Increased Timeout
- Changed from **10 seconds** to **60 seconds** timeout
- Prevents premature timeout errors when using proxy

### 3. Files Modified
- `server/aiProviders.ts`: Added ProxyAgent configuration
- `.env`: Added proxy configuration examples

## How to Configure on Your Server

### Option 1: Set Environment Variables in PM2 (Recommended)

Create or edit your PM2 ecosystem file:

```bash
# Create ecosystem config
pm2 ecosystem
```

Edit `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: "consensuslab",
    script: "./dist/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 3000,

      // Your existing vars
      DATABASE_URL: "mysql://jiangyi:jiangyi123@127.0.0.1:3306/jiangyi_db",
      OPENAI_API_KEY: "sk-proj-your-actual-key-here",

      // ADD PROXY CONFIGURATION HERE
      HTTPS_PROXY: "http://your-proxy-server:port",
      // OR if your proxy needs authentication:
      // HTTPS_PROXY: "http://username:password@proxy-server:port",
    }
  }]
}
```

Then restart with the ecosystem file:
```bash
pm2 delete consensuslab
pm2 start ecosystem.config.js
pm2 save
```

### Option 2: Set Environment Variables Directly

```bash
# Method A: Export in shell (temporary, lost on reboot)
export HTTPS_PROXY="http://proxy-server:port"
export OPENAI_API_KEY="sk-proj-your-key-here"

# Method B: Add to PM2 directly
pm2 delete consensuslab
pm2 start dist/index.js --name consensuslab \
  --env HTTPS_PROXY=http://proxy-server:port \
  --env OPENAI_API_KEY=sk-proj-your-key-here
pm2 save
```

### Option 3: Use System-Wide Proxy

Edit your shell profile:
```bash
nano ~/.bashrc
# Add these lines:
export HTTPS_PROXY="http://proxy-server:port"
export HTTP_PROXY="http://proxy-server:port"

# Reload
source ~/.bashrc
```

Then restart PM2:
```bash
pm2 restart consensuslab
```

## Finding Your Proxy Server

### If you're in China or restricted region:
You might need a VPN or proxy service. Common setups:

1. **Local Proxy (Clash, V2Ray, etc.)**
   ```bash
   HTTPS_PROXY=http://127.0.0.1:7890
   ```

2. **Remote Proxy Server**
   ```bash
   HTTPS_PROXY=http://proxy.example.com:8080
   ```

3. **SOCKS5 Proxy**
   ```bash
   HTTPS_PROXY=socks5://127.0.0.1:1080
   ```

### Check if you already have a proxy:
```bash
# Check existing proxy environment variables
echo $HTTPS_PROXY
echo $HTTP_PROXY

# Check if you can reach OpenAI directly
curl -I --connect-timeout 10 https://api.openai.com
# If this fails, you need a proxy

# Test with proxy
curl -I --connect-timeout 10 -x http://proxy:port https://api.openai.com
# If this succeeds, use this proxy configuration
```

## Deployment Steps

### 1. Upload new dist/index.js to server
```bash
# From your Windows machine
scp D:\05 Codes\Other Codes\consensuslab\dist\index.js ai4news@huawei:~/Sen_Li/consensuslab/dist/

# OR rebuild on server
cd ~/Sen_Li/consensuslab
npm run build
```

### 2. Configure proxy (choose one method above)

### 3. Restart PM2
```bash
pm2 restart consensuslab
```

### 4. Verify in logs
```bash
pm2 logs consensuslab --lines 50
```

**What to look for:**
```
✅ SUCCESS:
[AIProviderService] Using proxy: http://127.0.0.1:7890
[AIProviderService] Using OpenAI from OPENAI_API_KEY environment variable
[DebateEngine] All agents finished thinking, 7/7 succeeded

❌ STILL FAILING:
ConnectTimeoutError: Connect Timeout Error
[DebateEngine] All agents finished thinking, 0/7 succeeded
```

## Troubleshooting

### Error: Still getting timeout
**Solution:** Check if your proxy is running and accessible
```bash
# Test proxy connectivity
curl -I -x http://proxy:port https://api.openai.com

# Check if proxy is listening
netstat -tuln | grep 7890  # Replace 7890 with your proxy port
```

### Error: Proxy authentication required
**Solution:** Include credentials in proxy URL
```bash
HTTPS_PROXY=http://username:password@proxy-server:port
```

### Error: Certificate verification failed
**Solution:** Some proxies require SSL certificate trust
```bash
# NOT RECOMMENDED for production, but for testing:
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Error: No proxy available
**Options:**
1. **Set up a local proxy:**
   - Install Clash, V2Ray, or similar
   - Configure it to run on 127.0.0.1:7890
   - Use `HTTPS_PROXY=http://127.0.0.1:7890`

2. **Use a cloud proxy service:**
   - Purchase proxy service (many available)
   - Use their proxy server address

3. **Deploy to different region:**
   - Consider deploying to AWS, Azure, or Google Cloud in US/Europe
   - These typically have direct OpenAI API access

## Alternative: Change to Anthropic Claude

If proxy setup is too complex, you can use Claude API instead (may have better connectivity in your region):

```bash
# Remove OpenAI key, add Claude key
unset OPENAI_API_KEY
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
pm2 restart consensuslab
```

The application will automatically use Claude if OpenAI is not available.

## Verify Configuration

After setup, verify everything is working:

```bash
# 1. Check environment variables
pm2 env 0 | grep -E "PROXY|OPENAI|ANTHROPIC"

# 2. Check logs for proxy detection
pm2 logs consensuslab | grep "proxy"

# 3. Start a test debate
# - Go to web interface
# - Create a new debate
# - Start discussion
# - Check if messages appear without errors

# 4. Check for successful API calls
pm2 logs consensuslab | grep "finished thinking"
# Should show: "All agents finished thinking, 7/7 succeeded"
```

## Security Notes

1. **Never commit proxy credentials to git**
2. **Use environment variables or ecosystem.config.js (gitignored)**
3. **For production, consider:**
   - Using a dedicated proxy server
   - Implementing rate limiting
   - Monitoring API usage
   - Setting up firewall rules

## Summary

The issue is your server cannot reach OpenAI API directly. The fix:

1. ✅ Code updated to support proxy (already done)
2. ⏳ You need to configure proxy settings
3. ⏳ Restart PM2 with proxy configuration
4. ✅ Timeout increased to 60 seconds

Once proxy is configured, the application will automatically route all OpenAI API calls through it.

---

**Need Help?**
- Check proxy logs: `pm2 logs consensuslab | grep -i error`
- Test connectivity: `curl -I -x http://proxy:port https://api.openai.com`
- Verify env vars: `pm2 env 0 | grep PROXY`
