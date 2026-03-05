import pino from "pino";
import type { NextFunction, Request, Response } from "express";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const payload = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    };

    if (res.statusCode >= 500) {
      logger.error(payload, "HTTP request completed");
      return;
    }
    if (res.statusCode >= 400) {
      logger.warn(payload, "HTTP request completed");
      return;
    }

    logger.info(payload, "HTTP request completed");
  });

  next();
};
