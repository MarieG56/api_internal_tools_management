import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import app from "../src/app.js";

test("GET /api/analytics/expensive-tools returns 400 on invalid limit", async () => {
  const response = await request(app).get("/api/analytics/expensive-tools?limit=-5");
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error, "Invalid analytics parameter");
  assert.equal(response.body.details.limit, "Must be positive integer between 1 and 100");
});
