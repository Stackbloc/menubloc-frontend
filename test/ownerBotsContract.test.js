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
    ["/owner/bots/hours-bot", "Hours Bot"],
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
  assert.match(app, /path="\/owner\/bots\/hours-bot" element=.*botKey="hours_bot"/);
  const api = read("src/lib/ownerApi.js");
  for (const fn of ["listOwnerBots", "getOwnerBot", "updateOwnerBotSchedule", "runOwnerBotNow", "runNutribotForRestaurant", "getNutribotRun", "runHoursBotForRestaurant", "getHoursBotRun"]) {
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

test("Hours Bot page: restaurant lookup, market run, recent results, coverage", () => {
  const page = read("src/pages/owner/OwnerScheduledBot.jsx");
  for (const text of ["Find hours now", "Run for this market", "Recent results", "Restaurants with menus that have hours"]) {
    assert.ok(page.includes(text), `has "${text}"`);
  }
  const fmt = read("src/pages/owner/ownerBotFormat.js");
  assert.match(fmt, /path: "\/owner\/bots\/hours-bot"/);
});

test("Nutribot page: unprocessed items, template picker, bulk assign, template list and create form", () => {
  const page = read("src/pages/owner/OwnerScheduledBot.jsx");
  assert.match(page, /import NutribotTemplatesPanel from "\.\/NutribotTemplatesPanel\.jsx"/);
  assert.match(page, /botKey === "nutribot" \? <NutribotTemplatesPanel \/> : null/);
  const panel = read("src/pages/owner/NutribotTemplatesPanel.jsx");
  for (const text of ["Unprocessed items", "All restaurants", "Assign to", "Dish templates", "Create template", "Preview", "Save template", "Save anyway", "Ingredient rules (at least one)", "Franchise items are never listed"]) {
    assert.ok(panel.includes(text), `has "${text}"`);
  }
  // All seven macro levels are asked for (the backend requires them).
  for (const field of ["calorie_density_level", "protein_level", "carb_level", "fat_level", "fiber_level", "sodium_level", "sugar_level"]) {
    assert.ok(panel.includes(`"${field}"`), `asks for ${field}`);
  }
  const api = read("src/lib/ownerApi.js");
  for (const [fn, route] of [
    ["listNutribotUnprocessed", "/api/owner/bots/nutribot/unprocessed"],
    ["listNutribotTemplates", "/api/owner/bots/nutribot/templates"],
    ["searchNutribotIngredients", "/api/owner/bots/nutribot/ingredients"],
    ["createNutribotTemplate", "/api/owner/bots/nutribot/templates"],
    ["assignNutribotTemplates", "/api/owner/bots/nutribot/assign"],
  ]) {
    assert.match(api, new RegExp(`export const ${fn} =`));
    assert.ok(api.includes(route), `${fn} calls ${route}`);
  }
});
