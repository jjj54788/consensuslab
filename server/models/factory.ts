import { ModelAdapter } from "./adapters/base";
import { OpenAIAdapter } from "./adapters/openai";
import { ClaudeAdapter } from "./adapters/claude";

/**
 * Model factory
 * Creates appropriate model adapter based on provider name
 */
export class ModelFactory {
  static createAdapter(
    providerName: string,
    modelName: string,
    apiKey: string,
    baseUrl?: string
  ): ModelAdapter {
    switch (providerName.toLowerCase()) {
      case "openai":
        return new OpenAIAdapter(apiKey, modelName, baseUrl);
      case "claude":
      case "anthropic":
        return new ClaudeAdapter(apiKey, modelName, baseUrl);
      // Add more providers here as needed
      // case "qwen":
      //   return new QwenAdapter(apiKey, modelName, baseUrl);
      // case "ernie":
      //   return new ErnieAdapter(apiKey, modelName, baseUrl);
      default:
        throw new Error(`Unsupported provider: ${providerName}`);
    }
  }
}
