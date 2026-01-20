/**
 * Seed script to initialize model providers and models
 * Run this once to populate the database with available AI models
 */

import { getDb } from "./db";

async function seedModels() {
  const db = await getDb();
  if (!db) {
    console.error("[Seed] Database not available");
    return;
  }

  const { modelProviders, models } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  console.log("[Seed] Starting model providers and models initialization...");

  // Check if providers already exist
  const existingProviders = await db.select().from(modelProviders);
  
  if (existingProviders.length > 0) {
    console.log("[Seed] Model providers already initialized, skipping...");
    return;
  }

  // Insert OpenAI provider
  const openaiResult = await db.insert(modelProviders).values({
    name: "openai",
    displayName: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    isActive: true,
  });
  const openaiId = openaiResult[0].insertId;

  // Insert Claude provider
  const claudeResult = await db.insert(modelProviders).values({
    name: "claude",
    displayName: "Claude (Anthropic)",
    baseUrl: "https://api.anthropic.com/v1",
    isActive: true,
  });
  const claudeId = claudeResult[0].insertId;

  console.log(`[Seed] Created providers: OpenAI (${openaiId}), Claude (${claudeId})`);

  // Insert OpenAI models
  await db.insert(models).values([
    {
      providerId: openaiId,
      modelName: "gpt-4o",
      displayName: "GPT-4o",
      description: "最新的GPT-4优化版本，速度更快，成本更低",
      maxTokens: 128000,
      costPer1kInput: "0.0025",
      costPer1kOutput: "0.01",
      isActive: true,
    },
    {
      providerId: openaiId,
      modelName: "gpt-4o-mini",
      displayName: "GPT-4o Mini",
      description: "轻量级版本，性价比最高",
      maxTokens: 128000,
      costPer1kInput: "0.00015",
      costPer1kOutput: "0.0006",
      isActive: true,
    },
    {
      providerId: openaiId,
      modelName: "gpt-4-turbo",
      displayName: "GPT-4 Turbo",
      description: "高性能版本，适合复杂任务",
      maxTokens: 128000,
      costPer1kInput: "0.01",
      costPer1kOutput: "0.03",
      isActive: true,
    },
  ]);

  // Insert Claude models
  await db.insert(models).values([
    {
      providerId: claudeId,
      modelName: "claude-3-5-sonnet-20241022",
      displayName: "Claude 3.5 Sonnet",
      description: "最新的Claude 3.5，平衡性能和成本",
      maxTokens: 200000,
      costPer1kInput: "0.003",
      costPer1kOutput: "0.015",
      isActive: true,
    },
    {
      providerId: claudeId,
      modelName: "claude-3-opus-20240229",
      displayName: "Claude 3 Opus",
      description: "最强大的Claude模型，适合最复杂的任务",
      maxTokens: 200000,
      costPer1kInput: "0.015",
      costPer1kOutput: "0.075",
      isActive: true,
    },
    {
      providerId: claudeId,
      modelName: "claude-3-haiku-20240307",
      displayName: "Claude 3 Haiku",
      description: "最快速的Claude模型，适合简单任务",
      maxTokens: 200000,
      costPer1kInput: "0.00025",
      costPer1kOutput: "0.00125",
      isActive: true,
    },
  ]);

  console.log("[Seed] Model providers and models initialization complete.");
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedModels()
    .then(() => {
      console.log("[Seed] Done");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[Seed] Error:", error);
      process.exit(1);
    });
}

export { seedModels };
