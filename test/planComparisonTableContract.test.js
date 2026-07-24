/**
 * PlanComparisonTable contract: API payload mapping + fallback preserves chart shape.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "../src/components/PlanComparisonTable.jsx");

test("PlanComparisonTable keeps fallback chart columns and feature labels", () => {
  const src = readFileSync(SRC, "utf8");
  assert.match(src, /FALLBACK_PLAN_COLUMNS/);
  assert.match(src, /name: "Standard"/);
  assert.match(src, /name: "Pro"/);
  assert.match(src, /name: "Founder's\*"/);
  assert.match(src, /11% commission/);
  assert.match(src, /8% · 2-year lock/);
  assert.match(src, /Online ordering/);
  assert.match(src, /Professional restaurant profile/);
  assert.match(src, /api\/public\/subscription-comparison/);
  assert.match(src, /API_BASE/);
  // Visual markers preserved
  assert.match(src, /#1F4E3D/);
  assert.match(src, /#92400e/);
  assert.match(src, /#fffdf7/);
  assert.match(src, /Subscription/);
});

test("normalizeApiPayload exported for mapping structured chart data", () => {
  const src = readFileSync(SRC, "utf8");
  assert.match(src, /function normalizeApiPayload/);
  assert.match(src, /export \{ FALLBACK_FEATURES/);
});
