/**
 * OAuth Routes (Standalone Version - Disabled)
 * 
 * Standalone version uses simple admin login instead of OAuth.
 * This file is kept for compatibility but all routes are disabled.
 */

import type { Express } from "express";

export function registerOAuthRoutes(app: Express) {
  // Standalone version: OAuth is disabled
  // Authentication is handled by /api/trpc/auth.login
  console.log("[OAuth] Standalone mode: OAuth routes disabled");
}
