/**
 * Standalone LLM Service
 * Direct OpenAI/Claude API calls without Manus dependency
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type {
  Role,
  Message,
  Tool,
  ToolChoice,
  InvokeParams,
  InvokeResult,
  ResponseFormat,
  OutputSchema,
} from "./llm";

// Re-export types for compatibility
export type {
  Role,
  Message,
  Tool,
  ToolChoice,
  InvokeParams,
  InvokeResult,
  ResponseFormat,
  OutputSchema,
};

/**
 * Get API key from environment or user configuration
 */
function getApiKey(provider: "openai" | "claude"): string {
  const key =
    provider === "openai"
      ? process.env.OPENAI_API_KEY
      : process.env.CLAUDE_API_KEY;

  if (!key) {
    throw new Error(
      `${provider.toUpperCase()}_API_KEY is not configured. Please set it in environment variables or add it via API Keys management page.`
    );
  }

  return key;
}

/**
 * Invoke OpenAI API
 */
async function invokeOpenAI(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = getApiKey("openai");
  const openai = new OpenAI({ apiKey });

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    maxTokens,
    max_tokens,
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  } = params;

  // Convert messages to OpenAI format
  const openaiMessages = messages.map((msg) => ({
    role: msg.role,
    content:
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content),
    ...(msg.name && { name: msg.name }),
  }));

  // Prepare request parameters
  const requestParams: any = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: openaiMessages,
    max_tokens: maxTokens || max_tokens || 4096,
  };

  // Add tools if provided
  if (tools && tools.length > 0) {
    requestParams.tools = tools;
    if (toolChoice || tool_choice) {
      requestParams.tool_choice = toolChoice || tool_choice;
    }
  }

  // Add response format if provided
  const format = responseFormat || response_format;
  const schema = outputSchema || output_schema;
  if (format) {
    requestParams.response_format = format;
  } else if (schema) {
    requestParams.response_format = {
      type: "json_schema",
      json_schema: schema,
    };
  }

  // Call OpenAI API
  const response = await openai.chat.completions.create(requestParams);

  // Convert to standard format
  return {
    id: response.id,
    created: response.created,
    model: response.model,
    choices: response.choices.map((choice) => ({
      index: choice.index,
      message: {
        role: choice.message.role as Role,
        content: choice.message.content || "",
        ...(choice.message.tool_calls && {
          tool_calls: choice.message.tool_calls as any,
        }),
      },
      finish_reason: choice.finish_reason,
    })),
    usage: response.usage
      ? {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Invoke Claude API
 */
async function invokeClaude(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = getApiKey("claude");
  const anthropic = new Anthropic({ apiKey });

  const {
    messages,
    maxTokens,
    max_tokens,
  } = params;

  // Separate system messages
  const systemMessages = messages.filter((m) => m.role === "system");
  const userMessages = messages.filter((m) => m.role !== "system");

  // Convert messages to Claude format
  const claudeMessages = userMessages.map((msg) => ({
    role: msg.role === "assistant" ? "assistant" : "user",
    content:
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content),
  }));

  // Prepare request parameters
  const requestParams: any = {
    model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
    max_tokens: maxTokens || max_tokens || 4096,
    messages: claudeMessages,
  };

  // Add system message if exists
  if (systemMessages.length > 0) {
    requestParams.system =
      typeof systemMessages[0].content === "string"
        ? systemMessages[0].content
        : JSON.stringify(systemMessages[0].content);
  }

  // Call Claude API
  const response = await anthropic.messages.create(requestParams);

  // Convert to standard format
  return {
    id: response.id,
    created: Date.now(),
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant" as Role,
          content:
            response.content[0].type === "text"
              ? response.content[0].text
              : JSON.stringify(response.content),
        },
        finish_reason: response.stop_reason || "stop",
      },
    ],
    usage: response.usage
      ? {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens:
            response.usage.input_tokens + response.usage.output_tokens,
        }
      : undefined,
  };
}

/**
 * Main LLM invocation function
 * Automatically selects provider based on environment configuration
 */
export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  // Determine which provider to use
  const provider = process.env.LLM_PROVIDER || "openai";

  if (provider === "claude") {
    return invokeClaude(params);
  } else {
    return invokeOpenAI(params);
  }
}
