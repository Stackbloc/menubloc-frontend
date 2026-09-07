import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getOrderingAvailabilityMessage,
  isOnlineOrderingAvailable,
} from "../src/lib/restaurantStatusLight.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(root, "src/components/menu/OrderingUnavailableBanner.jsx"),
  "utf8"
);

test("ordering available banner is a fit-to-text green chip", () => {
  assert.match(source, /data-testid="ordering-available-banner"/);
  assert.match(source, /Online Ordering Available|getOrderingAvailabilityMessage/);
  assert.match(source, /display:\s*"inline-flex"/);
  assert.match(source, /width:\s*"fit-content"/);
  assert.match(source, /alignSelf:\s*"flex-start"/);
  assert.match(source, /padding:\s*"3px 8px"/);
  assert.match(source, /fontSize:\s*12/);
  assert.match(source, /lineHeight:\s*1\.25/);
  assert.match(source, /borderRadius:\s*6/);
  assert.match(source, /#86efac|#f0fdf4|#166534/);
  assert.doesNotMatch(source, /padding:\s*"12px 14px"/);
  assert.doesNotMatch(source, /#fffbeb|#fde68a|#92400e/);
  assert.doesNotMatch(source, /fontSize:\s*14/);
  assert.doesNotMatch(source, /borderRadius:\s*12/);
  assert.doesNotMatch(source, /ordering-unavailable-banner/);
});

test("ordering available banner remains wired on public menu surfaces", () => {
  const publicMenu = readFileSync(join(root, "src/pages/PublicMenuPage.jsx"), "utf8");
  const catalog = readFileSync(
    join(root, "src/components/menuCatalog/CatalogMenuRenderer.jsx"),
    "utf8"
  );
  assert.match(publicMenu, /OrderingUnavailableBanner/);
  assert.match(catalog, /OrderingUnavailableBanner/);
});

test("ordering chip copy only when online ordering is applicable", () => {
  assert.equal(
    getOrderingAvailabilityMessage({ ordering_availability: { available: true } }),
    "Online Ordering Available"
  );
  assert.equal(
    getOrderingAvailabilityMessage({ ordering_availability: { available: false } }),
    null
  );
  assert.equal(
    getOrderingAvailabilityMessage({
      ordering_availability: { available: false, message: "Online ordering is currently unavailable." },
    }),
    null
  );
  assert.equal(getOrderingAvailabilityMessage({}), null);
  assert.equal(isOnlineOrderingAvailable({ ordering_availability: { available: true } }), true);
  assert.equal(isOnlineOrderingAvailable({ ordering_availability: { available: false } }), false);
});
