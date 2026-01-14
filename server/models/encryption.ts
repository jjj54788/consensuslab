import crypto from "crypto";
import { ENV } from "../_core/env";

/**
 * Encryption utilities for API keys
 * Uses AES-256-GCM for secure encryption
 */

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits

// Generate encryption key from JWT_SECRET
function getEncryptionKey(): Buffer {
  const hash = crypto.createHash("sha256");
  hash.update(ENV.cookieSecret);
  return hash.digest().slice(0, KEY_LENGTH);
}

/**
 * Encrypt an API key
 */
export function encryptApiKey(apiKey: string): string {
  const iv = crypto.randomBytes(16);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an API key
 */
export function decryptApiKey(encrypted: string): string {
  const parts = encrypted.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted API key format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedText = parts[2];

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
