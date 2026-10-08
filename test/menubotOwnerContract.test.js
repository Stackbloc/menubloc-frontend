import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("Owner nav says Menubot and points at /owner/menubot", () => {
  const layout = read("src/pages/owner/OwnerLayout.jsx");
  assert.match(layout, /\{ to: "\/owner\/menubot", label: "Menubot" \}/);
  assert.doesNotMatch(layout, /label: "Knowledge Bot"/);
});

test("Menubot routes exist; legacy knowledge-bot URLs still resolve", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/owner\/menubot"/);
  assert.match(app, /path="\/owner\/menubot\/history"/);
  assert.match(app, /path="\/owner\/knowledge-bot"/);
  assert.match(app, /path="\/owner\/knowledge-bot\/history"/);
});

test("Menubot page is a 3-step flow with review before publish", () => {
  const page = read("src/pages/owner/OwnerKnowledgeBot.jsx");
  const steps = page.match(/const STEPS = \[([\s\S]*?)\];/)[1];
  assert.equal((steps.match(/id:/g) || []).length, 3);
  assert.match(steps, /Restaurant/);
  assert.match(steps, /Menu sources/);
  assert.match(steps, /Review & publish/);
  assert.match(page, /findKnowledgeBotMenu/);
  assert.match(page, /listKnowledgeBotClusters/);
  assert.match(page, /publishBlocked/);
  assert.match(page, /title="Menubot"/);
});

test("Menubot API helpers target existing backend routes", () => {
  const api = read("src/lib/ownerApi.js");
  assert.match(api, /\/api\/owner\/knowledge-bot\/jobs\/\$\{encodeURIComponent\(String\(jobId\)\)\}\/find/);
  assert.match(api, /\/api\/owner\/knowledge-bot\/lookup\/clusters/);
});
