import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  getAllAgents,
  createDebateSession,
  getDebateSessionById,
  getUserDebateSessions,
  getSessionMessages,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  agents: router({
    list: publicProcedure.query(async () => {
      return await getAllAgents();
    }),
  }),

  debate: router({
    create: protectedProcedure
      .input(
        z.object({
          topic: z.string().min(1),
          agentIds: z.array(z.string()).min(2),
          maxRounds: z.number().min(1).max(10).default(5),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const sessionId = nanoid();
        await createDebateSession({
          id: sessionId,
          userId: ctx.user.id,
          topic: input.topic,
          agentIds: input.agentIds,
          maxRounds: input.maxRounds,
          currentRound: 0,
          status: "pending",
          summary: null,
          keyPoints: null,
          consensus: null,
          disagreements: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        });
        return { sessionId };
      }),

    get: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        const session = await getDebateSessionById(input.sessionId);
        if (!session) {
          throw new Error("Session not found");
        }
        return session;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserDebateSessions(ctx.user.id);
    }),

    messages: protectedProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return await getSessionMessages(input.sessionId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
