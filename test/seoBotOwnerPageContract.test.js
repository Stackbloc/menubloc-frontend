import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEDULED_BOTS, STATUS_LABELS, runResultText } from "../src/pages/owner/ownerBotFormat.js";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("SEO Bot: routed, in the Bots nav and directory, report API wired", () => {
  assert.match(read("src/App.jsx"), /path="\/owner\/bots\/seo-bot" element=.*botKey="seo_bot"/);
  assert.match(read("src/pages/owner/OwnerLayout.jsx"), /to: "\/owner\/bots\/seo-bot", label: "SEO Bot"/);
  assert.equal(SCHEDULED_BOTS.seo_bot.path, "/owner/bots/seo-bot");
  assert.match(read("src/lib/ownerApi.js"), /export const getSeoBotRun = .*\/api\/owner\/bots\/seo_bot\/runs\//);
  assert.match(read("src/pages/owner/OwnerScheduledBot.jsx"), /botKey === "seo_bot" \? <SeoBotReport bot=\{bot\} \/>/);
});

test("SEO Bot: run summary and status read in plain words", () => {
  assert.equal(STATUS_LABELS.issues_found, "Finished — issues found");
  assert.equal(
    runResultText("seo_bot", { totals: { checked: 80, problems: 1, warnings: 26, inspected: 0 } }),
    "80 pages checked · 1 problem · 26 warnings"
  );
});
