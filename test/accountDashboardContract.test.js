/**
 * Account dashboard four-tab refactor contract.
 * Reorganizes existing /account functionality — no new social/wallet systems.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function readDashboard() {
  return [
    "src/pages/consumer/ConsumerProfile.jsx",
    "src/pages/consumer/accountDashboard/AccountTabNav.jsx",
    "src/pages/consumer/accountDashboard/ProfileTab.jsx",
    "src/pages/consumer/accountDashboard/SocialCrewTab.jsx",
    "src/pages/consumer/accountDashboard/WalletActivityTab.jsx",
    "src/pages/consumer/accountDashboard/SecurityAccountTab.jsx",
    "src/pages/consumer/accountDashboard/accountDashboardOptions.js",
    "src/pages/consumer/accountDashboard/PreferenceChips.jsx",
    "src/pages/consumer/accountDashboard/AccountActionLink.jsx",
    "src/pages/consumer/accountDashboard/SummaryEditSection.jsx",
  ]
    .map(read)
    .join("\n");
}

test("account dashboard has four named tabs and ChipRail tab nav", () => {
  const src = readDashboard();
  assert.match(src, /Profile/);
  assert.match(src, /Social & Crew/);
  assert.match(src, /Wallet & Activity/);
  assert.match(src, /Security & Account/);
  assert.match(src, /ChipRail/);
  assert.match(src, /gb-chip-rail|ChipRail/);
  assert.match(src, /normalizeAccountTab/);
});

test("account dashboard uses progressive disclosure instead of Save All", () => {
  const src = readDashboard();
  assert.doesNotMatch(src, /Save Profile Preferences/);
  assert.match(src, /Change Password/);
  assert.match(src, /editingPassword/);
  assert.match(src, /Tap a preference to save it immediately/);
  assert.match(src, /aria-pressed/);
});

test("profile tab lists My Diner QR and Share My Menuply after Profile information", () => {
  const src = read("src/pages/consumer/accountDashboard/ProfileTab.jsx");
  const info = src.indexOf("Profile information");
  const qr = src.indexOf("My Diner QR");
  const share = src.indexOf("Share My Menuply");
  const dining = src.indexOf("Dining preferences");
  assert.ok(info >= 0, "missing Profile information");
  assert.ok(qr > info, "My Diner QR must follow Profile information");
  assert.ok(share > qr, "Share My Menuply must follow My Diner QR");
  assert.ok(dining > share, "Dining preferences must follow Share My Menuply");
  assert.match(src, /to="\/account\/diner-qr"/);
  assert.match(src, /to="\/account\/diner-qr\?share=1"/);
  assert.doesNotMatch(src, /navigator\.share\(/);
});

test("account dashboard preserves existing diner surfaces", () => {
  const src = readDashboard();
  assert.match(src, /\/account\/dining-crews/);
  assert.match(src, /Dining Crew/);
  assert.match(src, /\/account\/diner-qr/);
  assert.match(src, /My Diner QR/);
  assert.match(src, /\/account\/meet-me-here/);
  assert.match(src, /What We Doing\?/);
  assert.match(src, /\/account\/what-we-doing/);
  assert.match(src, /\/account\/notifications/);
  assert.match(src, /\/account\/connections/);
  assert.match(src, /\/account\/social-onboarding/);
  assert.match(src, /\/account\/feedback/);
  assert.match(src, /Send Feedback/);
  assert.match(src, /\/account\/im-eating/);
  assert.match(src, /Mx Coins/);
  assert.match(src, /changePassword/);
  assert.match(src, /Log out/);
});

test("account dashboard does not invent generic social or speculative wallet features", () => {
  const src = readDashboard();
  assert.doesNotMatch(src, /follower system|Followers\b|Your friends/);
  assert.doesNotMatch(src, /gamification|badge rack|leaderboard/i);
  assert.doesNotMatch(src, /transaction history|available credit|stripe balance/i);
  assert.match(src, /not a generic friend list/i);
  assert.match(src, /not a Friend list/);
  assert.match(src, /No Dining Crew yet/);
});

test("dietary option contract remains on dashboard options", () => {
  const src = read("src/pages/consumer/accountDashboard/accountDashboardOptions.js");
  assert.match(src, /high_protein/);
  assert.match(src, /nut_free/);
  assert.doesNotMatch(src, /\bhalal\b/);
  assert.doesNotMatch(src, /\bkosher\b/);
  assert.doesNotMatch(src, /\bpaleo\b/);
});

test("every dashboard button has an action and links map to App routes", () => {
  const files = [
    "src/pages/consumer/ConsumerProfile.jsx",
    "src/pages/consumer/accountDashboard/AccountTabNav.jsx",
    "src/pages/consumer/accountDashboard/ProfileTab.jsx",
    "src/pages/consumer/accountDashboard/SocialCrewTab.jsx",
    "src/pages/consumer/accountDashboard/WalletActivityTab.jsx",
    "src/pages/consumer/accountDashboard/SecurityAccountTab.jsx",
    "src/pages/consumer/accountDashboard/PreferenceChips.jsx",
    "src/pages/consumer/accountDashboard/SummaryEditSection.jsx",
    "src/pages/consumer/accountDashboard/AccountActionLink.jsx",
  ];
  for (const rel of files) {
    const src = read(rel);
    const buttons = src.match(/<button\b[^>]*>/g) || [];
    for (const btn of buttons) {
      const hasAction = /onClick=/.test(btn) || /type=["']submit["']/.test(btn);
      assert.ok(hasAction, `Dead button in ${rel}: ${btn}`);
    }
  }

  const dashboard = readDashboard();
  const app = read("src/App.jsx");
  const toAttrs = dashboard.match(/\bto=\{?["'`]([^"'`]+)["'`]/g) || [];
  const hrefs = toAttrs.map((m) => m.replace(/\bto=\{?["'`]/, "").replace(/["'`].*$/, ""));
  for (const href of hrefs) {
    const pathOnly = href.split("?")[0];
    if (pathOnly === "/") continue;
    const dynamic = pathOnly
      .replace(/\$\{[^}]+\}/g, ":param")
      .replace(/:[^/]+/g, ":param");
    if (dynamic.includes(":param")) {
      const prefix = dynamic.split("/:param")[0];
      assert.match(app, new RegExp(prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      continue;
    }
    const escaped = pathOnly.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(app, new RegExp(escaped), `Unrouted dashboard link: ${href}`);
  }
});

test("empty states and share/unlike actions use real existing functions", () => {
  const social = read("src/pages/consumer/accountDashboard/SocialCrewTab.jsx");
  assert.match(social, /createDiningCrew/);
  assert.match(social, /inviteToDiningCrew/);
  assert.match(social, /ShareModal/);
  assert.match(social, /Start a plan/);
  assert.match(social, /\/account\/diner-qr\?share=1/);
  assert.match(social, /acceptConnection/);
  assert.match(social, /declineConnection/);

  const wallet = read("src/pages/consumer/accountDashboard/WalletActivityTab.jsx");
  assert.match(wallet, /\/menu-items\/\$\{meal\.menu_item_id\}/);
  assert.match(wallet, /onUnlikeMeal/);
  assert.match(wallet, /Browse menus/);
  assert.match(wallet, /clusterPath/);
  assert.match(wallet, /Explore clusters/);

  const dinerQr = read("src/pages/consumer/DinerQrPage.jsx");
  assert.match(dinerQr, /searchParams\.get\("share"\) !== "1"/);
  assert.match(dinerQr, /setShareOpen\(true\)/);
  assert.doesNotMatch(dinerQr, /navigator\.share\(/);

  const profile = read("src/pages/consumer/ConsumerProfile.jsx");
  assert.match(profile, /updatePreferences/);
  assert.match(profile, /updateFoodsToAvoid/);
  assert.match(profile, /unlikeMenuItem/);
  assert.match(profile, /changePassword/);
  assert.match(profile, /sendEduVerification/);
  assert.match(profile, /SmsAuthModal/);
  assert.match(profile, /DinerSupportDialog/);
});

