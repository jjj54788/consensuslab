/**
 * Data API Service (Standalone Version - Disabled)
 * 
 * This feature is disabled in standalone version.
 * Implement direct API calls to external services as needed.
 */

export type CallApiOptions = {
  query?: Record<string, string>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, string>;
  formData?: Record<string, string>;
};

export type CallApiResult = {
  status: number;
  headers: Record<string, string>;
  body: unknown;
};

/**
 * Call external API (Standalone version - not implemented)
 */
export async function callApi(
  apiId: string,
  options: CallApiOptions = {}
): Promise<CallApiResult> {
  throw new Error(
    "Data API service is not available in standalone version. " +
    "Please implement direct API calls to external services as needed."
  );
}
