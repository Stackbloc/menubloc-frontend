/**
 * Post (X) action sheet wiring — MVP social launcher routes.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("MenuplyActionSheet lists My Diner QR first for public access", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  const firstIdx = sheet.indexOf("export const POST_ABOUT_ACTIONS");
  const block = sheet.slice(firstIdx, firstIdx + 500);
  assert.match(block, /id: "diner-qr"/);
  assert.match(block, /My Diner QR/);
  assert.match(block, /to: "\/account\/diner-qr"/);
  const dinerIdx = sheet.indexOf('id: "diner-qr"');
  const imEatingIdx = sheet.indexOf('id: "im-eating"');
  assert.ok(dinerIdx > 0 && dinerIdx < imEatingIdx, "My Diner QR must be first Post about action");
});

test("MenuplyActionSheet routes Want to Eat to My Menuply compose", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /compose=want/);
  assert.doesNotMatch(sheet, /id: "want"[\s\S]{0,120}to: "\/search"/);
});

test("MenuplyActionSheet routes Invite to Eat to invite start page", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /\/account\/invite-to-eat/);
  assert.match(sheet, /inviteContext/);
  assert.doesNotMatch(sheet, /id: "invite"[\s\S]{0,120}to: "\/search"/);
});

test("MenuplyActionSheet routes Find events to Events browse", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /id: "events"/);
  assert.match(sheet, /to: "\/events"/);
  assert.doesNotMatch(sheet, /to: "\/clusters"/);
});

test("App exposes /events browse and invite-to-eat start routes", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/events"/);
  assert.match(app, /EventsBrowsePage/);
  assert.match(app, /path="\/account\/invite-to-eat"/);
  assert.match(app, /InviteToEatStartPage/);
});

test("Events browse uses public events API", () => {
  const page = read("src/pages/EventsBrowsePage.jsx");
  const api = read("src/lib/eventsApi.js");
  assert.match(page, /fetchPublicEventsNear/);
  assert.match(api, /\/public\/events/);
});

test("Events browse shows connection RSVPs when signed in", () => {
  const page = read("src/pages/EventsBrowsePage.jsx");
  const api = read("src/lib/consumerApi.js");
  assert.match(page, /listConnectionsEvents/);
  assert.match(page, /events-browse-connections/);
  assert.match(page, /From your connections/);
  assert.match(api, /\/api\/consumer\/connections\/events/);
});
