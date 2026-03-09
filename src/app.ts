import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import openapiSpec from "./docs/openapi.js";
import { httpLogger } from "./lib/logger.js";
import errorHandler from "./middlewares/errorHandler.js";
import notFound from "./middlewares/notFound.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import toolRoutes from "./routes/toolRoutes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use("/api/tools", toolRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
