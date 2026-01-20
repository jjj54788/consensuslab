/**
 * Image Generation Service (Standalone Version - Disabled)
 * 
 * This feature is disabled in standalone version.
 * To enable, implement your own integration with DALL-E, Stable Diffusion, or similar services.
 */

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url: string;
    mimeType: string;
  }>;
};

export type GenerateImageResult = {
  url: string;
};

/**
 * Generate an image from a text prompt (Standalone version - not implemented)
 * 
 * To implement this feature:
 * 1. Install OpenAI SDK: pnpm add openai
 * 2. Get API key from https://platform.openai.com/api-keys
 * 3. Call DALL-E API directly
 * 
 * Example implementation:
 * ```typescript
 * import OpenAI from "openai";
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const response = await openai.images.generate({
 *   model: "dall-e-3",
 *   prompt: options.prompt,
 *   n: 1,
 *   size: "1024x1024",
 * });
 * return { url: response.data[0].url };
 * ```
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResult> {
  throw new Error(
    "Image generation is not available in standalone version. " +
    "Please implement your own DALL-E or Stable Diffusion integration. " +
    "See comments in imageGeneration.ts for example code."
  );
}
