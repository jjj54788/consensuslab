/**
 * Base interface for all model adapters
 * Provides a unified interface for different AI model providers
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelInvokeParams {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
}

export interface ModelResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  latency: number; // in milliseconds
}

export abstract class ModelAdapter {
  constructor(
    protected apiKey: string,
    protected modelName: string,
    protected baseUrl?: string
  ) {}

  /**
   * Invoke the model with the given parameters
   */
  abstract invoke(params: ModelInvokeParams): Promise<ModelResponse>;

  /**
   * Test if the API key is valid
   */
  abstract testConnection(): Promise<boolean>;
}
