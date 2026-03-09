import assert from "node:assert/strict";
import test from "node:test";
import {
  getCostPerUser,
  getEfficiencyRating,
  getVendorEfficiency,
  getWarningLevel,
} from "../src/services/analyticsService.js";

test("analytics rating thresholds match business rules", () => {
  assert.equal(getEfficiencyRating(4, 10), "excellent");
  assert.equal(getEfficiencyRating(5, 10), "good");
  assert.equal(getEfficiencyRating(8, 10), "good");
  assert.equal(getEfficiencyRating(10, 10), "average");
  assert.equal(getEfficiencyRating(12, 10), "average");
  assert.equal(getEfficiencyRating(13, 10), "low");
});

test("warning level handles zero users and thresholds", () => {
  assert.equal(getWarningLevel(100, 0), "high");
  assert.equal(getWarningLevel(19.99, 1), "low");
  assert.equal(getWarningLevel(20, 1), "medium");
  assert.equal(getWarningLevel(50, 1), "medium");
  assert.equal(getWarningLevel(50.01, 1), "high");
});

test("vendor efficiency thresholds are applied correctly", () => {
  assert.equal(getVendorEfficiency(4.99), "excellent");
  assert.equal(getVendorEfficiency(5), "good");
  assert.equal(getVendorEfficiency(15), "good");
  assert.equal(getVendorEfficiency(15.01), "average");
  assert.equal(getVendorEfficiency(25), "average");
  assert.equal(getVendorEfficiency(25.01), "poor");
});

test("cost per user avoids division by zero", () => {
  assert.equal(getCostPerUser(100, 0), 100);
  assert.equal(getCostPerUser(100, 4), 25);
});
