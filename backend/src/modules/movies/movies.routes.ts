
import { Router } from "express";
import { validate } from "../../middleware/validate";
import {
  searchQuerySchema,
  titleIdParamsSchema,
  titleDetailsQuerySchema,
} from "./movies.validation";
import {
  searchMovies,
  getMovieDetails,
} from "./movies.controller";

const router = Router();

router.get(
  "/search",
  validate({ query: searchQuerySchema }),
  searchMovies,
);

router.get(
  "/:id",
  validate({
    params: titleIdParamsSchema,
    query: titleDetailsQuerySchema,
  }),
  getMovieDetails,
);

export default router;
