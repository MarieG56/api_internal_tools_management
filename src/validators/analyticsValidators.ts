import { z, type ZodError } from "zod";

export const departmentCostsQuerySchema = z.object({
  sort_by: z.enum(["total_cost", "department"]).default("total_cost"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const expensiveToolsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1, "Must be positive integer between 1 and 100").max(100, "Must be positive integer between 1 and 100").default(10),
  min_cost: z.coerce.number().min(0).default(0),
});

export const lowUsageQuerySchema = z.object({
  max_users: z.coerce.number().int().min(0).max(10000).default(5),
});

export const formatAnalyticsValidationError = (error: ZodError): Record<string, string> => {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "request");
    details[key] = issue.message;
  }
  return details;
};
