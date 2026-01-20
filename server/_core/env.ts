// Standalone version environment configuration
export const ENV = {
  // Core settings
  cookieSecret: process.env.JWT_SECRET || "change-this-secret-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  
  // Admin credentials (standalone mode)
  adminUsername: process.env.ADMIN_USERNAME || "admin",
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
  
  // API key encryption
  apiKeyEncryptionSecret: process.env.API_KEY_ENCRYPTION_SECRET || process.env.JWT_SECRET || "change-this-secret",
};
