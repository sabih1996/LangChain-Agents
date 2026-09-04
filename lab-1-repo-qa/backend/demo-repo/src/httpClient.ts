import { httpConfig } from "./config.ts";

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch JSON with retries. Transient 5xx responses are retried;
 * 4xx responses fail immediately.
 */
export async function fetchJson<T>(path: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= httpConfig.maxRetries; attempt += 1) {
    try {
      const response = await fetch(`${httpConfig.baseUrl}${path}`, {
        signal: AbortSignal.timeout(httpConfig.timeoutMs),
      });

      if (response.status >= 500) {
        throw new HttpError(`Server error ${response.status}`, response.status);
      }

      if (!response.ok) {
        throw new HttpError(`Request failed ${response.status}`, response.status);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof HttpError ? error.status >= 500 : true;
      if (!retryable || attempt === httpConfig.maxRetries) {
        throw error;
      }
      await delay(250 * attempt);
    }
  }

  throw lastError;
}
