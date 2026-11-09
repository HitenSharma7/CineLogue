import { mapTitleRatings } from "./ratings.mapper";
import type { MappedTitleRatings } from "./ratings.types";

/** Domain service for normalizing ratings embedded in a ReelDB title payload. */
export function getTitleRatings(rawTitle: unknown): MappedTitleRatings {
  return mapTitleRatings(rawTitle);
}
