import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { getAllAgents, getDebateSessionById, getSessionMessages } from "./db";
import { runDebateSession, AgentStatus } from "./debateEngine";
import { Message } from "../drizzle/schema";

export function setupWebSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on("join-debate", async (sessionId: string) => {
      socket.join(`debate-${sessionId}`);
      console.log(`[WebSocket] Client ${socket.id} joined debate ${sessionId}`);
      
      // Send historical messages to the client
      try {
        const messages = await getSessionMessages(sessionId);
        socket.emit("historical-messages", messages);
        console.log(`[WebSocket] Sent ${messages.length} historical messages to client ${socket.id}`);
      } catch (error) {
        console.error(`[WebSocket] Error loading historical messages:`, error);
      }
    });

    socket.on("start-debate", async (sessionId: string) => {
      try {
        console.log(`[WebSocket] Starting debate ${sessionId}`);

        const session = await getDebateSessionById(sessionId);
        if (!session) {
          const errorMsg = "Session not found";
          console.error(`[WebSocket] ${errorMsg}: ${sessionId}`);
          io.to(`debate-${sessionId}`).emit("error", { message: errorMsg });
          return;
        }

        // Check if debate is already running or completed
        if (session.status === "running") {
          const errorMsg = "Debate is already running";
          console.warn(`[WebSocket] ${errorMsg}: ${sessionId}`);
          io.to(`debate-${sessionId}`).emit("error", { message: errorMsg });
          return;
        }

        if (session.status === "completed") {
          const errorMsg = "Debate has already completed";
          console.warn(`[WebSocket] ${errorMsg}: ${sessionId}`);
          io.to(`debate-${sessionId}`).emit("error", { message: errorMsg });
          return;
        }

        console.log(`[WebSocket] Loading agents for session ${sessionId}...`);
        const allAgents = await getAllAgents();
        const selectedAgents = allAgents.filter((agent) =>
          session.agentIds.includes(agent.id)
        );

        if (selectedAgents.length === 0) {
          const errorMsg = "No agents found for this debate";
          console.error(`[WebSocket] ${errorMsg}: ${sessionId}`);
          io.to(`debate-${sessionId}`).emit("error", { message: errorMsg });
          return;
        }

        console.log(`[WebSocket] Found ${selectedAgents.length} agents. Starting debate execution...`);

        // Run debate with real-time updates
        await runDebateSession(
          sessionId,
          {
            sessionId,
            topic: session.topic,
            agents: selectedAgents,
            currentRound: session.currentRound,
            maxRounds: session.maxRounds,
            messages: [],
          },
          session.userId, // userId
          // onAgentStatusChange
          (agentId: string, status: AgentStatus) => {
            io.to(`debate-${sessionId}`).emit("agent-status", {
              agentId,
              status,
            });
          },
          // onMessageCreated
          (message: Message) => {
            io.to(`debate-${sessionId}`).emit("new-message", message);
          },
          // onRoundComplete
          (round: number) => {
            io.to(`debate-${sessionId}`).emit("round-complete", { round });
          }
        );

        console.log(`[WebSocket] Debate ${sessionId} completed successfully. Sending completion notification...`);
        // Notify completion
        const updatedSession = await getDebateSessionById(sessionId);
        io.to(`debate-${sessionId}`).emit("debate-complete", updatedSession);
      } catch (error) {
        console.error(`[WebSocket] Error in debate ${sessionId}:`, error);
        console.error(`[WebSocket] Error stack:`, error instanceof Error ? error.stack : "No stack trace");
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while starting the debate";
        io.to(`debate-${sessionId}`).emit("error", {
          message: errorMessage,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
