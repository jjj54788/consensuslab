import { nanoid } from "nanoid";
import { Agent, Message } from "../drizzle/schema";
import { createMessage, getSessionMessages, updateDebateSession, updateMessage } from "./db";
import { AIProviderService, AIProviderConfig } from "./aiProviders";
import { getActiveAIProvider } from "./aiProviderDb";
import { scoreMessage } from "./scoringEngine";

export type AgentStatus = "idle" | "thinking" | "speaking" | "waiting";

export interface DebateContext {
  sessionId: string;
  topic: string;
  agents: Agent[];
  currentRound: number;
  maxRounds: number;
  messages: Message[];
}

export interface AgentMessage {
  agentId: string;
  content: string;
  round: number;
}

/**
 * Generate a response from an agent based on the debate context
 */
export async function generateAgentResponse(
  agent: Agent,
  context: DebateContext,
  previousMessages: Message[],
  userId: number
): Promise<string> {
  // Build conversation history
  const history = previousMessages
    .map((msg) => {
      const msgAgent = context.agents.find((a) => a.id === msg.sender);
      return `${msgAgent?.name || msg.sender}: ${msg.content}`;
    })
    .join("\n\n");

  // Analyze recent messages to provide context
  const recentMessages = previousMessages.slice(-3); // Last 3 messages for immediate context
  const recentContext = recentMessages.length > 0
    ? recentMessages.map((msg) => {
        const msgAgent = context.agents.find((a) => a.id === msg.sender);
        return `${msgAgent?.name || msg.sender}: ${msg.content}`;
      }).join("\n\n")
    : "";

  const prompt = `## YOUR ROLE
You are ${agent.name}, ${agent.profile}.
${agent.systemPrompt}

## DEBATE TOPIC
${context.topic}

## FULL DEBATE HISTORY
${history || "This is the beginning of the debate."}

${recentContext ? `## RECENT DISCUSSION (Pay Special Attention)
${recentContext}

` : ""}## YOUR TASK
Round ${context.currentRound} of ${context.maxRounds}.
${previousMessages.length === 0 
  ? "As the first speaker, provide your initial perspective on this topic. Be clear, insightful, and set a strong foundation for the debate. (100-150 words)"
  : `You have heard all the previous arguments. Now it's your turn to respond.

**Your response should:**
1. Acknowledge or reference specific points made by other participants
2. Present your own perspective with clear reasoning
3. Add new insights or angles that haven't been fully explored
4. Build on or challenge previous arguments constructively

Be concise but impactful. (100-150 words)`}`;

  try {
    // Get user's active AI provider config
    const providerConfig = await getActiveAIProvider(userId);

    // Determine provider and API key with fallback to environment variables
    let provider: "manus" | "openai" | "anthropic" | "custom" = "manus";
    let apiKey: string | undefined = undefined;
    let baseURL: string | undefined = undefined;
    let model: string | undefined = undefined;

    if (providerConfig) {
      // User has configured a custom provider
      provider = providerConfig.provider;
      apiKey = providerConfig.apiKey || undefined;
      baseURL = providerConfig.baseURL || undefined;
      model = providerConfig.model || undefined;
    } else {
      // No custom provider configured, check environment variables
      const { ENV } = await import("./_core/env");

      if (ENV.openaiApiKey) {
        console.log("[DebateEngine] Using OpenAI API key from environment variables");
        provider = "openai";
        apiKey = ENV.openaiApiKey;
      } else if (ENV.anthropicApiKey) {
        console.log("[DebateEngine] Using Anthropic API key from environment variables");
        provider = "anthropic";
        apiKey = ENV.anthropicApiKey;
      } else if (ENV.forgeApiKey) {
        console.log("[DebateEngine] Using built-in Manus Forge API");
        provider = "manus";
      } else {
        console.warn("[DebateEngine] No AI provider configured - neither custom config nor environment variables found");
      }
    }

    const aiConfig: AIProviderConfig = {
      provider,
      apiKey,
      baseURL,
      model,
    };

    console.log(`[DebateEngine] Generating response for ${agent.name} using provider: ${aiConfig.provider}`);

    const response = await AIProviderService.chat(
      [
        { role: "system", content: agent.systemPrompt },
        { role: "user", content: prompt },
      ],
      aiConfig
    );

    console.log(`[DebateEngine] Response generated successfully for ${agent.name}`);
    return response.content || "I have no response at this time.";
  } catch (error) {
    console.error(`[DebateEngine] Error generating response for ${agent.name}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide helpful error message if AI provider is not configured
    if (errorMessage.includes("OPENAI_API_KEY is not configured") ||
        errorMessage.includes("API key is required") ||
        errorMessage.includes("API key")) {
      throw new Error(
        "AI Provider not configured. Please either: " +
        "1) Add OPENAI_API_KEY or ANTHROPIC_API_KEY to your .env file, OR " +
        "2) Configure your API key in Settings > AI Provider Settings"
      );
    }

    throw error;
  }
}

/**
 * Execute one round of debate with parallel thinking and sequential speaking
 * All agents think simultaneously, then speak in sequence
 */
export async function executeDebateRound(
  sessionId: string,
  context: DebateContext,
  userId: number,
  onAgentStatusChange?: (agentId: string, status: AgentStatus) => void,
  onMessageCreated?: (message: Message) => void
): Promise<Message[]> {
  console.log(`[DebateEngine] ===== executeDebateRound called for round ${context.currentRound} =====`);
  const roundMessages: Message[] = [];
  let previousMessages = await getSessionMessages(sessionId);
  console.log(`[DebateEngine] Previous messages count: ${previousMessages.length}`);

  // Phase 1: Parallel Thinking - All agents generate responses simultaneously
  console.log(`[DebateEngine] Phase 1: All agents start thinking in parallel`);
  
  // Set all agents to "thinking" status
  for (const agent of context.agents) {
    onAgentStatusChange?.(agent.id, "thinking");
  }

  // Generate all responses in parallel
  const responsePromises = context.agents.map(async (agent) => {
    try {
      const content = await generateAgentResponse(agent, context, previousMessages, userId);
      return { agent, content, success: true };
    } catch (error) {
      console.error(`[DebateEngine] Error generating response for ${agent.name}:`, error);
      return { agent, content: "", success: false, error };
    }
  });

  const responses = await Promise.all(responsePromises);
  console.log(`[DebateEngine] All agents finished thinking, ${responses.filter(r => r.success).length}/${responses.length} succeeded`);

  // Phase 2: Sequential Speaking - Agents speak one by one
  console.log(`[DebateEngine] Phase 2: Agents speak in sequence`);
  
  for (let i = 0; i < context.agents.length; i++) {
    const { agent, content, success } = responses[i];
    
    if (!success) {
      console.error(`[DebateEngine] Skipping agent ${agent.name} due to earlier error`);
      onAgentStatusChange?.(agent.id, "idle");
      continue;
    }

    try {
      // Update agent status to speaking
      onAgentStatusChange?.(agent.id, "speaking");

      // Create message
      const message: Message = {
        id: nanoid(),
        sessionId,
        sender: agent.id,
        receiver: "all",
        content,
        round: context.currentRound,
        sentiment: null,
        logicScore: null,
        innovationScore: null,
        expressionScore: null,
        totalScore: null,
        scoringReasons: null,
        isHighlight: 0,
        createdAt: new Date(),
      };

      await createMessage(message);
      roundMessages.push(message);
      onMessageCreated?.(message);

      // Update previousMessages so subsequent agents in this round can see it
      previousMessages = [...previousMessages, message];

      // Score the message asynchronously (don't block the debate flow)
      console.log(`[DebateEngine] Starting to score message ${message.id}`);
      scoreMessage(
        message,
        { topic: context.topic, previousMessages: previousMessages.slice(0, -1) }, // Don't include current message in scoring context
        userId
      ).then(async (scores) => {
        console.log(`[DebateEngine] Received scores for message ${message.id}:`, scores);
        // Update message with scores
        await updateMessage(message.id, {
          logicScore: scores.logicScore,
          innovationScore: scores.innovationScore,
          expressionScore: scores.expressionScore,
          totalScore: scores.totalScore,
          scoringReasons: scores.scoringReasons,
        });
        console.log(`[DebateEngine] Successfully updated message ${message.id} with scores`);
      }).catch((error) => {
        console.error(`[DebateEngine] Error scoring message ${message.id}:`, error);
        console.error(`[DebateEngine] Error stack:`, error.stack);
      });

      // Update agent status to waiting
      onAgentStatusChange?.(agent.id, "waiting");

      // Add a small delay between agents for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[DebateEngine] Error in round ${context.currentRound} for agent ${agent.id}:`, error);
      onAgentStatusChange?.(agent.id, "idle");
      throw error;
    }
  }

  return roundMessages;
}

/**
 * Generate a summary of the debate using LLM
 */
export async function generateDebateSummary(
  topic: string,
  agents: Agent[],
  messages: Message[],
  userId: number
): Promise<{
  summary: string;
  keyPoints: string[];
  consensus: string;
  disagreements: string[];
  bestViewpoint?: string;
  mostInnovative?: string;
  goldenQuotes?: string[];
}> {
  const conversation = messages
    .map((msg) => {
      const agent = agents.find((a) => a.id === msg.sender);
      return `**${agent?.name || msg.sender}** (Round ${msg.round}):\n${msg.content}`;
    })
    .join("\n\n");

  // Find high-scoring messages for highlights
  const scoredMessages = messages.filter(m => m.totalScore && m.totalScore > 0);
  const sortedByScore = [...scoredMessages].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
  const topMessages = sortedByScore.slice(0, 5);
  
  const highlightsContext = topMessages.length > 0 
    ? `\n\n## TOP SCORED MESSAGES\n${topMessages.map(m => {
        const agent = agents.find(a => a.id === m.sender);
        return `**${agent?.name}** (Score: ${m.totalScore}):\n${m.content}`;
      }).join('\n\n')}`
    : '';

  const prompt = `请分析以下讨论并提供全面的总结和亮点。

## 讨论话题
${topic}

## 参与者
${agents.map((a) => `- ${a.name}: ${a.profile}`).join("\n")}

## 对话内容
${conversation}${highlightsContext}

## 任务要求
请用中文提供以下JSON格式的响应：
{
  "summary": "对整个讨论的全面总结，2-3段文字",
  "keyPoints": ["关键观点1", "关键观点2", "关键观点3"],
  "consensus": "主要共识和一致意见",
  "disagreements": ["分歧点1", "分歧点2"],
  "bestViewpoint": "智能体名称：讨论中最有说服力和逻辑严密的论点内容",
  "mostInnovative": "智能体名称：最具创新性或新颖的想法内容",
  "goldenQuotes": ["智能体名称：精彩金句1", "智能体名称：精彩金句2", "智能体名称：精彩金句3"]
}

注意：bestViewpoint、mostInnovative和goldenQuotes中都必须包含发言者的智能体名称，格式为"智能体名称：内容"。`;

  try {
    // Get user's active AI provider config with fallback to environment variables
    const providerConfig = await getActiveAIProvider(userId);

    // Determine provider and API key with fallback to environment variables
    let provider: "manus" | "openai" | "anthropic" | "custom" = "manus";
    let apiKey: string | undefined = undefined;
    let baseURL: string | undefined = undefined;
    let model: string | undefined = undefined;

    if (providerConfig) {
      // User has configured a custom provider
      provider = providerConfig.provider;
      apiKey = providerConfig.apiKey || undefined;
      baseURL = providerConfig.baseURL || undefined;
      model = providerConfig.model || undefined;
    } else {
      // No custom provider configured, check environment variables
      const { ENV } = await import("./_core/env");

      if (ENV.openaiApiKey) {
        console.log("[DebateEngine] Using OpenAI API key from environment variables for summary");
        provider = "openai";
        apiKey = ENV.openaiApiKey;
      } else if (ENV.anthropicApiKey) {
        console.log("[DebateEngine] Using Anthropic API key from environment variables for summary");
        provider = "anthropic";
        apiKey = ENV.anthropicApiKey;
      } else if (ENV.forgeApiKey) {
        console.log("[DebateEngine] Using built-in Manus Forge API for summary");
        provider = "manus";
      }
    }

    const aiConfig: AIProviderConfig = {
      provider,
      apiKey,
      baseURL,
      model,
    };

    console.log(`[DebateEngine] Generating summary using provider: ${aiConfig.provider}`);

    const response = await AIProviderService.chat(
      [
        {
          role: "system",
          content: "你是一位专业的讨论分析专家。请提供客观、平衡的分析，所有输出必须使用中文。",
        },
        { role: "user", content: prompt },
      ],
      aiConfig
    );

    const content = response.content;
    if (!content) {
      throw new Error("No response from LLM");
    }

    // Clean up markdown code blocks if present
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(cleanContent);

    // Ensure consensus is a string (join array if needed)
    if (Array.isArray(parsed.consensus)) {
      parsed.consensus = parsed.consensus.join('; ');
    }

    console.log("[DebateEngine] Summary generated successfully");
    return parsed;
  } catch (error) {
    console.error("[DebateEngine] Error generating summary:", error);
    console.error("[DebateEngine] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return {
      summary: "Unable to generate summary at this time.",
      keyPoints: [],
      consensus: "No consensus reached.",
      disagreements: [],
    };
  }
}

/**
 * Run a complete debate session
 */
export async function runDebateSession(
  sessionId: string,
  context: DebateContext,
  userId: number,
  onAgentStatusChange?: (agentId: string, status: AgentStatus) => void,
  onMessageCreated?: (message: Message) => void,
  onRoundComplete?: (round: number) => void
): Promise<void> {
  console.log(`[DebateEngine] ===== Starting debate session ${sessionId} =====`);
  console.log(`[DebateEngine] Topic: ${context.topic}`);
  console.log(`[DebateEngine] Agents: ${context.agents.length}, MaxRounds: ${context.maxRounds}`);

  try {
    // Update session status to running
    console.log(`[DebateEngine] Updating session status to 'running'`);
    await updateDebateSession(sessionId, { status: "running" });

    // Execute all rounds
    for (let round = 1; round <= context.maxRounds; round++) {
      console.log(`[DebateEngine] ===== Starting round ${round}/${context.maxRounds} =====`);
      context.currentRound = round;
      await updateDebateSession(sessionId, { currentRound: round });

      await executeDebateRound(sessionId, context, userId, onAgentStatusChange, onMessageCreated);

      console.log(`[DebateEngine] Round ${round} completed successfully`);
      onRoundComplete?.(round);
    }

    // Generate summary
    console.log(`[DebateEngine] All rounds completed. Generating summary...`);
    const allMessages = await getSessionMessages(sessionId);
    const summary = await generateDebateSummary(context.topic, context.agents, allMessages, userId);

    // Update session with summary and mark as completed
    console.log(`[DebateEngine] Updating session with summary and marking as completed`);
    await updateDebateSession(sessionId, {
      status: "completed",
      summary: summary.summary,
      keyPoints: summary.keyPoints,
      consensus: summary.consensus,
      disagreements: summary.disagreements,
      bestViewpoint: summary.bestViewpoint || null,
      mostInnovative: summary.mostInnovative || null,
      goldenQuotes: summary.goldenQuotes || [],
      completedAt: new Date(),
    });

    // Set all agents to idle
    context.agents.forEach((agent) => onAgentStatusChange?.(agent.id, "idle"));
    console.log(`[DebateEngine] ===== Debate session ${sessionId} completed successfully =====`);
  } catch (error) {
    console.error(`[DebateEngine] ===== ERROR in debate session ${sessionId} =====`);
    console.error("[DebateEngine] Error details:", error);
    console.error("[DebateEngine] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    await updateDebateSession(sessionId, { status: "error" });

    // Set all agents to idle on error
    context.agents.forEach((agent) => onAgentStatusChange?.(agent.id, "idle"));

    throw error;
  }
}
