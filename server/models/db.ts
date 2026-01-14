import { getDb } from "../db";
import {
  modelProviders,
  models,
  userApiKeys,
  agentModelConfigs,
  modelUsageLogs,
  type ModelProvider,
  type Model,
  type UserApiKey,
  type AgentModelConfig,
  type InsertModelUsageLog,
} from "../../drizzle/aiProviderSchema";
import { eq, and } from "drizzle-orm";
import { encryptApiKey, decryptApiKey } from "./encryption";

/**
 * Model Providers
 */
export async function getAllProviders(): Promise<ModelProvider[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(modelProviders).where(eq(modelProviders.isActive, true));
}

export async function getProviderById(id: number): Promise<ModelProvider | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(modelProviders).where(eq(modelProviders.id, id)).limit(1);
  return result[0];
}

export async function getProviderByName(name: string): Promise<ModelProvider | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(modelProviders).where(eq(modelProviders.name, name)).limit(1);
  return result[0];
}

/**
 * Models
 */
export async function getAllModels(): Promise<Model[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(models).where(eq(models.isActive, true));
}

export async function getModelById(id: number): Promise<Model | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(models).where(eq(models.id, id)).limit(1);
  return result[0];
}

export async function getModelsByProvider(providerId: number): Promise<Model[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(models)
    .where(and(eq(models.providerId, providerId), eq(models.isActive, true)));
}

/**
 * User API Keys
 */
export async function saveUserApiKey(
  userId: number,
  providerId: number,
  apiKey: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const encrypted = encryptApiKey(apiKey);

  // Check if key already exists
  const existing = await db
    .select()
    .from(userApiKeys)
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.providerId, providerId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing key
    await db
      .update(userApiKeys)
      .set({ apiKeyEncrypted: encrypted, isActive: true, updatedAt: new Date() })
      .where(eq(userApiKeys.id, existing[0].id));
  } else {
    // Insert new key
    await db.insert(userApiKeys).values({
      userId,
      providerId,
      apiKeyEncrypted: encrypted,
      isActive: true,
    });
  }
}

export async function getUserApiKey(
  userId: number,
  providerId: number
): Promise<string | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(userApiKeys)
    .where(
      and(
        eq(userApiKeys.userId, userId),
        eq(userApiKeys.providerId, providerId),
        eq(userApiKeys.isActive, true)
      )
    )
    .limit(1);

  if (result.length === 0) return null;

  return decryptApiKey(result[0].apiKeyEncrypted);
}

export async function getUserApiKeys(userId: number): Promise<
  Array<{
    id: number;
    providerId: number;
    providerName: string;
    providerDisplayName: string;
    isActive: boolean;
    createdAt: Date;
  }>
> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      id: userApiKeys.id,
      providerId: userApiKeys.providerId,
      providerName: modelProviders.name,
      providerDisplayName: modelProviders.displayName,
      isActive: userApiKeys.isActive,
      createdAt: userApiKeys.createdAt,
    })
    .from(userApiKeys)
    .leftJoin(modelProviders, eq(userApiKeys.providerId, modelProviders.id))
    .where(eq(userApiKeys.userId, userId));

  return result.map((r: any) => ({
    id: r.id,
    providerId: r.providerId,
    providerName: r.providerName || "",
    providerDisplayName: r.providerDisplayName || "",
    isActive: r.isActive,
    createdAt: r.createdAt,
  }));
}

export async function deleteUserApiKey(userId: number, providerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(userApiKeys)
    .set({ isActive: false })
    .where(and(eq(userApiKeys.userId, userId), eq(userApiKeys.providerId, providerId)));
}

/**
 * Agent Model Configs
 */
export async function setAgentModelConfig(
  sessionId: string,
  agentId: string,
  modelId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if config already exists
  const existing = await db
    .select()
    .from(agentModelConfigs)
    .where(and(eq(agentModelConfigs.sessionId, sessionId), eq(agentModelConfigs.agentId, agentId)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing config
    await db
      .update(agentModelConfigs)
      .set({ modelId })
      .where(eq(agentModelConfigs.id, existing[0].id));
  } else {
    // Insert new config
    await db.insert(agentModelConfigs).values({
      sessionId,
      agentId,
      modelId,
    });
  }
}

export async function getAgentModelConfig(
  sessionId: string,
  agentId: string
): Promise<AgentModelConfig | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(agentModelConfigs)
    .where(and(eq(agentModelConfigs.sessionId, sessionId), eq(agentModelConfigs.agentId, agentId)))
    .limit(1);

  return result[0];
}

export async function getSessionAgentModelConfigs(sessionId: string): Promise<AgentModelConfig[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(agentModelConfigs).where(eq(agentModelConfigs.sessionId, sessionId));
}

/**
 * Model Usage Logs
 */
export async function logModelUsage(log: InsertModelUsageLog): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(modelUsageLogs).values(log);
}

export async function getUserModelUsageStats(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // This would be a complex query with aggregations
  // For now, return basic stats
  const logs = await db
    .select()
    .from(modelUsageLogs)
    .where(eq(modelUsageLogs.userId, userId));

  const totalCalls = logs.length;
  const totalInputTokens = logs.reduce((sum: number, log: any) => sum + (log.inputTokens || 0), 0);
  const totalOutputTokens = logs.reduce((sum: number, log: any) => sum + (log.outputTokens || 0), 0);
  const totalCost = logs.reduce((sum: number, log: any) => sum + parseFloat(log.cost || "0"), 0);

  return {
    totalCalls,
    totalInputTokens,
    totalOutputTokens,
    totalCost,
  };
}
