import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

interface BodyParserError {
  type?: string;
}

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
}

// Express recognises an error handler by its four parameters,
// so `next` must stay in the signature even though we rarely use it.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  // If a response has already started, Express must handle it.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Errors thrown by express.json() carry a `type` property.
  const type = (err as BodyParserError | undefined)?.type;

  if (type === "entity.parse.failed") {
    sendError(res, 400, "INVALID_JSON", "Request body is not valid JSON.");
    return;
  }

  if (type === "entity.too.large") {
    sendError(res, 413, "PAYLOAD_TOO_LARGE", "Request body is too large.");
    return;
  }

  // Anything else is unexpected: log the real error on the server,
  // but send the client only a generic message.
  console.error("Unhandled error:", err);
  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "Something went wrong. Please try again later.",
  );
}