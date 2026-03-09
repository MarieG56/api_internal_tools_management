const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Internal Tools API",
    version: "1.0.0",
    description: "REST API for internal SaaS tools management (PostgreSQL + Prisma).",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "Tools", description: "Tools catalog management" },
    { name: "Analytics", description: "Cost and usage analytics endpoints" },
  ],
  components: {
    schemas: {
      ToolListItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          vendor: { type: "string", nullable: true },
          category: { type: "string" },
          monthly_cost: { type: "number" },
          owner_department: { type: "string" },
          status: { type: "string", enum: ["active", "deprecated", "trial"] },
          website_url: { type: "string", nullable: true },
          active_users_count: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
        },
      },
      ToolDetail: {
        allOf: [
          { $ref: "#/components/schemas/ToolListItem" },
          {
            type: "object",
            properties: {
              updated_at: { type: "string", format: "date-time" },
              total_monthly_cost: { type: "number" },
              usage_metrics: {
                type: "object",
                properties: {
                  last_30_days: {
                    type: "object",
                    properties: {
                      total_sessions: { type: "integer" },
                      avg_session_minutes: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      ToolWriteResponse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          vendor: { type: "string", nullable: true },
          website_url: { type: "string", nullable: true },
          category: { type: "string" },
          monthly_cost: { type: "number" },
          owner_department: { type: "string" },
          status: { type: "string", enum: ["active", "deprecated", "trial"] },
          active_users_count: { type: "integer" },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" },
        },
      },
      ValidationError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          details: { type: "object" },
        },
      },
      NotFoundError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Tool not found" },
          message: { type: "string", example: "Tool with ID 999 does not exist" },
        },
      },
      InternalError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Internal server error" },
          message: { type: "string" },
        },
      },
      DepartmentCostItem: {
        type: "object",
        properties: {
          department: { type: "string" },
          total_cost: { type: "number" },
          tools_count: { type: "integer" },
          total_users: { type: "integer" },
          average_cost_per_tool: { type: "number" },
          cost_percentage: { type: "number" },
        },
      },
      ExpensiveToolItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          monthly_cost: { type: "number" },
          active_users_count: { type: "integer" },
          cost_per_user: { type: "number" },
          department: { type: "string" },
          vendor: { type: "string", nullable: true },
          efficiency_rating: { type: "string", enum: ["excellent", "good", "average", "low"] },
        },
      },
      CategoryAnalyticsItem: {
        type: "object",
        properties: {
          category_name: { type: "string" },
          tools_count: { type: "integer" },
          total_cost: { type: "number" },
          total_users: { type: "integer" },
          percentage_of_budget: { type: "number" },
          average_cost_per_user: { type: "number" },
        },
      },
      LowUsageToolItem: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          monthly_cost: { type: "number" },
          active_users_count: { type: "integer" },
          cost_per_user: { type: "number" },
          department: { type: "string" },
          vendor: { type: "string", nullable: true },
          warning_level: { type: "string", enum: ["low", "medium", "high"] },
          potential_action: { type: "string" },
        },
      },
      VendorSummaryItem: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          tools_count: { type: "integer" },
          total_monthly_cost: { type: "number" },
          total_users: { type: "integer" },
          departments: { type: "string" },
          average_cost_per_user: { type: "number" },
          vendor_efficiency: { type: "string", enum: ["excellent", "good", "average", "poor"] },
        },
      },
    },
  },
  paths: {
    "/api/tools": {
      get: {
        tags: ["Tools"],
        summary: "List tools with filters/pagination/sorting",
        parameters: [
          { name: "department", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "min_cost", in: "query", schema: { type: "number" } },
          { name: "max_cost", in: "query", schema: { type: "number" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          {
            name: "sort_by",
            in: "query",
            schema: { type: "string", enum: ["cost", "name", "date"], default: "date" },
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        ],
        responses: {
          200: {
            description: "Tools list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ToolListItem" },
                    },
                    total: { type: "integer" },
                    filtered: { type: "integer" },
                    page: { type: "integer" },
                    limit: { type: "integer" },
                    filters_applied: { type: "object" },
                  },
                },
              },
            },
          },
          400: {
            description: "Validation failed",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } },
            },
          },
          500: {
            description: "Internal server error",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/InternalError" } },
            },
          },
        },
      },
      post: {
        tags: ["Tools"],
        summary: "Create a tool",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "name",
                  "vendor",
                  "category_id",
                  "monthly_cost",
                  "owner_department",
                ],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 100 },
                  description: { type: "string" },
                  vendor: { type: "string", maxLength: 100 },
                  website_url: { type: "string", format: "uri" },
                  category_id: { type: "integer" },
                  monthly_cost: { type: "number", minimum: 0 },
                  owner_department: {
                    type: "string",
                    enum: [
                      "Engineering",
                      "Sales",
                      "Marketing",
                      "HR",
                      "Finance",
                      "Operations",
                      "Design",
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Tool created",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ToolWriteResponse" } },
            },
          },
          400: {
            description: "Validation failed",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } },
            },
          },
        },
      },
    },
    "/api/tools/{id}": {
      get: {
        tags: ["Tools"],
        summary: "Get a tool by id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          200: {
            description: "Tool detail",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ToolDetail" } },
            },
          },
          404: {
            description: "Tool not found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/NotFoundError" } },
            },
          },
        },
      },
      put: {
        tags: ["Tools"],
        summary: "Update an existing tool",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 100 },
                  description: { type: "string" },
                  vendor: { type: "string", maxLength: 100 },
                  website_url: { type: "string", format: "uri" },
                  category_id: { type: "integer" },
                  monthly_cost: { type: "number", minimum: 0 },
                  owner_department: {
                    type: "string",
                    enum: [
                      "Engineering",
                      "Sales",
                      "Marketing",
                      "HR",
                      "Finance",
                      "Operations",
                      "Design",
                    ],
                  },
                  status: { type: "string", enum: ["active", "deprecated", "trial"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Tool updated",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ToolWriteResponse" } },
            },
          },
          404: {
            description: "Tool not found",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/NotFoundError" } },
            },
          },
        },
      },
    },
    "/api/analytics/department-costs": {
      get: {
        tags: ["Analytics"],
        summary: "Cost distribution by department",
        parameters: [
          {
            name: "sort_by",
            in: "query",
            schema: { type: "string", enum: ["total_cost", "department"], default: "total_cost" },
          },
          {
            name: "order",
            in: "query",
            schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        ],
        responses: {
          200: { description: "Department costs analytics" },
          400: {
            description: "Invalid analytics parameter",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } },
          },
        },
      },
    },
    "/api/analytics/expensive-tools": {
      get: {
        tags: ["Analytics"],
        summary: "Top most expensive tools",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 10, minimum: 1, maximum: 100 } },
          { name: "min_cost", in: "query", schema: { type: "number", default: 0, minimum: 0 } },
        ],
        responses: {
          200: { description: "Expensive tools analytics" },
          400: {
            description: "Invalid analytics parameter",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } },
          },
        },
      },
    },
    "/api/analytics/tools-by-category": {
      get: {
        tags: ["Analytics"],
        summary: "Tools distribution by category",
        responses: {
          200: { description: "Category analytics" },
        },
      },
    },
    "/api/analytics/low-usage-tools": {
      get: {
        tags: ["Analytics"],
        summary: "Identify underutilized tools and savings potential",
        parameters: [
          {
            name: "max_users",
            in: "query",
            schema: { type: "integer", default: 5, minimum: 0 },
          },
        ],
        responses: {
          200: { description: "Low usage tools analytics" },
          400: {
            description: "Invalid analytics parameter",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } },
          },
        },
      },
    },
    "/api/analytics/vendor-summary": {
      get: {
        tags: ["Analytics"],
        summary: "Vendor-level summary and efficiency insights",
        responses: {
          200: { description: "Vendor analytics summary" },
        },
      },
    },
  },
};

export default openapiSpec;
