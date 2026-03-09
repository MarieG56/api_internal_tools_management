import type { Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import {
  departmentCostsQuerySchema,
  expensiveToolsQuerySchema,
  formatAnalyticsValidationError,
  lowUsageQuerySchema,
} from "../validators/analyticsValidators.js";
import { AppError } from "../utils/errors.js";
import {
  getDepartmentCosts,
  getExpensiveTools,
  getLowUsageTools,
  getToolsByCategory,
  getVendorSummary,
} from "../services/analyticsService.js";

const validate = <T>(schema: ZodTypeAny, payload: unknown): T => {
  try {
    return schema.parse(payload) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(
        400,
        "Invalid analytics parameter",
        "Invalid analytics parameter",
        formatAnalyticsValidationError(error),
      );
    }
    throw error;
  }
};

export const departmentCostsHandler = async (req: Request, res: Response) => {
  const query = validate<{ sort_by: "total_cost" | "department"; order: "asc" | "desc" }>(
    departmentCostsQuerySchema,
    req.query,
  );
  const result = await getDepartmentCosts(query.sort_by, query.order);
  res.status(200).json(result);
};

export const expensiveToolsHandler = async (req: Request, res: Response) => {
  const query = validate<{ limit: number; min_cost: number }>(expensiveToolsQuerySchema, req.query);
  const result = await getExpensiveTools(query.limit, query.min_cost);
  res.status(200).json(result);
};

export const toolsByCategoryHandler = async (_req: Request, res: Response) => {
  const result = await getToolsByCategory();
  res.status(200).json(result);
};

export const lowUsageToolsHandler = async (req: Request, res: Response) => {
  const query = validate<{ max_users: number }>(lowUsageQuerySchema, req.query);
  const result = await getLowUsageTools(query.max_users);
  res.status(200).json(result);
};

export const vendorSummaryHandler = async (_req: Request, res: Response) => {
  const result = await getVendorSummary();
  res.status(200).json(result);
};
