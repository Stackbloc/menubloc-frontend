import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const repoUrl = new URL("../", import.meta.url);
const sourceFiles = [
  "src/App.jsx",
  "src/components/GrubbidHomeV1.jsx",
  "src/pages/FoodInterestsPage.jsx",
  "src/pages/GrubbidDiscovery.jsx",
  "src/pages/consumer/ConsumerFollowing.jsx",
  "src/lib/api.js",
].map((path) => readFileSync(new URL(path, repoUrl), "utf8"));

test("Waiter owns discovery without the retired directory route or components", () => {
  const retiredPage = ["Browse", "Menus"].join("");
  const retiredCard = ["Menu", "Preview", "Card"].join("");
  const retiredRoute = ["/browse", "-menus"].join("");
  assert.equal(existsSync(new URL(`src/pages/${retiredPage}.jsx`, repoUrl)), false);
  assert.equal(existsSync(new URL(`src/components/browse/${retiredCard}.jsx`, repoUrl)), false);
  assert.equal(sourceFiles.join("\n").includes(retiredRoute), false);
  assert.equal(sourceFiles.join("\n").includes(retiredPage), false);
});

test("Waiter renders only bounded real-data payload collections", () => {
  const source = readFileSync(new URL("src/pages/FoodInterestsPage.jsx", repoUrl), "utf8");
  assert.match(source, /briefing\?\.suggestions/);
  assert.match(source, /\.slice\(0, 5\)/);
  assert.match(source, /briefing\?\.deals/);
  assert.match(source, /\.slice\(0, 3\)/);
  assert.doesNotMatch(source, /Egg McMuffin|Chicken Caesar Salad|Chicken Parmesan/);
});
