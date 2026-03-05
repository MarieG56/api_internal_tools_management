const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Internal Tools API",
    version: "1.0.0",
    description: "REST API for internal SaaS tools management (PostgreSQL + Prisma).",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [{ name: "Tools", description: "Tools catalog management" }],
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
  },
};

export default openapiSpec;
