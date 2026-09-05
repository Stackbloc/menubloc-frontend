/**
 * Phase 4 — What I'm Eating structured signal + video + discovery return.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Ate compose uses structured signal kinds + food type icons", () => {
  const utils = read("src/pages/consumer/myMenuply/eatingHubUtils.js");
  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  const hub = read("src/pages/consumer/myMenuply/EatingHubSection.jsx");
  const panel = read("src/pages/consumer/myMenuply/WantDiscoveryPanel.jsx");

  assert.match(utils, /ATE_SIGNAL_KINDS/);
  assert.match(utils, /Video is core for Feed discovery/);
  assert.match(compose, /ate-signal-/);
  assert.match(compose, /ate-food-type-/);
  assert.match(compose, /Video \(core\) or photo/);
  assert.match(compose, /ateKind/);
  assert.match(compose, /foodInterestKey/);

  assert.match(page, /signal_kind/);
  assert.match(page, /food_interest_key/);
  assert.match(page, /setWantDiscovery\(data\.discovery\)/);
  assert.match(page, /ateKind/);

  assert.match(hub, /mode="ate"/);
  assert.match(hub, /lastPost\?\.kind === "diary"/);
  assert.match(panel, /mode === "ate"/);
  assert.match(panel, /You're eating/);
});

test("EATING_COMPOSE_CATEGORIES order unchanged (ate first)", () => {
  const utils = read("src/pages/consumer/myMenuply/eatingHubUtils.js");
  const ate = utils.indexOf('id: "ate"');
  const want = utils.indexOf('id: "want"');
  const plan = utils.indexOf('id: "plan"');
  assert.ok(ate > 0 && want > ate && plan > want);
});
