import { mapTitleRatings } from "./ratings.mapper";
import type { MappedTitleRatings } from "./ratings.types";

/**
 * Domain entry point for ratings embedded in a ReelDB title payload.
 * Keep provider parsing in the mapper so all API consumers get identical rules.
 */
export function getTitleRatings(rawTitle: unknown): MappedTitleRatings {
  return mapTitleRatings(rawTitle);
}
