/**
 * Yellow Browser drinks canvas — API base, style inheritance, empty-cache contract.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

describe("CatalogDrinksMenuRenderer contract", () => {
  const src = read("src/components/menuCatalog/CatalogDrinksMenuRenderer.jsx");

  it("uses shared API_BASE from api.js (no same-origin / localhost production fallback)", () => {
    assert.match(src, /API_BASE/);
    assert.match(src, /from ["'].*lib\/api\.js["']/);
    assert.doesNotMatch(src, /import\.meta\.env\.DEV \? ["']http:\/\/localhost:3001["']/);
  });

  it("inherits public menu style via shared appearance and theme resolvers", () => {
    assert.match(src, /shouldApplyMenuAppearance/);
    assert.match(src, /buildMenuAppearanceRootStyle/);
    assert.match(src, /resolveMenuPageBackground/);
    assert.match(src, /display_settings/);
    assert.match(src, /data-drinks-menu-canvas/);
  });

  it("does not permanently cache empty drinks payloads", () => {
    assert.match(src, /isCacheableDrinksPayload/);
    assert.match(src, /item_count/);
    assert.match(src, /drinksMenuPayloadCache\.delete/);
    assert.match(src, /clearDrinksMenuPayloadCache/);
  });
});
