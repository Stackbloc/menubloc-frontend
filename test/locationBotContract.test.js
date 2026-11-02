import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

test("Location Bot page is routed and listed under Bots", () => {
  assert.match(read("src/App.jsx"), /path="\/owner\/bots\/location-bot"[^\n]*<OwnerLocationBot \/>/);
  assert.match(read("src/pages/owner/OwnerLayout.jsx"), /to: "\/owner\/bots\/location-bot", label: "Location Bot"/);
  assert.match(read("src/pages/owner/OwnerBots.jsx"), /path: "\/owner\/bots\/location-bot"/);
  const api = read("src/lib/ownerApi.js");
  assert.match(api, /\/api\/owner\/location-bot\/preview/);
  assert.match(api, /\/api\/owner\/location-bot\/apply/);
});

test("brand location rows show phone and today's hours", async () => {
  const src = read("src/components/restaurant/BrandLocationsSection.jsx");
  assert.match(src, /data-testid="brand-location-phone"/);
  assert.match(src, /data-testid="brand-location-hours"/);
  // The phone link sits outside the row <Link> (no nested anchors).
  assert.match(src, /<\/Link>\s*\) : \(\s*body\s*\)\}\s*\{phone \?/);
});
