import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { seedAgents } from "../seedAgents";
import { seedPresetTemplates } from "../seedTemplates";
import { setupWebSocket } from "../websocket";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Log environment configuration at startup
  console.log("\n========================================");
  console.log("ConsensusLab Server Starting...");
  console.log("========================================");
  console.log("Environment Configuration:");
  console.log(`- NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  console.log(`- PORT: ${process.env.PORT || "3000"}`);
  console.log(`- DATABASE_URL: ${process.env.DATABASE_URL ? "✓ Configured" : "✗ Missing"}`);
  console.log("\nAI Provider Configuration:");
  console.log(`- OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? "✓ Configured" : "✗ Not set"}`);
  console.log(`- ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? "✓ Configured" : "✗ Not set"}`);
  console.log(`- BUILT_IN_FORGE_API_KEY: ${process.env.BUILT_IN_FORGE_API_KEY ? "✓ Configured" : "✗ Not set"}`);

  const hasAnyProvider = !!(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.BUILT_IN_FORGE_API_KEY);
  if (hasAnyProvider) {
    console.log("\n✓ At least one AI provider is configured");
  } else {
    console.log("\n⚠ WARNING: No AI provider configured!");
    console.log("  Please add one of the following to your .env file:");
    console.log("  - OPENAI_API_KEY=sk-...");
    console.log("  - ANTHROPIC_API_KEY=sk-ant-...");
    console.log("  - BUILT_IN_FORGE_API_KEY=...");
  }
  console.log("========================================\n");

  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  // Setup WebSocket
  setupWebSocket(server);

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Initialize preset agents
    await seedAgents();
    // Initialize preset templates
    await seedPresetTemplates();
  });
}

startServer().catch(console.error);
