import { z, type ZodError } from "zod";

export const departmentEnum = z.enum([
  "Engineering",
  "Sales",
  "Marketing",
  "HR",
  "Finance",
  "Operations",
  "Design",
]);

export const statusEnum = z.enum(["active", "deprecated", "trial"]);

const nameSchema = z
  .string()
  .min(2, "Name is required and must be 2-100 characters")
  .max(100, "Name is required and must be 2-100 characters");

const costSchema = z
  .number()
  .min(0, "Must be a positive number")
  .refine(
    (value) => Number.isInteger(value * 100),
    "Must contain max 2 decimal places",
  );

const baseToolSchema = z.object({
  name: nameSchema,
  description: z.string().max(1000).optional(),
  vendor: z
    .string()
    .min(1, "Vendor is required")
    .max(100, "Vendor must be 100 characters max"),
  website_url: z.string().url("Must be a valid URL format").optional(),
  category_id: z.number().int().positive(),
  monthly_cost: costSchema,
  owner_department: departmentEnum,
  status: statusEnum.optional(),
});

export const createToolSchema = baseToolSchema;

export const updateToolSchema = baseToolSchema
  .partial()
  .refine((payload) => Object.keys(payload).length > 0, "At least one field must be provided");

export const listToolsQuerySchema = z.object({
  department: departmentEnum.optional(),
  status: statusEnum.optional(),
  min_cost: z.coerce.number().min(0).optional(),
  max_cost: z.coerce.number().min(0).optional(),
  category: z.string().min(1).max(50).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sort_by: z.enum(["cost", "name", "date"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const toolIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const formatZodError = (error: ZodError): Record<string, string> => {
  const details: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "request");
    details[key] = issue.message;
  }

  return details;
};
