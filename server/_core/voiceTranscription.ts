/**
 * Voice Transcription Service (Standalone Version)
 * 
 * This module is disabled in standalone version.
 * To enable voice transcription, implement your own OpenAI Whisper API integration.
 */

export type TranscribeOptions = {
  audioUrl: string;
  language?: string;
  prompt?: string;
};

export type TranscriptionResponse = {
  text: string;
  language?: string;
  duration?: number;
  segments?: Array<{
    id: number;
    seek: number;
    start: number;
    end: number;
    text: string;
    tokens: number[];
    temperature: number;
    avg_logprob: number;
    compression_ratio: number;
    no_speech_prob: number;
  }>;
};

export type TranscriptionError = {
  error: string;
  code: "FILE_TOO_LARGE" | "INVALID_FORMAT" | "TRANSCRIPTION_FAILED" | "UPLOAD_FAILED" | "SERVICE_ERROR";
  details?: string;
};

/**
 * Transcribe audio from URL (Standalone version - not implemented)
 * 
 * To implement this feature:
 * 1. Install OpenAI SDK: pnpm add openai
 * 2. Get API key from https://platform.openai.com/api-keys
 * 3. Call OpenAI Whisper API directly
 * 
 * Example implementation:
 * ```typescript
 * import OpenAI from "openai";
 * const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 * const transcription = await openai.audio.transcriptions.create({
 *   file: audioFile,
 *   model: "whisper-1",
 *   language: options.language,
 *   prompt: options.prompt,
 * });
 * return transcription;
 * ```
 */
export async function transcribeAudio(
  options: TranscribeOptions
): Promise<TranscriptionResponse | TranscriptionError> {
  return {
    error: "Voice transcription is not available in standalone version",
    code: "SERVICE_ERROR",
    details: "Please implement your own OpenAI Whisper API integration. See comments in voiceTranscription.ts for example code."
  };
}
