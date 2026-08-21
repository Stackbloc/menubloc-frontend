/**
 * Post (X) action sheet wiring — creation hub for My Menuply.
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

test("MenuplyActionSheet creates My Events via My Menuply compose", () => {
  const sheet = read("src/components/MenuplyActionSheet.jsx");
  assert.match(sheet, /id: "event"/);
  assert.match(sheet, /title: "My Events"/);
  assert.match(sheet, /title: "My Eating Plans"/);
  assert.match(sheet, /title: "My Crews"/);
  assert.match(sheet, /compose=event/);
  assert.match(sheet, /id: "events-browse"/);
  assert.match(sheet, /to: "\/events"/);
  assert.doesNotMatch(sheet, /to: "\/clusters"/);
});

test("My Menuply opens EventComposeSheet from compose=event", () => {
  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /EventComposeSheet/);
  assert.match(page, /compose === "event"/);
  assert.match(page, /createDinerSocialEvent/);
  assert.match(page, /listDinerSocialEvents/);
  assert.match(page, /socialEvents/);
  assert.match(page, /title="My Events"/);
  const compose = read("src/pages/consumer/myMenuply/EventComposeSheet.jsx");
  assert.match(compose, /event-compose-sheet/);
  assert.match(compose, /My Events/);
  assert.match(compose, /allowVideo/);
  assert.match(compose, /Food is optional/);
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
  assert.match(api, /\/api\/consumer\/social-events/);
});
