import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";
import { logger } from "../lib/logger.js";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const requestContext = { method: req.method, path: req.originalUrl };
  void next;

  if (err instanceof AppError) {
    logger.info(
      { ...requestContext, statusCode: err.statusCode, error: err.error, details: err.details },
      "Handled tool error",
    );
    return res.status(err.statusCode).json({
      error: err.error,
      ...(err.message ? { message: err.message } : {}),
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    logger.error({ ...requestContext, error: err.message }, "Database initialization error");
    return res.status(500).json({
      error: "Internal server error",
      message: "Database connection failed",
    });
  }

  if (err instanceof SyntaxError && "body" in err) {
    logger.info({ ...requestContext, error: err.message }, "Invalid JSON payload");
    return res.status(400).json({
      error: "Validation failed",
      details: {
        body: "Invalid JSON payload",
      },
    });
  }

  logger.error({ ...requestContext, err }, "Unexpected unhandled error");

  return res.status(500).json({
    error: "Internal server error",
    message: "Unexpected server error",
  });
};

export default errorHandler;
