/**
 * Manus SDK (Standalone Version - Disabled)
 * 
 * This file is kept for compatibility but all functionality is disabled.
 * Standalone version uses direct authentication without Manus SDK.
 */

import type { Request } from "express";
import type { User } from "../../drizzle/schema";

class StandaloneSDK {
  async authenticateRequest(req: Request): Promise<User | null> {
    throw new Error("Manus SDK is not available in standalone version");
  }

  async exchangeCodeForToken(code: string, state: string): Promise<any> {
    throw new Error("Manus SDK is not available in standalone version");
  }

  async getUserInfo(accessToken: string): Promise<any> {
    throw new Error("Manus SDK is not available in standalone version");
  }

  async createSessionToken(openId: string): Promise<string> {
    throw new Error("Manus SDK is not available in standalone version");
  }
}

export const sdk = new StandaloneSDK();
