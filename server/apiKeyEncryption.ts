/**
 * API Key Encryption/Decryption Utilities
 * Uses AES-256-GCM for secure encryption
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment or generate a default one
 * In production, this should be set via environment variable
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET;
  
  if (!key) {
    throw new Error("API_KEY_ENCRYPTION_SECRET or JWT_SECRET must be set in environment");
  }
  
  // Derive a 32-byte key from the secret
  return crypto.pbkdf2Sync(key, "api-key-salt", 100000, 32, "sha256");
}

/**
 * Encrypt an API key
 * @param apiKey - The plain text API key to encrypt
 * @returns The encrypted API key in format: iv:authTag:encrypted
 */
export function encryptApiKey(apiKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt an API key
 * @param encryptedApiKey - The encrypted API key in format: iv:authTag:encrypted
 * @returns The decrypted plain text API key
 */
export function decryptApiKey(encryptedApiKey: string): string {
  const key = getEncryptionKey();
  
  const parts = encryptedApiKey.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted API key format");
  }
  
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

/**
 * Mask an API key for display (show only first and last 4 characters)
 * @param apiKey - The API key to mask
 * @returns Masked API key (e.g., "sk-1234...5678")
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return "*".repeat(apiKey.length);
  }
  
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  
  return `${start}${"*".repeat(Math.min(apiKey.length - 8, 20))}${end}`;
}
