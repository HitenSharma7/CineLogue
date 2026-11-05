
import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { AppError } from "../src/utils/AppError";

// Mock provider calls so tests never depend on ReelDB or the internet.
vi.mock("../src/integrations/reeldb/reeldb.client", () => ({
  reeldbGet: vi.fn(),
}));

import app from "../src/app";
import { reeldbGet } from "../src/integrations/reeldb/reeldb.client";

const mockedReeldbGet = vi.mocked(reeldbGet);

afterEach(() => {
  vi.resetAllMocks();
});

describe("API integration tests", () => {
  describe("GET /health", () => {
    it("returns 200 and the expected health response", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Movie App backend is running!",
      });
    });
  });

  describe("GET /api/v1/movies/search", () => {
    it("searches movies and returns the expected response shape", async () => {
      mockedReeldbGet.mockResolvedValueOnce({
        found: true,
        data: {
          results: [
            {
              ids: { imdb: "tt1375666", tmdb: 27205 },
              title: "Inception",
              year: 2010,
              type: "movie",
              poster: "https://example.com/inception.jpg",
              score: 8.8,
            },
          ],
          page: 1,
          pages: 1,
          total: 1,
        },
      });

      const response = await request(app)
        .get("/api/v1/movies/search")
        .query({ q: "Inception" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(1);
      expect(response.body.data.results[0].title).toBe("Inception");

      expect(mockedReeldbGet).toHaveBeenCalledWith("/v1/search", {
        q: "Inception",
        page: 1,
        type: undefined,
      });
    });

    it("rejects a missing search query", async () => {
      const response = await request(app).get("/api/v1/movies/search");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(mockedReeldbGet).not.toHaveBeenCalled();
    });

    it("rejects a search query that is too short", async () => {
      const response = await request(app)
        .get("/api/v1/movies/search")
        .query({ q: "X" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(mockedReeldbGet).not.toHaveBeenCalled();
    });

    it("rejects an invalid page number", async () => {
      const response = await request(app)
        .get("/api/v1/movies/search")
        .query({ q: "Interstellar", page: 0 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(mockedReeldbGet).not.toHaveBeenCalled();
    });

    it("returns a safe provider error when search returns not found", async () => {
      mockedReeldbGet.mockResolvedValueOnce({ found: false });

      const response = await request(app)
        .get("/api/v1/movies/search")
        .query({ q: "NonexistentFilmXYZ" });

      // Current search mapper expects a results array.
      // A provider-level not-found result is not the same as an empty result list.
      expect(response.status).toBe(502);
      expect(response.body.success).toBe(false);
      expect(mockedReeldbGet).toHaveBeenCalledOnce();
    });
  });

  describe("GET /api/v1/movies/:id", () => {
    it("rejects a malformed movie ID", async () => {
      const response = await request(app).get(
        "/api/v1/movies/not-a-valid-id",
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(mockedReeldbGet).not.toHaveBeenCalled();
    });

    it("requires type when looking up a numeric TMDb ID", async () => {
      const response = await request(app).get("/api/v1/movies/603");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
      expect(mockedReeldbGet).not.toHaveBeenCalled();
    });

    it("returns movie details for a valid IMDb ID", async () => {
      mockedReeldbGet.mockResolvedValueOnce({
        found: true,
        data: {
          ids: { imdb: "tt0816692", tmdb: 157336 },
          title: "Interstellar",
          year: 2014,
          type: "movie",
          poster: "https://example.com/interstellar.jpg",
          description: "A science-fiction film.",
        },
      });

      const response = await request(app).get(
        "/api/v1/movies/tt0816692",
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe("Interstellar");

      expect(mockedReeldbGet).toHaveBeenCalledWith("/v1/title", {
        imdb: "tt0816692",
        type: undefined,
      });
    });

    it("passes the requested type and numeric ID string to the provider", async () => {
      mockedReeldbGet.mockResolvedValueOnce({
        found: true,
        data: {
          ids: { imdb: "tt0468569", tmdb: 155 },
          title: "The Dark Knight",
          year: 2008,
          type: "movie",
        },
      });

      const response = await request(app)
        .get("/api/v1/movies/155")
        .query({ type: "movie" });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("The Dark Knight");

      expect(mockedReeldbGet).toHaveBeenCalledWith("/v1/title", {
        tmdb: "155",
        type: "movie",
      });
    });

    it("returns 404 when a movie ID does not exist", async () => {
      mockedReeldbGet.mockResolvedValueOnce({ found: false });

      const response = await request(app).get(
        "/api/v1/movies/tt9999999",
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("TITLE_NOT_FOUND");
    });
  });

  describe("Error handling and routing", () => {
    it("returns 404 for an unknown route", async () => {
      const response = await request(app).get(
        "/this-route-does-not-exist",
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it("does not expose unexpected provider error details", async () => {
      mockedReeldbGet.mockRejectedValueOnce(
        new Error("Private upstream diagnostic"),
      );

      const response = await request(app)
        .get("/api/v1/movies/search")
        .query({ q: "Dune" });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(JSON.stringify(response.body)).not.toContain(
        "Private upstream diagnostic",
      );
    });

    it("preserves a safe AppError status and error code", async () => {
      mockedReeldbGet.mockRejectedValueOnce(
        new AppError(
          503,
          "PROVIDER_RATE_LIMITED",
          "The movie data service is busy. Please try again shortly.",
        ),
      );

      const response = await request(app)
        .get("/api/v1/movies/search")
        .query({ q: "Dune" });

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("PROVIDER_RATE_LIMITED");
      expect(JSON.stringify(response.body)).not.toContain(
        "Private upstream diagnostic",
      );
    });
  });
});
