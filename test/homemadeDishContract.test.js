import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test("homemade dish routes exist in App", () => {
  const app = fs.readFileSync(path.join(root, "src/App.jsx"), "utf8");
  assert.match(app, /HomemadeDishDetailPage/);
  assert.match(app, /HomemadeDishComposePage/);
  assert.match(app, /\/homemade-dishes\/:id/);
});

test("search UI has Include Homemade toggle", () => {
  const search = fs.readFileSync(path.join(root, "src/pages/GrubbidSearchResults.jsx"), "utf8");
  assert.match(search, /include_homemade/);
  assert.match(search, /Include Homemade/);
  assert.match(search, /HomemadeDishSearchCard/);
});

test("menu item detail wires Show Me How to Make It", () => {
  const detail = fs.readFileSync(path.join(root, "src/pages/MenuItemDetailPage.jsx"), "utf8");
  assert.match(detail, /ShowMeHowToMakeIt/);
});

test("homemade API helpers use consumer routes", () => {
  const api = fs.readFileSync(path.join(root, "src/lib/homemadeDishApi.js"), "utf8");
  assert.match(api, /\/api\/consumer\/homemade-dishes/);
  assert.match(api, /menuply\.com/);
});

test("month in food model reads homemade_dishes_count", () => {
  const model = fs.readFileSync(
    path.join(root, "src/pages/consumer/monthInFood/buildMonthInFoodModel.js"),
    "utf8"
  );
  assert.match(model, /homemade_dishes_count/);
});
