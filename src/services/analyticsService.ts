import prisma from "../lib/prisma.js";
import { departmentDbToApi } from "../utils/transformers.js";

const roundMoney = (value: number): number => Number(value.toFixed(2));
const roundPercentage = (value: number): number => Number(value.toFixed(1));

export const getCostPerUser = (monthlyCost: number, users: number): number =>
  users <= 0 ? monthlyCost : monthlyCost / users;

const findByMetricWithTieBreak = <T>(
  rows: T[],
  metric: (row: T) => number,
  name: (row: T) => string,
  direction: "max" | "min",
): string => {
  if (rows.length === 0) return "";
  const sorted = [...rows].sort((a, b) => {
    const metricDiff = direction === "max" ? metric(b) - metric(a) : metric(a) - metric(b);
    if (metricDiff !== 0) return metricDiff;
    return name(a).localeCompare(name(b));
  });
  return name(sorted[0]);
};

export const getDepartmentCosts = async (
  sortBy: "total_cost" | "department",
  order: "asc" | "desc",
) => {
  const tools = await prisma.tool.findMany({
    where: { status: "ACTIVE" },
    select: {
      ownerDepartment: true,
      monthlyCost: true,
      activeUsersCount: true,
    },
  });

  if (tools.length === 0) {
    return {
      data: [],
      message: "No analytics data available - ensure tools data exists",
      summary: { total_company_cost: 0 },
    };
  }

  const map = new Map<
    string,
    { department: string; total_cost: number; tools_count: number; total_users: number }
  >();
  for (const tool of tools) {
    const department = departmentDbToApi[tool.ownerDepartment] ?? tool.ownerDepartment;
    const current = map.get(department) ?? {
      department,
      total_cost: 0,
      tools_count: 0,
      total_users: 0,
    };
    current.total_cost += Number(tool.monthlyCost);
    current.tools_count += 1;
    current.total_users += tool.activeUsersCount;
    map.set(department, current);
  }

  const totalCompanyCost = [...map.values()].reduce((sum, row) => sum + row.total_cost, 0);

  const data = [...map.values()].map((row) => ({
    department: row.department,
    total_cost: roundMoney(row.total_cost),
    tools_count: row.tools_count,
    total_users: row.total_users,
    average_cost_per_tool: roundMoney(row.total_cost / row.tools_count),
    cost_percentage: roundPercentage((row.total_cost / totalCompanyCost) * 100),
  }));

  data.sort((a, b) => {
    const direction = order === "asc" ? 1 : -1;
    if (sortBy === "department") return direction * a.department.localeCompare(b.department);
    return direction * (a.total_cost - b.total_cost);
  });

  return {
    data,
    summary: {
      total_company_cost: roundMoney(totalCompanyCost),
      departments_count: data.length,
      most_expensive_department: findByMetricWithTieBreak(
        data,
        (row) => row.total_cost,
        (row) => row.department,
        "max",
      ),
    },
  };
};

type EfficiencyRating = "excellent" | "good" | "average" | "low";

export const getEfficiencyRating = (costPerUser: number, avgCompany: number): EfficiencyRating => {
  if (avgCompany <= 0) return "low";
  if (costPerUser < avgCompany * 0.5) return "excellent";
  if (costPerUser <= avgCompany * 0.8) return "good";
  if (costPerUser <= avgCompany * 1.2) return "average";
  return "low";
};

export const getExpensiveTools = async (limit: number, minCost: number) => {
  const allActiveTools = await prisma.tool.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      monthlyCost: true,
      activeUsersCount: true,
      ownerDepartment: true,
      vendor: true,
    },
  });

  const toolsForAverage = allActiveTools.filter((tool) => tool.activeUsersCount > 0);
  const totalCost = toolsForAverage.reduce((sum, tool) => sum + Number(tool.monthlyCost), 0);
  const totalUsers = toolsForAverage.reduce((sum, tool) => sum + tool.activeUsersCount, 0);
  const avgCostPerUserCompany = totalUsers > 0 ? totalCost / totalUsers : 0;

  const analyzed = allActiveTools.filter((tool) => Number(tool.monthlyCost) >= minCost);
  const ranked = analyzed
    .map((tool) => {
      const monthlyCost = Number(tool.monthlyCost);
      const costPerUser = getCostPerUser(monthlyCost, tool.activeUsersCount);
      return {
        id: tool.id,
        name: tool.name,
        monthly_cost: roundMoney(monthlyCost),
        active_users_count: tool.activeUsersCount,
        cost_per_user: roundMoney(costPerUser),
        department: departmentDbToApi[tool.ownerDepartment] ?? tool.ownerDepartment,
        vendor: tool.vendor,
        efficiency_rating: tool.activeUsersCount <= 0
          ? "low"
          : getEfficiencyRating(costPerUser, avgCostPerUserCompany),
      };
    })
    .sort((a, b) => b.monthly_cost - a.monthly_cost);

  const data = ranked.slice(0, limit);

  return {
    data,
    analysis: {
      total_tools_analyzed: analyzed.length,
      avg_cost_per_user_company: roundMoney(avgCostPerUserCompany),
      potential_savings_identified: roundMoney(
        ranked
          .filter((tool) => tool.efficiency_rating === "low")
          .reduce((sum, tool) => sum + tool.monthly_cost, 0),
      ),
    },
  };
};

export const getToolsByCategory = async () => {
  const tools = await prisma.tool.findMany({
    where: { status: "ACTIVE" },
    select: {
      monthlyCost: true,
      activeUsersCount: true,
      category: { select: { name: true } },
    },
  });

  if (tools.length === 0) {
    return {
      data: [],
      message: "No analytics data available - ensure tools data exists",
      insights: {},
    };
  }

  const byCategory = new Map<
    string,
    { category_name: string; tools_count: number; total_cost: number; total_users: number }
  >();

  for (const tool of tools) {
    const key = tool.category.name;
    const current = byCategory.get(key) ?? {
      category_name: key,
      tools_count: 0,
      total_cost: 0,
      total_users: 0,
    };
    current.tools_count += 1;
    current.total_cost += Number(tool.monthlyCost);
    current.total_users += tool.activeUsersCount;
    byCategory.set(key, current);
  }

  const totalCompanyCost = [...byCategory.values()].reduce((sum, row) => sum + row.total_cost, 0);
  const data = [...byCategory.values()].map((row) => ({
    category_name: row.category_name,
    tools_count: row.tools_count,
    total_cost: roundMoney(row.total_cost),
    total_users: row.total_users,
    percentage_of_budget: roundPercentage((row.total_cost / totalCompanyCost) * 100),
    average_cost_per_user: roundMoney(getCostPerUser(row.total_cost, row.total_users)),
  }));

  const efficientCandidates = data.filter((row) => row.total_users > 0);

  return {
    data,
    insights: {
      most_expensive_category: findByMetricWithTieBreak(
        data,
        (row) => row.total_cost,
        (row) => row.category_name,
        "max",
      ),
      most_efficient_category: findByMetricWithTieBreak(
        efficientCandidates,
        (row) => row.average_cost_per_user,
        (row) => row.category_name,
        "min",
      ),
    },
  };
};

type WarningLevel = "low" | "medium" | "high";

export const getWarningLevel = (costPerUser: number, users: number): WarningLevel => {
  if (users <= 0) return "high";
  if (costPerUser < 20) return "low";
  if (costPerUser <= 50) return "medium";
  return "high";
};

const warningAction: Record<WarningLevel, string> = {
  high: "Consider canceling or downgrading",
  medium: "Review usage and consider optimization",
  low: "Monitor usage trends",
};

export const getLowUsageTools = async (maxUsers: number) => {
  const tools = await prisma.tool.findMany({
    where: {
      status: "ACTIVE",
      activeUsersCount: { lte: maxUsers },
    },
    select: {
      id: true,
      name: true,
      monthlyCost: true,
      activeUsersCount: true,
      ownerDepartment: true,
      vendor: true,
    },
    orderBy: { monthlyCost: "desc" },
  });

  const data = tools.map((tool) => {
    const monthlyCost = Number(tool.monthlyCost);
    const costPerUser = getCostPerUser(monthlyCost, tool.activeUsersCount);
    const warningLevel = getWarningLevel(costPerUser, tool.activeUsersCount);
    return {
      id: tool.id,
      name: tool.name,
      monthly_cost: roundMoney(monthlyCost),
      active_users_count: tool.activeUsersCount,
      cost_per_user: roundMoney(costPerUser),
      department: departmentDbToApi[tool.ownerDepartment] ?? tool.ownerDepartment,
      vendor: tool.vendor,
      warning_level: warningLevel,
      potential_action: warningAction[warningLevel],
    };
  });

  const potentialMonthlySavings = data
    .filter((row) => row.warning_level === "high" || row.warning_level === "medium")
    .reduce((sum, row) => sum + row.monthly_cost, 0);

  return {
    data,
    savings_analysis: {
      total_underutilized_tools: data.length,
      potential_monthly_savings: roundMoney(potentialMonthlySavings),
      potential_annual_savings: roundMoney(potentialMonthlySavings * 12),
    },
  };
};

type VendorEfficiency = "excellent" | "good" | "average" | "poor";

export const getVendorEfficiency = (avgCostPerUser: number): VendorEfficiency => {
  if (avgCostPerUser < 5) return "excellent";
  if (avgCostPerUser <= 15) return "good";
  if (avgCostPerUser <= 25) return "average";
  return "poor";
};

export const getVendorSummary = async () => {
  const tools = await prisma.tool.findMany({
    where: { status: "ACTIVE" },
    select: {
      vendor: true,
      monthlyCost: true,
      activeUsersCount: true,
      ownerDepartment: true,
    },
  });

  if (tools.length === 0) {
    return {
      data: [],
      message: "No analytics data available - ensure tools data exists",
      vendor_insights: {},
    };
  }

  const vendorMap = new Map<
    string,
    {
      vendor: string;
      tools_count: number;
      total_monthly_cost: number;
      total_users: number;
      departmentsSet: Set<string>;
    }
  >();

  for (const tool of tools) {
    const vendor = tool.vendor ?? "Unknown";
    const current = vendorMap.get(vendor) ?? {
      vendor,
      tools_count: 0,
      total_monthly_cost: 0,
      total_users: 0,
      departmentsSet: new Set<string>(),
    };
    current.tools_count += 1;
    current.total_monthly_cost += Number(tool.monthlyCost);
    current.total_users += tool.activeUsersCount;
    current.departmentsSet.add(departmentDbToApi[tool.ownerDepartment] ?? tool.ownerDepartment);
    vendorMap.set(vendor, current);
  }

  const data = [...vendorMap.values()].map((row) => {
    const averageCostPerUser = getCostPerUser(row.total_monthly_cost, row.total_users);
    return {
      vendor: row.vendor,
      tools_count: row.tools_count,
      total_monthly_cost: roundMoney(row.total_monthly_cost),
      total_users: row.total_users,
      departments: [...row.departmentsSet].sort((a, b) => a.localeCompare(b)).join(","),
      average_cost_per_user: roundMoney(averageCostPerUser),
      vendor_efficiency: getVendorEfficiency(averageCostPerUser),
    };
  });

  const efficientVendors = data.filter((vendor) => vendor.total_users > 0);

  return {
    data,
    vendor_insights: {
      most_expensive_vendor: findByMetricWithTieBreak(
        data,
        (row) => row.total_monthly_cost,
        (row) => row.vendor,
        "max",
      ),
      most_efficient_vendor: findByMetricWithTieBreak(
        efficientVendors,
        (row) => row.average_cost_per_user,
        (row) => row.vendor,
        "min",
      ),
      single_tool_vendors: data.filter((vendor) => vendor.tools_count === 1).length,
    },
  };
};
