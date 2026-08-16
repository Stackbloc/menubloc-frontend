/**
 * Phase 8 — FE integration contract (Phases 1–7 surfaces).
 * No new product UI — wiring + non-duplication checks only.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("App mounts diner-qr, meet-me-here, invite, events, dining-crews", () => {
  const app = read("src/App.jsx");
  assert.match(app, /\/account\/diner-qr/);
  assert.match(app, /\/account\/meet-me-here/);
  assert.match(app, /\/invite\/:token/);
  assert.match(app, /\/events\/:slug/);
  assert.match(app, /\/events\/groups\/:slug/);
  assert.match(app, /\/account\/dining-crews/);
  assert.match(app, /DinerQrPage|MeetMeHerePage|EatInvitationPage/);
});

test("Meet Me Here and Personal Diner QR remain separate pages", () => {
  const mmh = read("src/pages/consumer/MeetMeHerePage.jsx");
  const diner = read("src/pages/consumer/DinerQrPage.jsx");
  assert.match(mmh, /createMeetMeHere/);
  assert.match(mmh, /Permanent Diner QR/);
  assert.match(diner, /getMyDinerQr/);
  assert.doesNotMatch(diner, /createMeetMeHere/);
  assert.doesNotMatch(mmh, /updateDinerQrPrivacy/);
});

test("Account exposes Meet Me Here and Diner QR entry points", () => {
  const profile = read("src/pages/consumer/ConsumerProfile.jsx");
  assert.match(profile, /\/account\/diner-qr/);
  assert.match(profile, /\/account\/meet-me-here/);
});

test("consumerApi has diner-qr and meet-me-here helpers", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /\/api\/consumer\/diner-qr/);
  assert.match(api, /\/api\/consumer\/meet-me-here/);
});
