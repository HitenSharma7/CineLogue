
import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(100),
  page: z.coerce.number().int().min(1).max(100).default(1),
  type: z.enum(["movie", "series"]).optional(),
});

export const titleIdParamsSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(
      /^(tt\d{7,10}|\d+)$/,
      "ID must be a valid IMDb ID or numeric TMDB ID",
    ),
});

export const titleDetailsQuerySchema = z.object({
  type: z.enum(["movie", "series"]).optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type TitleIdParams = z.infer<typeof titleIdParamsSchema>;
export type TitleDetailsQuery = z.infer<typeof titleDetailsQuerySchema>;
