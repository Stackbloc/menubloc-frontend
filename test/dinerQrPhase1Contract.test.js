/**
 * Personal Diner QR share + UI contract (Phase 1).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDinerQrShareData, menuplyDinerConnectUrl, menuplyDinerQrUrl } from "../src/lib/dinerQrShare.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

test("diner QR share locks menuply.com connect invite URL", () => {
  const token = "11111111-1111-4111-8111-111111111111";
  assert.equal(menuplyDinerQrUrl(token), `https://menuply.com/d/${token}`);
  assert.equal(
    menuplyDinerConnectUrl(token),
    `https://menuply.com/connect/d/${token}`
  );
  const data = buildDinerQrShareData({
    scan_url: `https://preview.example/d/${token}`,
    display_name: "Alex",
  });
  assert.ok(data);
  assert.equal(data.url, `https://menuply.com/connect/d/${token}`);
  assert.match(data.text, /Alex invited you to connect on Menuply/);
  assert.match(data.text, /Open a free Menuply account/);
  assert.match(data.text, /menuply\.com\/diner\/signup/);
  assert.equal(buildDinerQrShareData({}), null);
});

test("formatDinerInviteName matches First L. strip style", async () => {
  const { formatDinerInviteName } = await import("../src/lib/dinerQrShare.js");
  assert.equal(formatDinerInviteName("Andre Barber"), "Andre B.");
  assert.equal(formatDinerInviteName("Alex"), "Alex");
});

test("Diner Card page has branding CTA and optional selfie path", () => {
  const page = read("src/pages/consumer/DinerQrPage.jsx");
  assert.match(page, /SCAN TO CONNECT ON MENUPLY/);
  assert.match(page, /MENUPLY/);
  assert.match(page, /menuply-qr-logo-x\.svg/);
  assert.match(page, /uploadDinerAvatar/);
  assert.match(page, /ShareModal/);
  assert.match(page, /buildDinerQrShareData/);
  assert.match(page, /avatarFallback|initialsFromName/);
  assert.match(page, /Add or change selfie/);
  // Same-origin /d/:token/image — Railway CORP same-origin blanks cross-origin <img>
  assert.match(page, /\/d\/\$\{encodeURIComponent\(String\(token\)\)\}\/image/);
  assert.doesNotMatch(page, /resolveConsumerMediaUrl\(path\)/);
  assert.doesNotMatch(page, /SCAN TO VIEW MENU/);
  assert.doesNotMatch(page, /Menuply diner/);
  assert.match(page, /\?v=\$\{encodeURIComponent\(bust\)\}/);
});

test("connect landing uses invitation copy and public projection only", () => {
  const page = read("src/pages/consumer/DinerQrConnectPage.jsx");
  assert.match(page, /fetchPublicDinerQr/);
  assert.match(page, /connectViaDinerQr/);
  assert.match(page, /has invited you to connect on Menuply, a social app/);
  assert.match(page, /Create a diner account/);
  assert.match(page, /sendConnectionRequest/);
  assert.match(page, /formatDinerInviteName/);
  assert.match(page, /Link with \$\{inviteName\}/);
  assert.match(page, /resolveConsumerConnectErrorMessage/);
  assert.match(page, /refreshSession/);
  assert.match(page, /Meet Me Here/);
  assert.doesNotMatch(page, /This is your personal Diner QR/);
  assert.doesNotMatch(page, /phone_number|current.?location|dining.?crew|conversation/i);
  assert.doesNotMatch(page, /A Menuply diner/);
  assert.doesNotMatch(page, /Scan complete\. Connect to interact/);
});

test("signup skips welcome when returning to diner QR connect invite", () => {
  const signup = read("src/pages/consumer/ConsumerSignup.jsx");
  assert.match(signup, /isDinerQrConnectPath/);
  assert.match(signup, /navigateAfterAuth/);
});

test("SMS verify hydrates session after auth without clearing optimistic login", () => {
  const ctx = read("src/context/ConsumerContext.jsx");
  assert.match(ctx, /hydrateSessionAfterAuth/);
  assert.match(ctx, /clearOn401: false/);
  const hydrateBlock = ctx.slice(ctx.indexOf("const hydrateSessionAfterAuth"), ctx.indexOf("useEffect(() => {"));
  assert.match(hydrateBlock, /applySession\(payload\)/);
  assert.doesNotMatch(hydrateBlock, /throw lastErr/);
});

test("profile links My Diner QR; SPA owns /d/:token scan; image still rewritten", () => {
  const profileTab = read("src/pages/consumer/accountDashboard/ProfileTab.jsx");
  assert.match(profileTab, /\/account\/diner-qr/);
  assert.match(profileTab, /My Diner QR/);
  assert.match(profileTab, /Share My Menuply/);
  const profile = read("src/pages/consumer/accountDashboard/SocialCrewTab.jsx");
  assert.match(profile, /\/account\/diner-qr/);
  assert.match(profile, /My Diner QR/);
  const vercel = read("vercel.json");
  assert.match(vercel, /\/d\/:token\/image/);
  // Scan HTML must not proxy through Railway (BE outage → phone "site can't be reached")
  assert.doesNotMatch(vercel, /"source"\s*:\s*"\/d\/:token"/);
  const app = read("src/App.jsx");
  assert.match(app, /DinerQrPage/);
  assert.match(app, /DinerQrConnectPage/);
  assert.match(app, /DinerQrScanRedirectPage/);
  assert.match(app, /\/d\/:token/);
  assert.match(app, /\/connect\/d\/:token/);
  const scan = read("src/pages/consumer/DinerQrScanRedirectPage.jsx");
  assert.match(scan, /resolveDinerQrScan/);
  assert.match(scan, /fetchPublicDinerQr/);
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /export async function resolveDinerQrScan/);
  assert.match(api, /\/d\/\$\{encodeURIComponent\(String\(token\)\)\}\?format=json/);
});
