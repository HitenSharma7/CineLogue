import type { RequestHandler, Response } from "express";
import type { z } from "zod";
import { AppError } from "../utils/AppError";

type Location = "params" | "query" | "body";
type Schemas = Partial<Record<Location, z.ZodType>>;

interface ValidationIssue {
  location: Location;
  path: string;
  message: string;
}

const LOCATIONS: Location[] = ["params", "query", "body"];

export function validate(schemas: Schemas): RequestHandler {
  return (req, res, next) => {
    const issues: ValidationIssue[] = [];
    const validated: Partial<Record<Location, unknown>> = {};

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);

      if (result.success) {
        validated[location] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({
            location,
            path: issue.path.map(String).join("."),
            message: issue.message,
          });
        }
      }
    }

    if (issues.length > 0) {
      next(
        new AppError(400, "VALIDATION_ERROR", "Request validation failed.", issues),
      );
      return;
    }

    res.locals.validated = validated;
    next();
  };
}

export function getValidated<T>(res: Response, location: Location): T {
  const value = res.locals.validated?.[location];

  if (value === undefined) {
    throw new AppError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Request validation middleware was not applied.",
    );
  }

  return value as T;
}
