import type { ToolWithRelations } from "../services/toolService.js";
import type { Department, ToolStatus, UsageMetrics } from "../types/tool.js";

const formatMoney = (value: unknown): number => Number(value);

export const departmentDbToApi: Record<string, Department> = {
  ENGINEERING: "Engineering",
  SALES: "Sales",
  MARKETING: "Marketing",
  HR: "HR",
  FINANCE: "Finance",
  OPERATIONS: "Operations",
  DESIGN: "Design",
};

export const statusDbToApi: Record<string, ToolStatus> = {
  ACTIVE: "active",
  DEPRECATED: "deprecated",
  TRIAL: "trial",
};

export const toToolListItem = (tool: ToolWithRelations) => ({
  id: tool.id,
  name: tool.name,
  description: tool.description,
  vendor: tool.vendor,
  category: tool.category.name,
  monthly_cost: formatMoney(tool.monthlyCost),
  owner_department: departmentDbToApi[tool.ownerDepartment],
  status: statusDbToApi[tool.status],
  website_url: tool.websiteUrl,
  active_users_count: tool.activeUsersCount,
  created_at: tool.createdAt.toISOString(),
});

export const toToolDetail = (tool: ToolWithRelations, usageMetrics: UsageMetrics) => ({
  id: tool.id,
  name: tool.name,
  description: tool.description,
  vendor: tool.vendor,
  website_url: tool.websiteUrl,
  category: tool.category.name,
  monthly_cost: formatMoney(tool.monthlyCost),
  owner_department: departmentDbToApi[tool.ownerDepartment],
  status: statusDbToApi[tool.status],
  active_users_count: tool.activeUsersCount,
  total_monthly_cost: Number(tool.monthlyCost) * tool.activeUsersCount,
  created_at: tool.createdAt.toISOString(),
  updated_at: tool.updatedAt.toISOString(),
  usage_metrics: usageMetrics,
});

export const toToolWriteResponse = (tool: ToolWithRelations) => ({
  id: tool.id,
  name: tool.name,
  description: tool.description,
  vendor: tool.vendor,
  website_url: tool.websiteUrl,
  category: tool.category.name,
  monthly_cost: formatMoney(tool.monthlyCost),
  owner_department: departmentDbToApi[tool.ownerDepartment],
  status: statusDbToApi[tool.status],
  active_users_count: tool.activeUsersCount,
  created_at: tool.createdAt.toISOString(),
  updated_at: tool.updatedAt.toISOString(),
});
