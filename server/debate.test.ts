import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { agents } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Debate System", () => {
  beforeAll(async () => {
    // Ensure agents are seeded
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const existingAgents = await db.select().from(agents);
    if (existingAgents.length === 0) {
      // Seed agents if not already present
      const { seedAgents } = await import("./seedAgents");
      await seedAgents();
    }
  });

  describe("agents.list", () => {
    it("should return list of preset agents", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.agents.list();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Check that each agent has required fields
      result.forEach((agent) => {
        expect(agent).toHaveProperty("id");
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("profile");
        expect(agent).toHaveProperty("systemPrompt");
        expect(agent).toHaveProperty("color");
      });

      // Check for specific preset agents
      const agentIds = result.map((a) => a.id);
      expect(agentIds).toContain("opponent");
      expect(agentIds).toContain("critic");
      expect(agentIds).toContain("supporter");
      expect(agentIds).toContain("moderator");
      expect(agentIds).toContain("innovator");
    });
  });

  describe("debate.create", () => {
    it("should create a new debate session", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.debate.create({
        topic: "人工智能是否会取代人类的工作？",
        agentIds: ["opponent", "supporter"],
        maxRounds: 3,
      });

      expect(result).toHaveProperty("sessionId");
      expect(typeof result.sessionId).toBe("string");
      expect(result.sessionId.length).toBeGreaterThan(0);
    });

    it("should require at least 2 agents", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.debate.create({
          topic: "Test topic",
          agentIds: ["opponent"],
          maxRounds: 3,
        })
      ).rejects.toThrow();
    });

    it("should require a topic", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.debate.create({
          topic: "",
          agentIds: ["opponent", "supporter"],
          maxRounds: 3,
        })
      ).rejects.toThrow();
    });
  });

  describe("debate.get", () => {
    it("should retrieve a debate session by ID", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First create a session
      const created = await caller.debate.create({
        topic: "测试话题",
        agentIds: ["opponent", "supporter", "moderator"],
        maxRounds: 5,
      });

      // Then retrieve it
      const session = await caller.debate.get({
        sessionId: created.sessionId,
      });

      expect(session).toBeDefined();
      expect(session.id).toBe(created.sessionId);
      expect(session.topic).toBe("测试话题");
      expect(session.agentIds).toEqual(["opponent", "supporter", "moderator"]);
      expect(session.maxRounds).toBe(5);
      expect(session.status).toBe("pending");
    });

    it("should throw error for non-existent session", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.debate.get({
          sessionId: "non-existent-id",
        })
      ).rejects.toThrow("Session not found");
    });
  });

  describe("debate.list", () => {
    it("should return list of user's debate sessions", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a session
      await caller.debate.create({
        topic: "测试列表功能",
        agentIds: ["critic", "innovator"],
        maxRounds: 3,
      });

      // Get list
      const sessions = await caller.debate.list();

      expect(Array.isArray(sessions)).toBe(true);
      expect(sessions.length).toBeGreaterThan(0);

      // Check that sessions belong to the user
      sessions.forEach((session) => {
        expect(session.userId).toBe(ctx.user.id);
        expect(session).toHaveProperty("topic");
        expect(session).toHaveProperty("agentIds");
        expect(session).toHaveProperty("status");
      });
    });
  });

  describe("debate.messages", () => {
    it("should return empty array for new session", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const created = await caller.debate.create({
        topic: "新会话测试",
        agentIds: ["opponent", "supporter"],
        maxRounds: 3,
      });

      const messages = await caller.debate.messages({
        sessionId: created.sessionId,
      });

      expect(Array.isArray(messages)).toBe(true);
      expect(messages.length).toBe(0);
    });
  });
});
