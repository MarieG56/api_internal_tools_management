import { port } from "./config/env.js";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import prisma from "./lib/prisma.js";

const server = app.listen(port, () => {
  logger.info({ port }, "Internal Tools API started");
});

const gracefulShutdown = async () => {
  logger.info("Shutting down server");
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
