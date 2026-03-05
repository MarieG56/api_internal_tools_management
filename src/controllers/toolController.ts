import type { Request, Response } from "express";
import type { z, ZodTypeAny } from "zod";
import { ZodError } from "zod";
import {
  createToolSchema,
  formatZodError,
  listToolsQuerySchema,
  toolIdSchema,
  updateToolSchema,
} from "../validators/toolValidators.js";
import { AppError } from "../utils/errors.js";
import {
  createTool,
  getToolById,
  listTools,
  updateTool,
} from "../services/toolService.js";

const validate = <T>(schema: ZodTypeAny, payload: unknown): T => {
  try {
    return schema.parse(payload) as T;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(400, "Validation failed", "Validation failed", formatZodError(error));
    }
    throw error;
  }
};

export const listToolsHandler = async (req: Request, res: Response) => {
  const query = validate<z.infer<typeof listToolsQuerySchema>>(listToolsQuerySchema, req.query);

  if (query.min_cost !== undefined && query.max_cost !== undefined && query.min_cost > query.max_cost) {
    throw new AppError(400, "Validation failed", "Validation failed", {
      min_cost: "min_cost must be lower or equal to max_cost",
    });
  }

  const result = await listTools(query);
  res.status(200).json(result);
};

export const getToolByIdHandler = async (req: Request, res: Response) => {
  const { id } = validate<z.infer<typeof toolIdSchema>>(toolIdSchema, req.params);
  const result = await getToolById(id);
  res.status(200).json(result);
};

export const createToolHandler = async (req: Request, res: Response) => {
  const payload = validate<z.infer<typeof createToolSchema>>(createToolSchema, req.body);
  const result = await createTool(payload);
  res.status(201).json(result);
};

export const updateToolHandler = async (req: Request, res: Response) => {
  const { id } = validate<z.infer<typeof toolIdSchema>>(toolIdSchema, req.params);
  const payload = validate<z.infer<typeof updateToolSchema>>(updateToolSchema, req.body);
  const result = await updateTool(id, payload);
  res.status(200).json(result);
};
