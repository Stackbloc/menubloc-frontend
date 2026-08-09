import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("CRM nav includes Follow-Ups, Contacts, Email Templates, Activity", () => {
  const layout = read("src/pages/crm/CrmLayout.jsx");
  assert.match(layout, /\/crm\/follow-ups/);
  assert.match(layout, /\/crm\/contacts/);
  assert.match(layout, /\/crm\/email-templates/);
  assert.match(layout, /\/crm\/activity/);
});

test("CRM routes register new email CRM pages", () => {
  const app = read("src/App.jsx");
  assert.match(app, /CrmFollowUps/);
  assert.match(app, /CrmContacts/);
  assert.match(app, /CrmEmailTemplates/);
  assert.match(app, /CrmActivity/);
  assert.match(app, /path="\/crm\/follow-ups"/);
  assert.match(app, /path="\/crm\/email-templates"/);
});

test("crmApi exposes email/contact/follow-up helpers", () => {
  const api = read("src/lib/crmApi.js");
  assert.match(api, /getCrmEmailTemplates/);
  assert.match(api, /sendCrmLeadEmail/);
  assert.match(api, /getCrmRestaurantEmailHistory/);
  assert.match(api, /getCrmFollowUps/);
  assert.match(api, /getCrmRestaurantContacts/);
});

test("lead detail includes restaurant-scoped Email History and Contacts", () => {
  const detail = read("src/pages/crm/CrmLeadDetail.jsx");
  assert.match(detail, /Email History/);
  assert.match(detail, /getCrmRestaurantEmailHistory/);
  assert.match(detail, /CrmEmailComposer/);
  assert.match(detail, /View Email/);
  assert.match(detail, /title="Contacts"/);
});

test("composer supports blank custom email and mark as sent", () => {
  const composer = read("src/pages/crm/CrmEmailComposer.jsx");
  assert.match(composer, /Blank \/ custom email/);
  assert.match(composer, /Mark as sent/);
  assert.match(composer, /provider: "manual"/);
});
