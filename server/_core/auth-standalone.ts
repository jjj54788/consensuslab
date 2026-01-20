/**
 * Standalone Authentication System
 * Simple admin-only authentication without OAuth dependency
 */

import * as jwt from "jsonwebtoken";
import { ENV } from "./env";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin";
}

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@consensuslab.local";

/**
 * Verify admin credentials
 */
export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    ENV.cookieSecret,
    { expiresIn: "30d" }
  );
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): User | null {
  try {
    const decoded = jwt.verify(token, ENV.cookieSecret) as User;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Get admin user object
 */
export function getAdminUser(): User {
  return {
    id: "admin",
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    role: "admin",
  };
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization) return null;
  
  const parts = authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  
  return parts[1];
}
