import { getDb } from "./db";
import { debateTemplates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Preset template configurations
 */
const PRESET_TEMPLATES = [
  {
    id: "preset-quick-debate",
    name: "快速讨论",
    description: "适合快速讨论，从支持、反对和中立三个角度快速分析话题。3个智能体，5轮讨论，约5-10分钟完成。",
    agentIds: ["supporter", "opponent", "neutral"],
    rounds: 5,
    isSystem: 1,
    userId: null,
  },
  {
    id: "preset-deep-analysis",
    name: "深度分析",
    description: "深入探讨复杂话题，结合多角度观点和专业分析，提供创新见解。6个智能体，10轮讨论，约15-20分钟完成。",
    agentIds: ["supporter", "opponent", "neutral", "critic", "innovator", "logic_scorer"],
    rounds: 10,
    isSystem: 1,
    userId: null,
  },
  {
    id: "preset-comprehensive-evaluation",
    name: "全面评估",
    description: "全方位分析重要决策，包含完整的观点论证、质量评分和专业分析。全部8个智能体，15轮讨论，约25-30分钟完成。",
    agentIds: [
      "supporter",
      "opponent",
      "neutral",
      "logic_scorer",
      "innovation_scorer",
      "expression_scorer",
      "critic",
      "innovator",
    ],
    rounds: 15,
    isSystem: 1,
    userId: null,
  },
];

/**
 * Initialize preset templates in the database
 * Only creates templates if they don't already exist
 */
export async function seedPresetTemplates() {
  console.log("[Seed] Initializing preset templates...");

  for (const template of PRESET_TEMPLATES) {
    try {
      // Check if template already exists
      const db = await getDb();
      if (!db) {
        console.error("[Seed] Database not available");
        return;
      }

      const existing = await db
        .select()
        .from(debateTemplates)
        .where(eq(debateTemplates.id, template.id))
        .limit(1);

      if (existing.length > 0) {
        console.log(`[Seed] Template "${template.name}" already exists, skipping...`);
        continue;
      }

      // Insert new preset template
      await db!.insert(debateTemplates).values(template);
      console.log(`[Seed] ✓ Created preset template: "${template.name}"`);
    } catch (error) {
      console.error(`[Seed] ✗ Failed to create template "${template.name}":`, error);
    }
  }

  console.log("[Seed] Preset templates initialization complete.");
}

/**
 * Remove all preset templates (for development/testing)
 */
export async function removePresetTemplates() {
  console.log("[Seed] Removing all preset templates...");

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Seed] Database not available");
      return;
    }
    await db.delete(debateTemplates).where(eq(debateTemplates.isSystem, 1));
    console.log("[Seed] ✓ All preset templates removed.");
  } catch (error) {
    console.error("[Seed] ✗ Failed to remove preset templates:", error);
  }
}
