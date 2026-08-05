/**
 * Venue advertising Phase 1 contract tests.
 * Ensures Venue dashboard nav + ClusterAdSlot region API usage (no HomeNext edits).
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

describe("venue advertising Phase 1 contracts", () => {
  it("VenueLayout exposes Inventory and Advertisements plus placeholders", () => {
    const src = read("src/pages/venue/VenueLayout.jsx");
    assert.match(src, /Inventory/);
    assert.match(src, /Advertisements/);
    assert.match(src, /Campaigns \(Soon\)/);
    assert.match(src, /Analytics \(Soon\)/);
    assert.match(src, /Billing \(Soon\)/);
    assert.match(src, /Stripe Setup \(Soon\)/);
    assert.match(src, /\/venue\/advertising\/inventory/);
    assert.match(src, /\/venue\/advertising\/advertisements/);
  });

  it("VenueLogin uses AuthPageFrame and does not touch OperatorLogin", () => {
    const venueLogin = read("src/pages/venue/VenueLogin.jsx");
    assert.match(venueLogin, /AuthPageFrame/);
    assert.match(venueLogin, /Venue sign in/);
    const operatorLogin = read("src/pages/operator/OperatorLogin.jsx");
    assert.doesNotMatch(operatorLogin, /Venue advertising/);
  });

  it("Owner layout includes Venues navigation", () => {
    const src = read("src/pages/owner/OwnerLayout.jsx");
    assert.match(src, /\/owner\/venues/);
    assert.match(src, /Venues/);
  });

  it("ClusterAdSlot requests by inventory key or page region", () => {
    const slot = read("src/components/cluster/ClusterAdSlot.jsx");
    assert.match(slot, /getAdvertisements|getAdvertisementByRegion/);
    assert.match(slot, /pageRegion/);
    assert.match(slot, /inventoryKey/);
    assert.match(slot, /data-ad-size/);
    assert.match(slot, /small/);
    assert.doesNotMatch(slot, /LALIVE_/);
    assert.doesNotMatch(slot, /LA Live/);
  });

  it("advertisementApi uses public Railway-safe apiGet paths", () => {
    const api = read("src/lib/advertisementApi.js");
    assert.match(api, /apiGet/);
    assert.match(api, /\/public\/advertisements/);
    assert.match(api, /inventory_key/);
    assert.match(api, /page_region/);
  });

  it("ClusterPage wires cluster page_region slots only", () => {
    const page = read("src/pages/ClusterPage.jsx");
    assert.match(page, /ClusterAdSlot/);
    assert.match(page, /cluster_landing_hero/);
    assert.match(page, /cluster_landing_footer/);
    assert.match(page, /cluster_search_inline/);
    assert.match(page, /cluster_restaurant_footer/);
    assert.match(page, /cluster_deals_top/);
    assert.match(page, /cluster_events_top/);
    assert.match(page, /SpacedClusterAdSlot/);
    assert.match(page, /shouldInsertClusterSearchAd/);
    assert.match(page, /compact/);
    assert.match(page, /slim/);
    assert.match(page, /insertAfterIndex/);
  });

  it("ClusterPage does not stack landing hero with deals/events ads", () => {
    const page = read("src/pages/ClusterPage.jsx");
    assert.doesNotMatch(page, /cluster_landing_hero[\s\S]{0,240}cluster_deals_top/);
    assert.doesNotMatch(page, /cluster_deals_top[\s\S]{0,240}cluster_events_top/);
    assert.doesNotMatch(page, /cluster_landing_hero[\s\S]{0,240}cluster_events_top/);
    assert.doesNotMatch(page, /cluster_search_top/);
    assert.doesNotMatch(page, /cluster_restaurant_header/);
    assert.match(page, /searchActive \? null : preContent/);
    assert.match(page, /cluster-ad-space/);
  });

  it("HomeNext is not modified for advertising", () => {
    const home = read("src/pages/HomeNext.jsx");
    assert.doesNotMatch(home, /ClusterAdSlot/);
    assert.doesNotMatch(home, /getAdvertisements/);
    assert.doesNotMatch(home, /ad_inventory/);
  });

  it("App registers venue and owner venue routes", () => {
    const app = read("src/App.jsx");
    assert.match(app, /\/venue\/login/);
    assert.match(app, /\/venue\/advertising\/inventory/);
    assert.match(app, /\/owner\/venues/);
    assert.match(app, /VenueProvider/);
  });
});
