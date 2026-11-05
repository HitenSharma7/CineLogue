import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

type QueryParams = Record<string, string | number | undefined>;

// A 404 is handed back to the caller instead of being interpreted here:
// only the calling endpoint knows whether it means "no such title"
// or "something is wrong with our request".
export type ReeldbResult = { found: true; data: unknown } | { found: false };

const MAX_BODY_CHARS = 2_000_000;

function isTimeout(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

// Never log error.message: it may contain the request URL (and the API key).
function describeNetworkError(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as { cause?: { code?: unknown } }).cause;
    const code = typeof cause?.code === "string" ? cause.code : "unknown";
    return `${error.name} (${code})`;
  }
  return "unknown error";
}

export async function reeldbGet(
  path: string,
  params: QueryParams,
): Promise<ReeldbResult> {
  const url = new URL(path, env.REELDB_BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }
  url.searchParams.set("apikey", env.REELDB_API_KEY);

  let status: number;
  let bodyText: string;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(env.REELDB_TIMEOUT_MS),
    });
    status = response.status;
    bodyText = await response.text();
  } catch (error) {
    if (isTimeout(error)) {
      console.error(
        `[reeldb] timed out after ${env.REELDB_TIMEOUT_MS}ms on ${path}`,
      );
      throw new AppError(
        504,
        "PROVIDER_TIMEOUT",
        "The movie data service took too long to respond.",
      );
    }
    console.error(
      `[reeldb] network error on ${path}: ${describeNetworkError(error)}`,
    );
    throw new AppError(
      502,
      "PROVIDER_UNAVAILABLE",
      "The movie data service is currently unavailable.",
    );
  }

  if (status === 404) {
    return { found: false };
  }

  if (status === 401 || status === 403) {
    console.error(`[reeldb] API key rejected (HTTP ${status}) on ${path}`);
    throw new AppError(
      502,
      "PROVIDER_ERROR",
      "The movie data service is temporarily unavailable.",
    );
  }

  if (status === 429) {
    console.error(`[reeldb] rate limited (HTTP 429) on ${path}`);
    throw new AppError(
      503,
      "PROVIDER_RATE_LIMITED",
      "The movie data service is busy. Please try again shortly.",
    );
  }

  if (status < 200 || status >= 300) {
    console.error(`[reeldb] unexpected HTTP ${status} on ${path}`);
    throw new AppError(
      502,
      "PROVIDER_ERROR",
      "The movie data service is temporarily unavailable.",
    );
  }

  if (bodyText.length > MAX_BODY_CHARS) {
    console.error(`[reeldb] response too large on ${path}`);
    throw new AppError(
      502,
      "PROVIDER_BAD_RESPONSE",
      "The movie data service returned an unexpected response.",
    );
  }

  try {
    return { found: true, data: JSON.parse(bodyText) as unknown };
  } catch {
    console.error(`[reeldb] invalid JSON on ${path}`);
    throw new AppError(
      502,
      "PROVIDER_BAD_RESPONSE",
      "The movie data service returned an unexpected response.",
    );
  }
}