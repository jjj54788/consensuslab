# ConsensusLab - Environment Variable Setup

## Overview

The application has been updated to read AI provider API keys **directly from environment variables** instead of querying the database. This simplifies deployment and configuration.

## Changes Made

### 1. Files Modified

- **server/_core/env.ts**: Added `openaiApiKey` and `anthropicApiKey` environment variable support
- **server/aiProviders.ts**: Added `getProviderFromEnv()` method to automatically read API keys from environment
- **server/debateEngine.ts**: Removed database queries, now uses environment variables
- **server/scoringEngine.ts**: Removed database queries, now uses environment variables

### 2. How It Works

The application now automatically:
1. Checks for `OPENAI_API_KEY` in environment variables
2. If found, uses OpenAI with the `gpt-4o-mini` model (default)
3. If not found, checks for `ANTHROPIC_API_KEY`
4. If found, uses Anthropic with the `claude-3-5-sonnet-20241022` model (default)
5. If neither is found, throws an error asking to configure API keys

### 3. Configuration

You have **two options** to set environment variables:

#### Option A: Using `.env` file (Development)

Create or edit the `.env` file in the project root:

```bash
# AI Provider API Keys
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here

# Other required variables
DATABASE_URL=mysql://jiangyi:jiangyi123@127.0.0.1:3306/jiangyi_db
JWT_SECRET=your-random-secret-key
API_KEY_ENCRYPTION_SECRET=another-random-secret
```

#### Option B: Using PM2 Environment Variables (Production)

Set environment variables directly in your PM2 configuration or system environment:

```bash
# Set in PM2 ecosystem config or use pm2 env command
export OPENAI_API_KEY="sk-proj-your-openai-api-key-here"
# OR
export ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key-here"

# Restart PM2 to apply
pm2 restart consensuslab
```

Or modify your PM2 ecosystem.config.js:

```javascript
module.exports = {
  apps: [{
    name: "consensuslab",
    script: "./dist/index.js",
    env: {
      NODE_ENV: "production",
      OPENAI_API_KEY: "sk-proj-your-openai-api-key-here",
      // ... other env vars
    }
  }]
}
```

### 4. Verification

After setting up, verify the configuration:

```bash
# Check that environment variable is set
echo $OPENAI_API_KEY

# Or check PM2 environment
pm2 env 0 | grep OPENAI_API_KEY

# Rebuild and restart
npm run build
pm2 restart consensuslab

# Check logs for confirmation
pm2 logs consensuslab
```

You should see log messages like:
```
[AIProviderService] Using OpenAI from OPENAI_API_KEY environment variable
```

### 5. Error Messages

If API keys are not configured, you'll see:
```
No AI provider API key found in environment variables.
Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file or environment.
```

## Deployment Steps

1. **Set environment variable** (choose one):
   - Add `OPENAI_API_KEY=sk-proj-...` to `.env` file
   - Or set system environment variable
   - Or configure in PM2

2. **Rebuild the application**:
   ```bash
   npm run build
   ```

3. **Restart the server**:
   ```bash
   pm2 restart consensuslab
   ```

4. **Verify logs**:
   ```bash
   pm2 logs consensuslab
   ```

## Benefits

✅ **Simplified deployment**: No need to configure through UI or seed database
✅ **Security**: API keys stored in environment, not database
✅ **Portability**: Easy to change providers by updating environment variables
✅ **No database dependency**: Works even if database is unavailable

## Notes

- The application will automatically detect which provider to use based on available API keys
- OpenAI is checked first, then Anthropic
- You only need to set **one** API key (either OpenAI or Anthropic)
- The old database-based configuration is no longer used

---

Last updated: 2026-01-21
