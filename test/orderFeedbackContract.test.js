/**
 * Diner order feedback MVP — FE route and entry contracts.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("order feedback contracts", () => {
  it("routes consumer and operator feedback pages", () => {
    const app = read("src/App.jsx");
    assert.match(app, /\/account\/feedback/);
    assert.match(app, /ConsumerOrderFeedbackPage/);
    assert.match(app, /\/operator\/feedback/);
    assert.match(app, /OperatorOrderFeedbackPage/);
  });

  it("profile exposes Send Feedback entry", () => {
    const page = read("src/pages/consumer/accountDashboard/WalletActivityTab.jsx");
    assert.match(page, /Send Feedback/);
    assert.match(page, /\/account\/feedback/);
  });

  it("consumer API uses Railway production fallback", () => {
    const api = read("src/lib/consumerApi.js");
    assert.match(api, /getEligibleOrderFeedback/);
    assert.match(api, /getOrderFeedbackMenuCandidates/);
    assert.match(api, /submitOrderFeedback/);
    assert.match(api, /DEFAULT_PROD_API_BASE/);
    assert.match(api, /menubloc-backend-production/);
  });

  it("wizard has six categories and no topic picker", () => {
    const page = read("src/pages/consumer/ConsumerOrderFeedbackPage.jsx");
    assert.match(page, /Taste \/ Food Quality/);
    assert.match(page, /Order Accuracy/);
    assert.match(page, /Overall Experience/);
    assert.match(page, /Anything else you/);
    assert.match(page, /restaurant to know/);
    assert.match(page, /OrderFeedbackMenuItemPicker/);
    assert.doesNotMatch(page, /What does this feedback relate to/);
    assert.doesNotMatch(page, /\$50 off/);
  });

  it("menu-item picker links existing items and caps at 3", () => {
    const picker = read("src/components/consumer/OrderFeedbackMenuItemPicker.jsx");
    assert.match(picker, /MAX_ITEMS = 3/);
    assert.match(picker, /What did you try/);
    assert.match(picker, /getOrderFeedbackMenuCandidates/);
    assert.match(picker, /find it\? Add what you ate/);
    assert.match(picker, /not create a new menu item/);
    assert.doesNotMatch(picker, /insertMenuItems/);
    const api = read("src/lib/consumerApi.js");
    assert.match(api, /order-feedback\/menu-candidates/);
    assert.match(api, /getOrderFeedbackMenuCandidates/);
  });

  it("operator nav and API wire Recent Feedback", () => {
    const layout = read("src/pages/operator/OperatorLayout.jsx");
    assert.match(layout, /\/operator\/feedback/);
    const api = read("src/lib/operatorApi.js");
    assert.match(api, /getRestaurantOrderFeedback/);
    assert.match(api, /order-feedback/);
    const opPage = read("src/pages/operator/OperatorOrderFeedbackPage.jsx");
    assert.match(opPage, /Dishes they tried/);
    assert.doesNotMatch(opPage, /consumer_user_id/);
  });
});
