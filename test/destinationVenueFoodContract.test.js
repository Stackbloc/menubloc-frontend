/**
 * Phase 4 FE contract: stadium hub + food inventory consumer experience.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function run() {
  const api = read("src/lib/destinationVenueApi.js");
  assert.match(api, /from "\.\/api\.js"/);
  assert.match(api, /\/public\/destination-venues\//);
  assert.match(api, /formatStadiumPrice/);
  assert.match(api, /stadiumPriceLabel/);
  assert.match(api, /Price unavailable/);
  assert.doesNotMatch(api, /menuply\.com/);
  assert.doesNotMatch(api, /const API = \(import\.meta\.env/);

  const hub = read("src/pages/DestinationVenuePage.jsx");
  assert.match(hub, /Explore Food & Drink/);
  assert.match(hub, /\/destination-venues\/\$\{encodeURIComponent\(slug\)\}\/food/);
  assert.doesNotMatch(hub, /HomeNext/);
  assert.doesNotMatch(hub, /FoodInterestsPage/);

  const page = read("src/pages/DestinationVenueFoodPage.jsx");
  assert.match(page, /searchDestinationVenueMenuItems/);
  assert.match(page, /Price unavailable/);
  assert.match(page, /Location unavailable/);
  assert.match(page, /locations_available/);
  assert.match(page, /What are you looking for/);
  assert.match(page, /CATEGORY_CHIPS/);
  assert.match(page, /Add to order/);
  assert.match(page, /addStadiumCartItem/);
  assert.match(page, /Demo seat delivery/);
  assert.match(page, /BottomNav/);
  assert.doesNotMatch(page, /menu_research_status/);
  assert.doesNotMatch(page, /HomeNext/);
  assert.doesNotMatch(page, /FoodInterestsPage/);
  assert.doesNotMatch(page, /create-payment-intent/);
  assert.doesNotMatch(page, /OrderCartContext/);

  // Multi-location + shared menu: item view + vendor view paths
  assert.match(page, /fetchDestinationVenueItemAvailability/);
  assert.match(page, /fetchDestinationVenueVendor/);
  assert.match(page, /openItem/);

  const orderPage = read("src/pages/DestinationVenueOrderPage.jsx");
  assert.match(orderPage, /createDestinationVenueOrderRequest/);
  assert.match(orderPage, /Confirm order request/);
  assert.match(orderPage, /no payment|not be charged/i);
  assert.match(orderPage, /seat_section|Section/);
  assert.doesNotMatch(orderPage, /create-payment-intent/);
  assert.doesNotMatch(orderPage, /stripe/i);

  const app = read("src/App.jsx");
  assert.match(app, /DestinationVenueFoodPage/);
  assert.match(app, /DestinationVenuePage/);
  assert.match(app, /DestinationVenueOrderPage/);
  assert.match(app, /\/destination-venues\/:slug\/food/);
  assert.match(app, /\/destination-venues\/:slug\/order/);
  assert.match(app, /\/destination-venues\/:slug/);

  console.log("destinationVenueFoodContract PASS");
}

run();
