import {
  type DepartmentType,
  Prisma,
  type PrismaClient,
  type ToolStatusType,
} from "@prisma/client";
import prisma from "../lib/prisma.js";
import type {
  CreateToolInput,
  ListToolsQuery,
  UpdateToolInput,
  UsageMetrics,
} from "../types/tool.js";
import { AppError } from "../utils/errors.js";
import { toToolDetail, toToolListItem, toToolWriteResponse } from "../utils/transformers.js";

type DbClient = PrismaClient | typeof prisma;

export type ToolWithRelations = Prisma.ToolGetPayload<{
  include: { category: true };
}>;

const departmentApiToDb: Record<CreateToolInput["owner_department"], DepartmentType> = {
  Engineering: "ENGINEERING",
  Sales: "SALES",
  Marketing: "MARKETING",
  HR: "HR",
  Finance: "FINANCE",
  Operations: "OPERATIONS",
  Design: "DESIGN",
};

const statusApiToDb: Record<"active" | "deprecated" | "trial", ToolStatusType> = {
  active: "ACTIVE",
  deprecated: "DEPRECATED",
  trial: "TRIAL",
};

const sortConfig: Record<ListToolsQuery["sort_by"], "monthlyCost" | "name" | "createdAt"> = {
  cost: "monthlyCost",
  name: "name",
  date: "createdAt",
};

const parseFilters = (query: ListToolsQuery): Prisma.ToolWhereInput => {
  const where: Prisma.ToolWhereInput = {};

  if (query.department) {
    where.ownerDepartment = departmentApiToDb[query.department];
  }

  if (query.status) {
    where.status = statusApiToDb[query.status];
  }

  if (query.category) {
    where.category = { name: query.category };
  }

  if (query.min_cost !== undefined || query.max_cost !== undefined) {
    // Build a single numeric range object to keep Prisma filter generation predictable.
    where.monthlyCost = {};

    if (query.min_cost !== undefined) {
      where.monthlyCost.gte = query.min_cost;
    }

    if (query.max_cost !== undefined) {
      where.monthlyCost.lte = query.max_cost;
    }
  }

  return where;
};

export const listTools = async (query: ListToolsQuery) => {
  const where = parseFilters(query);

  const [total, filtered, tools] = await Promise.all([
    prisma.tool.count(),
    prisma.tool.count({ where }),
    prisma.tool.findMany({
      where,
      include: { category: true },
      orderBy: {
        [sortConfig[query.sort_by]]: query.order,
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    data: tools.map(toToolListItem),
    total,
    filtered,
    page: query.page,
    limit: query.limit,
    filters_applied: {
      ...(query.department ? { department: query.department } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.min_cost !== undefined ? { min_cost: query.min_cost } : {}),
      ...(query.max_cost !== undefined ? { max_cost: query.max_cost } : {}),
      ...(query.category ? { category: query.category } : {}),
    },
  };
};

const getUsageMetrics = async (toolId: number): Promise<UsageMetrics> => {
  const now = new Date();
  const last30 = new Date(now);
  // Business rule: usage insights are limited to the trailing 30-day window.
  last30.setDate(now.getDate() - 30);

  const aggregate = await prisma.usageLog.aggregate({
    where: {
      toolId,
      sessionDate: {
        gte: last30,
      },
    },
    _count: {
      id: true,
    },
    _avg: {
      usageMinutes: true,
    },
  });

  return {
    last_30_days: {
      total_sessions: aggregate._count.id,
      avg_session_minutes: Math.round(aggregate._avg.usageMinutes ?? 0),
    },
  };
};

export const getToolById = async (id: number) => {
  const tool = await prisma.tool.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!tool) {
    throw new AppError(404, "Tool not found", `Tool with ID ${id} does not exist`);
  }

  const usageMetrics = await getUsageMetrics(id);
  return toToolDetail(tool, usageMetrics);
};

const assertCategoryExists = async (db: DbClient, categoryId?: number) => {
  if (!categoryId) {
    return;
  }

  const category = await db.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new AppError(400, "Validation failed", "Validation failed", {
      category_id: "Category does not exist",
    });
  }
};

const mapUpdateToolPayloadToDb = (payload: UpdateToolInput): Prisma.ToolUpdateInput => {
  const result: Prisma.ToolUpdateInput = {};

  if (payload.name !== undefined) result.name = payload.name;
  if (payload.description !== undefined) result.description = payload.description;
  if (payload.vendor !== undefined) result.vendor = payload.vendor;
  if (payload.website_url !== undefined) result.websiteUrl = payload.website_url;
  // Category is connected by relation to ensure FK validation at ORM level.
  if (payload.category_id !== undefined) result.category = { connect: { id: payload.category_id } };
  if (payload.monthly_cost !== undefined) result.monthlyCost = payload.monthly_cost;
  if (payload.owner_department !== undefined) {
    result.ownerDepartment = departmentApiToDb[payload.owner_department];
  }
  if (payload.status !== undefined) result.status = statusApiToDb[payload.status];

  return result;
};

export const createTool = async (payload: CreateToolInput) => {
  await assertCategoryExists(prisma, payload.category_id);

  const existing = await prisma.tool.findFirst({
    where: { name: payload.name },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(400, "Validation failed", "Validation failed", {
      name: "Name must be unique",
    });
  }

  const tool = await prisma.tool.create({
    data: {
      name: payload.name,
      description: payload.description,
      vendor: payload.vendor,
      websiteUrl: payload.website_url,
      category: { connect: { id: payload.category_id } },
      monthlyCost: payload.monthly_cost,
      ownerDepartment: departmentApiToDb[payload.owner_department],
      activeUsersCount: 0,
      // New tools are considered active by default until explicit lifecycle changes.
      status: "ACTIVE",
    },
    include: { category: true },
  });

  return toToolWriteResponse(tool);
};

export const updateTool = async (id: number, payload: UpdateToolInput) => {
  const current = await prisma.tool.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!current) {
    throw new AppError(404, "Tool not found", `Tool with ID ${id} does not exist`);
  }

  if (payload.category_id !== undefined) {
    await assertCategoryExists(prisma, payload.category_id);
  }

  if (payload.name && payload.name !== current.name) {
    const existing = await prisma.tool.findFirst({
      where: {
        name: payload.name,
        NOT: { id },
      },
      select: { id: true },
    });
    if (existing) {
      throw new AppError(400, "Validation failed", "Validation failed", {
        name: "Name must be unique",
      });
    }
  }

  const updated = await prisma.tool.update({
    where: { id },
    data: mapUpdateToolPayloadToDb(payload),
    include: { category: true },
  });

  return toToolWriteResponse(updated);
};
