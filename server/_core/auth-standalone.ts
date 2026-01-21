/**
 * Standalone Authentication System
 * Simple admin-only authentication without OAuth dependency
 */

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import * as jwt from "jsonwebtoken";
import { users, type User, type UserRecord } from "../../drizzle/schema";
import { getDb } from "../db";
import { ENV } from "./env";

const ADMIN_USERNAME = ENV.adminUsername;
const ADMIN_PASSWORD = ENV.adminPassword;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@consensuslab.local";

function buildEnvAdminUser(): User {
  const now = new Date();
  return {
    id: 1,
    openId: ADMIN_USERNAME,
    name: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    loginMethod: "local",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

function sanitizeUser(record: UserRecord): User {
  const { passwordHash: _passwordHash, ...safeUser } = record;
  return safeUser;
}

async function findUserRecord(username: string): Promise<UserRecord | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(users).where(eq(users.openId, username)).limit(1);
  return result[0] ?? null;
}

/**
 * Ensure the default admin user exists in the database with a hashed password.
 */
export async function ensureAdminUserExists(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Auth] DATABASE_URL is not configured; default admin cannot be created");
    return;
  }

  const existing = await findUserRecord(ADMIN_USERNAME);
  if (!existing) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.insert(users).values({
      openId: ADMIN_USERNAME,
      name: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      loginMethod: "local",
      role: "admin",
      passwordHash: hashedPassword,
    });
    console.log("[Auth] Created default admin user from environment variables");
    return;
  }

  if (!existing.passwordHash) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await db.update(users).set({ passwordHash: hashedPassword }).where(eq(users.id, existing.id));
    console.log("[Auth] Injected password for existing admin user");
  }
}

/**
 * Verify user credentials against stored hashed passwords.
 * Falls back to environment variables if the database is unavailable.
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<User | null> {
  const record = await findUserRecord(username);

  if (record?.passwordHash) {
    const matches = await bcrypt.compare(password, record.passwordHash);
    if (!matches) {
      return null;
    }

    const signedInAt = new Date();
    const db = await getDb();
    if (db) {
      await db.update(users).set({ lastSignedIn: signedInAt }).where(eq(users.id, record.id));
    }

    return sanitizeUser({
      ...record,
      lastSignedIn: signedInAt,
    });
  }

  if (!record) {
    console.warn("[Auth] User not found in database, falling back to environment credentials");
  } else {
    console.warn("[Auth] User record has no passwordHash, falling back to environment credentials");
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return buildEnvAdminUser();
  }

  return null;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      openId: user.openId,
      name: user.name,
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
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization) return null;
  
  const parts = authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  
  return parts[1];
}
