/**
 * Personal Diner QR share + UI contract (Phase 1).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDinerQrShareData, menuplyDinerQrUrl } from "../src/lib/dinerQrShare.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("diner QR share locks menuply.com /d/{token}", () => {
  const token = "11111111-1111-4111-8111-111111111111";
  assert.equal(menuplyDinerQrUrl(token), `https://menuply.com/d/${token}`);
  const data = buildDinerQrShareData({
    scan_url: `https://preview.example/d/${token}`,
    display_name: "Alex",
  });
  assert.ok(data);
  assert.equal(data.url, `https://menuply.com/d/${token}`);
  assert.match(data.text, /Scan to connect/i);
  assert.equal(buildDinerQrShareData({}), null);
});

test("Diner Card page has branding CTA and optional selfie path", () => {
  const page = read("src/pages/consumer/DinerQrPage.jsx");
  assert.match(page, /Scan to connect on Menuply/);
  assert.match(page, /Menuply/);
  assert.match(page, /uploadDinerAvatar/);
  assert.match(page, /ShareModal/);
  assert.match(page, /buildDinerQrShareData/);
  assert.match(page, /avatarFallback|initialsFromName/);
  // Same-origin /d/:token/image — Railway CORP same-origin blanks cross-origin <img>
  assert.match(page, /\/d\/\$\{encodeURIComponent\(String\(token\)\)\}\/image/);
  assert.doesNotMatch(page, /resolveConsumerMediaUrl\(path\)/);
});

test("connect landing uses public projection only", () => {
  const page = read("src/pages/consumer/DinerQrConnectPage.jsx");
  assert.match(page, /fetchPublicDinerQr/);
  assert.match(page, /connectViaDinerQr/);
  assert.doesNotMatch(page, /phone_number|current.?location|dining.?crew|conversation/i);
});

test("profile links My Diner QR; vercel rewrites /d", () => {
  const profile = read("src/pages/consumer/ConsumerProfile.jsx");
  assert.match(profile, /\/account\/diner-qr/);
  assert.match(profile, /My Diner QR/);
  const vercel = read("vercel.json");
  assert.match(vercel, /\/d\/:token\/image/);
  assert.match(vercel, /\/d\/:token/);
  const app = read("src/App.jsx");
  assert.match(app, /DinerQrPage/);
  assert.match(app, /DinerQrConnectPage/);
  assert.match(app, /\/connect\/d\/:token/);
});
