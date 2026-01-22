// Standalone version - no Manus LLM dependency
import { ENV } from "./_core/env";
import { ProxyAgent, setGlobalDispatcher } from "undici";

// Configure proxy if available
const proxy =
  process.env.HTTPS_PROXY ||
  process.env.https_proxy ||
  process.env.HTTP_PROXY ||
  process.env.http_proxy;

if (proxy) {
  console.log("[AIProviderService] Using proxy:", proxy);
  try {
    setGlobalDispatcher(new ProxyAgent(proxy));
  } catch (error) {
    console.error("[AIProviderService] Failed to set proxy:", error);
  }
}

export type AIProvider = "manus" | "openai" | "anthropic" | "custom";

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Abstract AI provider interface
 * Supports multiple AI providers: Manus built-in, OpenAI, Anthropic, and custom APIs
 */
export class AIProviderService {
  /**
   * Get AI provider configuration from environment variables
   * This reads OPENAI_API_KEY or ANTHROPIC_API_KEY from .env
   */
  static getProviderFromEnv(): AIProviderConfig {
    // Try OpenAI first
    if (ENV.openaiApiKey && ENV.openaiApiKey.length > 0) {
      console.log("[AIProviderService] Using OpenAI from OPENAI_API_KEY environment variable");
      return {
        provider: "openai",
        apiKey: ENV.openaiApiKey,
        model: "gpt-4o-mini", // Default model
      };
    }

    // Try Anthropic/Claude
    if (ENV.anthropicApiKey && ENV.anthropicApiKey.length > 0) {
      console.log("[AIProviderService] Using Anthropic from ANTHROPIC_API_KEY environment variable");
      return {
        provider: "anthropic",
        apiKey: ENV.anthropicApiKey,
        model: "claude-3-5-sonnet-20241022", // Default model
      };
    }

    // No API key found
    throw new Error(
      "No AI provider API key found in environment variables. " +
      "Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in your .env file or environment."
    );
  }

  /**
   * Invoke AI completion with the specified provider
   */
  static async chat(
    messages: ChatMessage[],
    config: AIProviderConfig
  ): Promise<ChatCompletionResponse> {
    switch (config.provider) {
      case "manus":
        return this.chatWithManus(messages);
      case "openai":
        return this.chatWithOpenAI(messages, config);
      case "anthropic":
        return this.chatWithAnthropic(messages, config);
      case "custom":
        return this.chatWithCustom(messages, config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * Standalone version: Manus provider not supported
   * Users must configure OpenAI or Claude API keys
   */
  private static async chatWithManus(
    messages: ChatMessage[]
  ): Promise<ChatCompletionResponse> {
    throw new Error(
      "Manus LLM service is not available in standalone version. " +
      "Please configure your own OpenAI or Claude API key in AI Settings."
    );
  }

  /**
   * Use OpenAI API
   */
  private static async chatWithOpenAI(
    messages: ChatMessage[],
    config: AIProviderConfig
  ): Promise<ChatCompletionResponse> {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required");
    }

    const baseURL = config.baseURL || "https://api.openai.com/v1";
    const model = config.model || "gpt-4o-mini";

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || "",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Use Anthropic API
   */
  private static async chatWithAnthropic(
    messages: ChatMessage[],
    config: AIProviderConfig
  ): Promise<ChatCompletionResponse> {
    if (!config.apiKey) {
      throw new Error("Anthropic API key is required");
    }

    const baseURL = config.baseURL || "https://api.anthropic.com/v1";
    const model = config.model || "claude-3-5-sonnet-20241022";

    // Extract system message
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    const response = await fetch(`${baseURL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemMessage?.content,
        messages: conversationMessages.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
      }),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0]?.text || "",
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }

  /**
   * Use custom API endpoint
   */
  private static async chatWithCustom(
    messages: ChatMessage[],
    config: AIProviderConfig
  ): Promise<ChatCompletionResponse> {
    if (!config.baseURL) {
      throw new Error("Custom API base URL is required");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model || "default",
        messages,
      }),
      signal: AbortSignal.timeout(60000), // 60 second timeout
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom API error: ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || data.content || "",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens || 0,
            completionTokens: data.usage.completion_tokens || 0,
            totalTokens: data.usage.total_tokens || 0,
          }
        : undefined,
    };
  }
}
