import { ModelAdapter, ModelInvokeParams, ModelResponse } from "./base";

/**
 * OpenAI model adapter
 * Supports GPT-4, GPT-3.5, and other OpenAI models
 */
export class OpenAIAdapter extends ModelAdapter {
  private readonly defaultBaseUrl = "https://api.openai.com/v1";

  async invoke(params: ModelInvokeParams): Promise<ModelResponse> {
    const startTime = Date.now();
    const baseUrl = this.baseUrl || this.defaultBaseUrl;

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: params.messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return {
        content: data.choices[0].message.content,
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        latency,
      };
    } catch (error) {
      throw new Error(`Failed to invoke OpenAI model: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const baseUrl = this.baseUrl || this.defaultBaseUrl;
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
