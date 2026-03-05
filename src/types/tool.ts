import type { z } from "zod";
import type {
  createToolSchema,
  listToolsQuerySchema,
  updateToolSchema,
} from "../validators/toolValidators.js";

export type Department =
  | "Engineering"
  | "Sales"
  | "Marketing"
  | "HR"
  | "Finance"
  | "Operations"
  | "Design";

export type ToolStatus = "active" | "deprecated" | "trial";

export interface UsageMetrics {
  last_30_days: {
    total_sessions: number;
    avg_session_minutes: number;
  };
}

export type CreateToolInput = z.infer<typeof createToolSchema>;
export type UpdateToolInput = z.infer<typeof updateToolSchema>;
export type ListToolsQuery = z.infer<typeof listToolsQuerySchema>;
