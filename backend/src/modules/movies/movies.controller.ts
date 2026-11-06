
import type { RequestHandler } from "express";
import { getValidated } from "../../middleware/validate";
import { searchTitles, getTitleDetails } from "./movies.service";
import type {
  SearchQuery,
  TitleDetailsQuery,
  TitleIdParams,
} from "./movies.validation";
import { GENRE_CATALOGUE } from "./genres/genre.catalogue";

export const searchMovies: RequestHandler = async (_req, res) => {
  const query = getValidated<SearchQuery>(res, "query");
  const result = await searchTitles(query);

  res.status(200).json({
    success: true,
    data: result,
  });
};

export const getMovieDetails: RequestHandler = async (_req, res) => {
  const params = getValidated<TitleIdParams>(res, "params");
  const query = getValidated<TitleDetailsQuery>(res, "query");
  const result = await getTitleDetails(params, query);

  res.status(200).json({
    success: true,
    data: result,
  });
};
export const getGenres: RequestHandler = async (_req, res) => {
  res.status(200).json({
    success: true,
    data: GENRE_CATALOGUE,
  });
};
