import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

test("Owner nav has one Bots section holding every bot", () => {
  const layout = read("src/pages/owner/OwnerLayout.jsx");
  const start = layout.indexOf('id: "bots"');
  assert.ok(start > 0, "Bots nav section exists");
  const section = layout.slice(start, layout.indexOf("],", start));
  for (const [to, label] of [
    ["/owner/bots", "All bots"],
    ["/owner/menubot", "Menubot"],
    ["/owner/photo-bot", "Photo Bot"],
    ["/owner/bots/nutribot", "Nutribot"],
    ["/owner/bots/language-bot", "Language Bot"],
  ]) {
    assert.ok(section.includes(`to: "${to}", label: "${label}"`), `${label} is under Bots`);
  }
  // Bots are not duplicated under Restaurant Manager.
  assert.equal(layout.split('to: "/owner/menubot"').length - 1, 1);
  assert.equal(layout.split('to: "/owner/photo-bot"').length - 1, 1);
});

test("Bot pages are routed and call /api/owner/bots", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/owner\/bots" element=.*<OwnerBots \/>/);
  assert.match(app, /path="\/owner\/bots\/nutribot" element=.*botKey="nutribot"/);
  assert.match(app, /path="\/owner\/bots\/language-bot" element=.*botKey="language_bot"/);
  const api = read("src/lib/ownerApi.js");
  for (const fn of ["listOwnerBots", "getOwnerBot", "updateOwnerBotSchedule", "runOwnerBotNow", "runNutribotForRestaurant", "getNutribotRun"]) {
    assert.match(api, new RegExp(`export const ${fn} =`));
  }
  assert.match(api, /\/api\/owner\/bots\/nutribot\/restaurants\//);
});

test("Scheduled bot page shows last run, next run, schedule, Run now and history", () => {
  const page = read("src/pages/owner/OwnerScheduledBot.jsx");
  for (const text of ["Last run", "Next run", "Run now", "Save schedule", "Run history", "Analyze menu now", "Restaurant analyses"]) {
    assert.ok(page.includes(text), `has "${text}"`);
  }
});
