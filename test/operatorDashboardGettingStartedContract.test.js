/**
 * Contract: OperatorDashboard shows Welcome to Menuply / Getting started
 * checklist with menulab and related survey task links when a restaurant
 * is linked. Finish setup cards remain separate.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("OperatorDashboard has Welcome / Getting started checklist with menulab link", () => {
  const src = read("src/pages/operator/OperatorDashboard.jsx");
  assert.match(src, /Welcome to Menuply/);
  assert.match(src, /Getting started/);
  assert.match(src, /Claim your profile/);
  assert.match(src, /Add or review your menu/);
  assert.match(src, /\/operator\/menulab/);
  assert.match(src, /Complete restaurant information/);
  assert.match(src, /\/operator\/profile-editor/);
  assert.match(src, /Add photos/);
  assert.match(src, /Explore the Menuply community/);
  assert.match(src, /Create your first post or promotion/);
  assert.match(src, /\/operator\/deals/);
  assert.match(src, /Finish setup/);
});
