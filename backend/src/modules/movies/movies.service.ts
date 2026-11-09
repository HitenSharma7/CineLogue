
import { reeldbGet } from "../../integrations/reeldb/reeldb.client";
import { AppError } from "../../utils/AppError";
import {
  mapCreditsResponse,
  mapDetailsResponse,
  mapSearchResponse,
} from "./movies.mapper";
import type { SearchResult, TitleDetails } from "./movies.types";
import type {
  SearchQuery,
  TitleDetailsQuery,
  TitleIdParams,
} from "./movies.validation";

export async function searchTitles(
  query: SearchQuery,
): Promise<SearchResult> {
  const result = await reeldbGet("/v1/search", {
    q: query.q,
    page: query.page,
    type: query.type,
  });

  if (!result.found) {
    console.error("[reeldb] unexpected HTTP 404 on /v1/search");

    throw new AppError(
      502,
      "PROVIDER_ERROR",
      "The movie data service is temporarily unavailable.",
    );
  }

  return mapSearchResponse(result.data);
}

export async function getTitleDetails(
  params: TitleIdParams,
  query: TitleDetailsQuery,
): Promise<TitleDetails> {
  const isImdbId = params.id.startsWith("tt");

  if (!isImdbId && !query.type) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Request validation failed.",
      [
        {
          location: "query",
          path: "type",
          message:
            "type (movie or series) is required when using a TMDb id",
        },
      ],
    );
  }

  const titleParams = {
    ...(isImdbId
      ? { imdb: params.id }
      : { tmdb: params.id }),
    type: query.type,
    append: "ratings,cast,providers",
  };

  const result = await reeldbGet("/v1/title", titleParams);
console.log("RAW REELDB TITLE RESPONSE:");


  if (!result.found) {
    throw new AppError(
      404,
      "TITLE_NOT_FOUND",
      "No title was found for that ID.",
    );
  }
  console.dir(result.data, {
  depth: null,
  colors: true,
});

  const details = mapDetailsResponse(
    result.data,
    isImdbId
      ? { imdb: params.id }
      : { tmdb: Number(params.id) },
  );

  try {
    const creditsResult = await reeldbGet(
      `/v1/title/${encodeURIComponent(params.id)}/cast`,
      {},
    );

    if (!creditsResult.found) {
      return details;
    }

    return {
      ...details,
      credits: mapCreditsResponse(creditsResult.data),
    };
  } catch {
    console.error(
      "[reeldb] credits unavailable; returning title details without credits",
    );

    return details;
  }
}
