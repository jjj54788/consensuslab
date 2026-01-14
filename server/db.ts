import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, agents, debateSessions, messages, InsertDebateSession, InsertMessage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Agent queries
export async function getAllAgents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents);
}

export async function getAgentById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Debate session queries
export async function createDebateSession(session: InsertDebateSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(debateSessions).values(session);
  return session;
}

export async function getDebateSessionById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(debateSessions).where(eq(debateSessions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateDebateSession(id: string, updates: Partial<InsertDebateSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(debateSessions).set(updates).where(eq(debateSessions.id, id));
}

export async function getUserDebateSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(debateSessions).where(eq(debateSessions.userId, userId)).orderBy(desc(debateSessions.createdAt));
}

// Message queries
export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(messages).values(message);
  return message;
}

export async function getSessionMessages(sessionId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(messages.createdAt);
}

export async function updateMessage(id: string, updates: Partial<InsertMessage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(messages).set(updates).where(eq(messages.id, id));
}

// ==================== Debate Templates ====================

export async function createDebateTemplate(template: {
  id: string;
  userId: string;
  name: string;
  description?: string;
  agentIds: string[];
  rounds: number;
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { debateTemplates } = await import("../drizzle/schema");
  await db.insert(debateTemplates).values({
    id: template.id,
    userId: template.userId,
    name: template.name,
    description: template.description || null,
    agentIds: template.agentIds,
    rounds: template.rounds,
  });
}

export async function getUserDebateTemplates(userId: string) {
  const db = await getDb();
  if (!db) return [];

  const { debateTemplates } = await import("../drizzle/schema");
  const { eq, desc } = await import("drizzle-orm");
  
  return await db
    .select()
    .from(debateTemplates)
    .where(eq(debateTemplates.userId, userId))
    .orderBy(desc(debateTemplates.updatedAt));
}

export async function getDebateTemplateById(templateId: string) {
  const db = await getDb();
  if (!db) return null;

  const { debateTemplates } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const results = await db
    .select()
    .from(debateTemplates)
    .where(eq(debateTemplates.id, templateId))
    .limit(1);
  
  return results[0] || null;
}

export async function updateDebateTemplate(
  templateId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    agentIds?: string[];
    rounds?: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { debateTemplates } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");
  
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.agentIds !== undefined) updateData.agentIds = updates.agentIds;
  if (updates.rounds !== undefined) updateData.rounds = updates.rounds;

  await db
    .update(debateTemplates)
    .set(updateData)
    .where(
      and(
        eq(debateTemplates.id, templateId),
        eq(debateTemplates.userId, userId)
      )
    );
}

export async function deleteDebateTemplate(
  templateId: string,
  userId: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { debateTemplates } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");
  
  await db
    .delete(debateTemplates)
    .where(
      and(
        eq(debateTemplates.id, templateId),
        eq(debateTemplates.userId, userId)
      )
    );
}
