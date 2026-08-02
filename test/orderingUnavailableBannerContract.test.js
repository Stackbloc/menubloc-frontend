import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(root, "src/components/menu/OrderingUnavailableBanner.jsx"),
  "utf8"
);

test("ordering unavailable banner is a fit-to-text chip (no full-width yellow bar)", () => {
  assert.match(source, /data-testid="ordering-unavailable-banner"/);
  assert.match(source, /display:\s*"inline-flex"/);
  assert.match(source, /width:\s*"fit-content"/);
  assert.match(source, /alignSelf:\s*"flex-start"/);
  assert.match(source, /padding:\s*"3px 8px"/);
  assert.match(source, /fontSize:\s*12/);
  assert.match(source, /lineHeight:\s*1\.25/);
  assert.match(source, /borderRadius:\s*6/);
  // Guard against regressing to oversized / full-width callouts.
  assert.doesNotMatch(source, /padding:\s*"12px 14px"/);
  assert.doesNotMatch(source, /padding:\s*"5px 10px"/);
  assert.doesNotMatch(source, /fontSize:\s*14/);
  assert.doesNotMatch(source, /borderRadius:\s*12/);
});

test("ordering unavailable banner remains wired on public menu surfaces", () => {
  const publicMenu = readFileSync(join(root, "src/pages/PublicMenuPage.jsx"), "utf8");
  const catalog = readFileSync(
    join(root, "src/components/menuCatalog/CatalogMenuRenderer.jsx"),
    "utf8"
  );
  assert.match(publicMenu, /OrderingUnavailableBanner/);
  assert.match(catalog, /OrderingUnavailableBanner/);
});
