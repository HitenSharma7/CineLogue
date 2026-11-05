
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { AppError } from "../src/utils/AppError";

const { mockEnv } = vi.hoisted(() => ({
  mockEnv: {
    REELDB_BASE_URL: "https://reeldb.example",
    REELDB_API_KEY: "test-api-key",
    REELDB_TIMEOUT_MS: 1000,
  },
}));

vi.mock("../src/config/env", () => ({
  env: mockEnv,
}));

import { reeldbGet } from "../src/integrations/reeldb/reeldb.client";

const fetchMock = vi.fn();

function mockResponse(status: number, body: string) {
  return {
    status,
    text: vi.fn().mockResolvedValue(body),
  };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

describe("reeldbGet", () => {
  it("returns parsed JSON on success", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, JSON.stringify({ title: "The Matrix" })),
    );

    await expect(
      reeldbGet("/v1/title", { imdb: "tt0133093" }),
    ).resolves.toEqual({
      found: true,
      data: { title: "The Matrix" },
    });
  });

  it("returns found false on HTTP 404", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(404, "not found"),
    );

    await expect(
      reeldbGet("/v1/title", { imdb: "tt0133093" }),
    ).resolves.toEqual({ found: false });
  });

  it.each([401, 403])(
    "converts HTTP %i into a safe provider error",
    async (status) => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(status, "unauthorized"),
      );

      await expect(
        reeldbGet("/v1/title", {}),
      ).rejects.toMatchObject({
        statusCode: 502,
        code: "PROVIDER_ERROR",
      });
    },
  );

  it("handles provider rate limiting", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(429, "slow down"),
    );

    await expect(
      reeldbGet("/v1/search", { q: "Matrix" }),
    ).rejects.toMatchObject({
      statusCode: 503,
      code: "PROVIDER_RATE_LIMITED",
    });
  });

  it.each([500, 502, 503])(
    "converts HTTP %i into a provider error",
    async (status) => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(status, "server error"),
      );

      await expect(
        reeldbGet("/v1/search", { q: "Matrix" }),
      ).rejects.toMatchObject({
        statusCode: 502,
        code: "PROVIDER_ERROR",
      });
    },
  );

  it("rejects invalid JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, "{invalid json"),
    );

    await expect(
      reeldbGet("/v1/title", {}),
    ).rejects.toMatchObject({
      statusCode: 502,
      code: "PROVIDER_BAD_RESPONSE",
    });
  });

  it("rejects a response body larger than the configured limit", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, "x".repeat(2_000_001)),
    );

    await expect(
      reeldbGet("/v1/title", {}),
    ).rejects.toMatchObject({
      statusCode: 502,
      code: "PROVIDER_BAD_RESPONSE",
    });
  });

  it("converts network failures into a safe provider error", async () => {
    fetchMock.mockRejectedValueOnce(
      new TypeError("network failure"),
    );

    await expect(
      reeldbGet("/v1/search", { q: "Matrix" }),
    ).rejects.toMatchObject({
      statusCode: 502,
      code: "PROVIDER_UNAVAILABLE",
    });
  });

  it("does not expose the API key in error messages", async () => {
    fetchMock.mockRejectedValueOnce(
      new TypeError("network failure"),
    );

    await expect(
      reeldbGet("/v1/search", { q: "Matrix" }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(AppError);
      expect((error as Error).message).not.toContain(
        mockEnv.REELDB_API_KEY,
      );
      return true;
    });
  });

  it("converts a timeout-shaped failure into HTTP 504", async () => {
    const timeoutError = new Error("Request timed out");
    timeoutError.name = "TimeoutError";

    fetchMock.mockRejectedValueOnce(timeoutError);

    await expect(
      reeldbGet("/v1/search", { q: "Matrix" }),
    ).rejects.toMatchObject({
      statusCode: 504,
      code: "PROVIDER_TIMEOUT",
    });
  });

  it("constructs the correct URL and request options", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, JSON.stringify({ results: [] })),
    );

    await reeldbGet("/v1/search", {
      q: "Spider-Man & Friends",
      page: 2,
      type: undefined,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [input, options] = fetchMock.mock.calls[0] as [
      string | URL,
      RequestInit,
    ];

    const url = new URL(String(input));

    expect(url.origin).toBe("https://reeldb.example");
    expect(url.pathname).toBe("/v1/search");
    expect(url.searchParams.get("q")).toBe("Spider-Man & Friends");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("apikey")).toBe("test-api-key");
    expect(url.searchParams.has("type")).toBe(false);

    expect(options.method).toBe("GET");
    expect(options.redirect).toBe("error");
    expect(options.headers).toEqual({
      Accept: "application/json",
    });
    expect(options.signal).toBeDefined();
  });

  it("does not expose the API key in error logs", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    fetchMock.mockRejectedValueOnce(
      new TypeError("network failure"),
    );

    await expect(
      reeldbGet("/v1/search", { q: "Matrix" }),
    ).rejects.toBeInstanceOf(AppError);

    const loggedText = consoleError.mock.calls.flat().join(" ");

    expect(consoleError).toHaveBeenCalled();
    expect(loggedText).not.toContain(mockEnv.REELDB_API_KEY);
  });

  it("converts response-body reading failures into a safe provider error", async () => {
    fetchMock.mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockRejectedValue(
        new TypeError("Connection lost"),
      ),
    });

    await expect(
      reeldbGet("/v1/search", { q: "Matrix" }),
    ).rejects.toMatchObject({
      statusCode: 502,
      code: "PROVIDER_UNAVAILABLE",
    });
  });
});
