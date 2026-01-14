import { ModelAdapter, ModelInvokeParams, ModelResponse, Message } from "./base";

/**
 * Claude (Anthropic) model adapter
 * Supports Claude 3 Opus, Sonnet, and Haiku
 */
export class ClaudeAdapter extends ModelAdapter {
  private readonly defaultBaseUrl = "https://api.anthropic.com/v1";

  async invoke(params: ModelInvokeParams): Promise<ModelResponse> {
    const startTime = Date.now();
    const baseUrl = this.baseUrl || this.defaultBaseUrl;

    // Claude requires system message to be separate
    const systemMessage = params.messages.find((m) => m.role === "system");
    const messages = params.messages.filter((m) => m.role !== "system");

    try {
      const response = await fetch(`${baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.modelName,
          system: systemMessage?.content || "",
          messages: messages.map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 2000,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const latency = Date.now() - startTime;

      return {
        content: data.content[0].text,
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
        latency,
      };
    } catch (error) {
      throw new Error(`Failed to invoke Claude model: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Claude doesn't have a simple test endpoint, so we make a minimal request
      const response = await this.invoke({
        messages: [{ role: "user", content: "test" }],
        maxTokens: 10,
      });
      return !!response.content;
    } catch {
      return false;
    }
  }
}
