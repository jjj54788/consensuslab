# Rebuild and Restart Instructions

## The Issue

You're seeing the error "No AI provider configured" because the server is running **old compiled code** from before the environment variable fallback was added. The server needs to be rebuilt with the new code.

## Quick Fix

### Step 1: Stop the Server

```bash
# If running with pm2:
pm2 stop consensuslab

# Or if running directly:
# Press Ctrl+C in the terminal where the server is running
```

### Step 2: Check Your .env File

Make sure you have **at least one** API key configured in your `.env` file:

```bash
# Option 1: OpenAI (Recommended - most reliable)
OPENAI_API_KEY=sk-your_actual_openai_key_here

# OR Option 2: Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your_actual_anthropic_key_here

# OR Option 3: Built-in Manus AI
BUILT_IN_FORGE_API_KEY=your_manus_key_here
```

**Important:** Replace `sk-your_actual_openai_key_here` with your real API key!

### Step 3: Rebuild the Project

```bash
# Navigate to project directory
cd /home/ai4news/consensuslab

# Rebuild the project
pnpm build
```

This will compile the new code that includes the environment variable fallback logic.

### Step 4: Restart the Server

```bash
# If using pm2:
pm2 restart consensuslab

# Or if running directly:
pnpm start
```

### Step 5: Verify Configuration

When the server starts, you should see a startup banner like this:

```
========================================
ConsensusLab Server Starting...
========================================
Environment Configuration:
- NODE_ENV: production
- PORT: 3000
- DATABASE_URL: ✓ Configured

AI Provider Configuration:
- OPENAI_API_KEY: ✓ Configured
- ANTHROPIC_API_KEY: ✗ Not set
- BUILT_IN_FORGE_API_KEY: ✗ Not set

✓ At least one AI provider is configured
========================================
```

**Look for:** "✓ At least one AI provider is configured"

If you see "⚠ WARNING: No AI provider configured!" then your .env file is not being loaded correctly.

### Step 6: Test the Discussion

1. Go to your website
2. Click "启动协商会议" (Start Discussion)
3. Select agents and topic
4. Click "开始讨论" (Start Discussion)
5. Check the server logs - you should see:
   ```
   [DebateEngine] No user provider configured, checking environment variables...
   [DebateEngine] ✓ Using OpenAI API key from OPENAI_API_KEY environment variable
   ```

## Troubleshooting

### Problem: Still seeing "No AI provider configured"

**Cause:** Your .env file might not be in the right location or not being loaded.

**Solutions:**

1. **Check .env file location:**
   ```bash
   ls -la /home/ai4news/consensuslab/.env
   ```
   The file should exist in the project root directory.

2. **Check .env file contents:**
   ```bash
   cat /home/ai4news/consensuslab/.env | grep API_KEY
   ```
   You should see your API key (it will show the actual key).

3. **Verify environment variable is loaded:**
   ```bash
   # Check if pm2 is loading env vars
   pm2 env consensuslab | grep API_KEY
   ```

4. **Make sure .env file has no extra spaces:**
   ```bash
   # Correct format:
   OPENAI_API_KEY=sk-abc123

   # Wrong format (has spaces):
   OPENAI_API_KEY = sk-abc123
   ```

### Problem: Dropdown still empty

**Cause:** Frontend changes need browser cache clear.

**Solution:**
1. Hard refresh the page: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
2. Or clear browser cache
3. Or try in incognito/private mode

### Problem: Can't rebuild - "pnpm: command not found"

**Solution:**
```bash
# Install pnpm
npm install -g pnpm

# Then rebuild
pnpm build
```

## Get Your API Keys

### OpenAI (Recommended)
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Add to .env: `OPENAI_API_KEY=sk-your_key_here`

### Anthropic Claude
1. Go to: https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy the key (starts with `sk-ant-`)
4. Add to .env: `ANTHROPIC_API_KEY=sk-ant-your_key_here`

## Still Having Issues?

Check the server logs for detailed error messages:

```bash
# If using pm2:
pm2 logs consensuslab

# Or check the console output if running directly
```

Look for lines starting with:
- `[DebateEngine]` - Shows AI provider being used
- `✓` or `✗` - Shows what's configured

---

**Need more help?** Check the [GitHub Issues](https://github.com/jjj54788/consensuslab/issues) or create a new issue with your error logs.
