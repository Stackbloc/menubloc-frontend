import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveTemplateMenuStyle } from "../src/components/menu-templates/menuPresentationUtils.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mainContent = readFileSync(
  join(root, "src/components/menu-templates/PublicMenuMainContent.jsx"),
  "utf8",
);

test("gallery styles resolve to distinct layout IDs", () => {
  assert.equal(resolveTemplateMenuStyle("v1"), "v1");
  assert.equal(resolveTemplateMenuStyle("v12"), "v12");
  assert.equal(resolveTemplateMenuStyle("v13"), "v13");
  assert.equal(resolveTemplateMenuStyle("v14"), "v14");
  assert.equal(resolveTemplateMenuStyle("v15"), "v15");
  assert.equal(resolveTemplateMenuStyle("v16"), "v1");
});

test("PublicMenuMainContent routes gallery styles to boutique layouts", () => {
  assert.match(mainContent, /RefinedDarkMenuTemplate/);
  assert.match(mainContent, /PremiumBistroMenuTemplate/);
  assert.match(mainContent, /ModernFastCasualMenuTemplate/);
  assert.match(mainContent, /FamilyDinerMenuTemplate/);
  assert.match(mainContent, /ClassicMenuTemplate/);
  assert.match(mainContent, /menuStyle === "v12".*RefinedDarkMenuTemplate/s);
  assert.match(mainContent, /menuStyle === "v13".*PremiumBistroMenuTemplate/s);
  assert.match(mainContent, /menuStyle === "v14".*ModernFastCasualMenuTemplate/s);
  assert.match(mainContent, /menuStyle === "v15".*FamilyDinerMenuTemplate/s);
  assert.doesNotMatch(mainContent, /EditorialDarkMenuTemplate/);
  assert.doesNotMatch(mainContent, /EditorialSteakhouseMenuTemplate/);
});

test("re-enabled boutique headers use Follow + icon Share rail pattern", () => {
  for (const file of [
    "RefinedDarkMenuTemplate.jsx",
    "ModernFastCasualMenuTemplate.jsx",
    "FamilyDinerMenuTemplate.jsx",
  ]) {
    const src = readFileSync(join(root, "src/components/menu-templates", file), "utf8");
    assert.match(src, /MenuHeaderNameWithActions/);
    assert.match(src, /FollowRestaurantButton/);
    assert.match(src, /iconOnly=\{true\}/);
  }
  const bistro = readFileSync(
    join(root, "src/components/menu-templates/PremiumBistroMenuTemplate.jsx"),
    "utf8",
  );
  assert.match(bistro, /FollowRestaurantButton/);
  assert.match(bistro, /iconOnly=\{true\}/);
  assert.doesNotMatch(bistro, /position: "absolute", top: 18, right: 18/);
});
