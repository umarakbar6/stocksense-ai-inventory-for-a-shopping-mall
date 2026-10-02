import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "./app-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const requestId = response.locals.requestId as string;

  if (error instanceof AppError) {
    response.status(error.status).json({ error: { code: error.code, message: error.message, requestId, details: error.details } });
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      error: { code: "VALIDATION_FAILED", message: "The request data is invalid.", requestId, details: error.flatten() },
    });
    return;
  }

  const transportError = error as { status?: number; type?: string };
  if (transportError.status === 413 || transportError.type === "entity.too.large") {
    response.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "The request body is too large.", requestId } });
    return;
  }
  if (error instanceof SyntaxError && transportError.status === 400) {
    response.status(400).json({ error: { code: "VALIDATION_FAILED", message: "The request body is not valid JSON.", requestId } });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    response.status(409).json({ error: { code: "DUPLICATE_VALUE", message: "A unique value is already in use.", requestId } });
    return;
  }

  console.error("Unhandled backend error", { requestId, category: error instanceof Error ? error.name : "UnknownError" });
  response.status(500).json({ error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred.", requestId } });
};

