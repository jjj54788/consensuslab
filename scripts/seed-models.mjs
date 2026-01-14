import { drizzle } from "drizzle-orm/mysql2";
import { modelProviders, models } from "../drizzle/aiProviderSchema.js";
import { eq, and } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

async function seedModels() {
  console.log("[Seed] Starting model providers and models initialization...");

  try {
    // Insert model providers
    const providers = [
      {
        name: "openai",
        displayName: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        description: "OpenAI GPT models including GPT-4 and GPT-3.5",
        isActive: true,
      },
      {
        name: "claude",
        displayName: "Claude (Anthropic)",
        baseUrl: "https://api.anthropic.com/v1",
        description: "Anthropic Claude 3 models",
        isActive: true,
      },
    ];

    console.log("[Seed] Inserting model providers...");
    for (const provider of providers) {
      const existing = await db
        .select()
        .from(modelProviders)
        .where((t) => eq(t.name, provider.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(modelProviders).values(provider);
        console.log(`[Seed] Inserted provider: ${provider.displayName}`);
      } else {
        console.log(`[Seed] Provider "${provider.displayName}" already exists, skipping...`);
      }
    }

    // Get provider IDs
    const openaiProvider = await db
      .select()
      .from(modelProviders)
      .where(eq(modelProviders.name, "openai"))
      .limit(1);
    const claudeProvider = await db
      .select()
      .from(modelProviders)
      .where(eq(modelProviders.name, "claude"))
      .limit(1);

    if (openaiProvider.length === 0 || claudeProvider.length === 0) {
      throw new Error("Failed to get provider IDs");
    }

    const openaiId = openaiProvider[0].id;
    const claudeId = claudeProvider[0].id;

    // Insert models
    const modelsData = [
      // OpenAI models
      {
        providerId: openaiId,
        modelName: "gpt-4",
        displayName: "GPT-4",
        description: "Most capable GPT-4 model, great for complex tasks",
        maxTokens: 8192,
        costPer1kInput: "0.03",
        costPer1kOutput: "0.06",
        isActive: true,
      },
      {
        providerId: openaiId,
        modelName: "gpt-4-turbo",
        displayName: "GPT-4 Turbo",
        description: "Faster and cheaper GPT-4 variant with 128k context",
        maxTokens: 128000,
        costPer1kInput: "0.01",
        costPer1kOutput: "0.03",
        isActive: true,
      },
      {
        providerId: openaiId,
        modelName: "gpt-3.5-turbo",
        displayName: "GPT-3.5 Turbo",
        description: "Fast and cost-effective model for simple tasks",
        maxTokens: 4096,
        costPer1kInput: "0.0015",
        costPer1kOutput: "0.002",
        isActive: true,
      },
      // Claude models
      {
        providerId: claudeId,
        modelName: "claude-3-opus-20240229",
        displayName: "Claude 3 Opus",
        description: "Most powerful Claude model for complex analysis",
        maxTokens: 4096,
        costPer1kInput: "0.015",
        costPer1kOutput: "0.075",
        isActive: true,
      },
      {
        providerId: claudeId,
        modelName: "claude-3-sonnet-20240229",
        displayName: "Claude 3 Sonnet",
        description: "Balanced performance and cost",
        maxTokens: 4096,
        costPer1kInput: "0.003",
        costPer1kOutput: "0.015",
        isActive: true,
      },
      {
        providerId: claudeId,
        modelName: "claude-3-haiku-20240307",
        displayName: "Claude 3 Haiku",
        description: "Fastest and most compact Claude model",
        maxTokens: 4096,
        costPer1kInput: "0.00025",
        costPer1kOutput: "0.00125",
        isActive: true,
      },
    ];

    console.log("[Seed] Inserting models...");
    for (const model of modelsData) {
      const existing = await db
        .select()
        .from(models)
        .where(
          and(
            eq(models.providerId, model.providerId),
            eq(models.modelName, model.modelName)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(models).values(model);
        console.log(`[Seed] Inserted model: ${model.displayName}`);
      } else {
        console.log(`[Seed] Model "${model.displayName}" already exists, skipping...`);
      }
    }

    console.log("[Seed] Model initialization complete!");
  } catch (error) {
    console.error("[Seed] Error during model initialization:", error);
    throw error;
  }
}

// Run seed
seedModels()
  .then(() => {
    console.log("[Seed] Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[Seed] Failed:", error);
    process.exit(1);
  });
