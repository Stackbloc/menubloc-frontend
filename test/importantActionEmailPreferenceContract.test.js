/**
 * FE contract: important-action email preference surface + API client.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("consumerApi exposes notification preference endpoints", () => {
  const api = read("src/lib/consumerApi.js");
  assert.match(api, /getNotificationPreferences/);
  assert.match(api, /updateNotificationPreferences/);
  assert.match(api, /\/api\/consumer\/notification-preferences/);
});

test("Security account tab toggles important Menuply emails", () => {
  const tab = read("src/pages/consumer/accountDashboard/SecurityAccountTab.jsx");
  assert.match(tab, /Important Menuply emails/);
  assert.match(tab, /important_action_email_enabled/);
  assert.match(tab, /getNotificationPreferences/);
  assert.match(tab, /updateNotificationPreferences/);
  assert.doesNotMatch(tab, /Want This/);
  assert.match(tab, /not for likes/);
});
