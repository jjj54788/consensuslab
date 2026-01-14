import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * AI Provider Configurations table
 * Stores user's AI provider API keys and settings
 */
export const aiProviderConfigs = mysqlTable("ai_provider_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  provider: mysqlEnum("provider", ["manus", "openai", "anthropic", "custom"])
    .notNull()
    .default("manus"),
  name: varchar("name", { length: 100 }).notNull(), // User-friendly name
  apiKey: text("apiKey"), // Encrypted API key
  baseURL: text("baseURL"), // Custom base URL
  model: varchar("model", { length: 100 }), // Model name
  isActive: int("isActive").notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIProviderConfig = typeof aiProviderConfigs.$inferSelect;
export type InsertAIProviderConfig = typeof aiProviderConfigs.$inferInsert;

/**
 * Model providers table
 * Stores AI model providers (OpenAI, Claude, Qwen, etc.)
 */
export const modelProviders = mysqlTable("model_providers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // 'openai', 'claude', 'qwen', 'ernie'
  displayName: varchar("displayName", { length: 100 }).notNull(), // 'OpenAI', 'Claude', '通义千问'
  baseUrl: varchar("baseUrl", { length: 255 }), // API base URL
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModelProvider = typeof modelProviders.$inferSelect;
export type InsertModelProvider = typeof modelProviders.$inferInsert;

/**
 * Models table
 * Stores specific AI models with their configurations
 */
export const models = mysqlTable("models", {
  id: int("id").autoincrement().primaryKey(),
  providerId: int("providerId").notNull(), // Foreign key to model_providers
  modelName: varchar("modelName", { length: 100 }).notNull(), // 'gpt-4', 'claude-3-opus'
  displayName: varchar("displayName", { length: 100 }).notNull(), // 'GPT-4', 'Claude 3 Opus'
  description: text("description"),
  maxTokens: int("maxTokens").default(4096).notNull(),
  costPer1kInput: decimal("costPer1kInput", { precision: 10, scale: 6 }), // Cost per 1K input tokens (USD)
  costPer1kOutput: decimal("costPer1kOutput", { precision: 10, scale: 6 }), // Cost per 1K output tokens (USD)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Model = typeof models.$inferSelect;
export type InsertModel = typeof models.$inferInsert;

/**
 * User API keys table
 * Stores encrypted API keys for each user and provider
 */
export const userApiKeys = mysqlTable("user_api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Foreign key to users
  providerId: int("providerId").notNull(), // Foreign key to model_providers
  apiKeyEncrypted: text("apiKeyEncrypted").notNull(), // Encrypted API key
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserApiKey = typeof userApiKeys.$inferSelect;
export type InsertUserApiKey = typeof userApiKeys.$inferInsert;

/**
 * Agent model configs table
 * Stores model configuration for each agent in a debate session
 */
export const agentModelConfigs = mysqlTable("agent_model_configs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // Foreign key to debate_sessions
  agentId: varchar("agentId", { length: 64 }).notNull(), // Foreign key to agents
  modelId: int("modelId").notNull(), // Foreign key to models
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentModelConfig = typeof agentModelConfigs.$inferSelect;
export type InsertAgentModelConfig = typeof agentModelConfigs.$inferInsert;

/**
 * Model usage logs table
 * Tracks all model API calls for cost analysis and monitoring
 */
export const modelUsageLogs = mysqlTable("model_usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }),
  modelId: int("modelId").notNull(),
  agentId: varchar("agentId", { length: 64 }),
  inputTokens: int("inputTokens"),
  outputTokens: int("outputTokens"),
  cost: decimal("cost", { precision: 10, scale: 6 }), // Total cost for this call (USD)
  latencyMs: int("latencyMs"), // Response latency in milliseconds
  status: varchar("status", { length: 20 }).notNull(), // 'success' or 'error'
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModelUsageLog = typeof modelUsageLogs.$inferSelect;
export type InsertModelUsageLog = typeof modelUsageLogs.$inferInsert;
