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

test("ordering unavailable banner stays compact (no oversized yellow padding)", () => {
  assert.match(source, /data-testid="ordering-unavailable-banner"/);
  assert.match(source, /padding:\s*"5px 10px"/);
  assert.match(source, /fontSize:\s*12/);
  assert.match(source, /lineHeight:\s*1\.3/);
  assert.match(source, /borderRadius:\s*8/);
  // Guard against regressing to the large callout that dominated menu headers.
  assert.doesNotMatch(source, /padding:\s*"12px 14px"/);
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
