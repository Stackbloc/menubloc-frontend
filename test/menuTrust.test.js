/** Menu ⓘ box wording (Andre 2026-10-31) and the report email that names the menu. Same as the app. */

import test from "node:test";
import assert from "node:assert/strict";
import { menuTrustText, menuReportMailto, isUnclaimedProfile } from "../src/lib/menuTrust.js";

const NO_GUARANTEE = "Menuply cannot guarantee the accuracy of the menu information.";

test("menu trust text + report email", () => {
  assert.equal(
    menuTrustText({ reviewedAt: "2026-10-12T19:00:00Z", unclaimed: false, franchiseStore: false }),
    `The information in this menu was last reviewed or edited by the restaurant owner/operator on October 12, 2026. ${NO_GUARANTEE}`
  );
  assert.equal(
    menuTrustText({ reviewedAt: null, unclaimed: true, franchiseStore: false }),
    `This menu has not been claimed or verified by the restaurant owner/operator. ${NO_GUARANTEE}`
  );
  assert.equal(menuTrustText({ reviewedAt: null, unclaimed: true, franchiseStore: true }), NO_GUARANTEE);
  assert.equal(menuTrustText({ reviewedAt: null, unclaimed: false, franchiseStore: false }), NO_GUARANTEE);

  assert.equal(isUnclaimedProfile({ claim_status: "unclaimed" }), true);
  assert.equal(isUnclaimedProfile({ claim_status: "claimed" }), false);
  assert.equal(isUnclaimedProfile({ claim_status: "claim_pending" }), false);
  assert.equal(isUnclaimedProfile({ claim_status: "unclaimed", claimable: false }), false);

  const url = menuReportMailto({
    restaurantId: 10272,
    name: "Chick-fil-A",
    city: "Los Angeles",
    state: "CA",
    menuUrl: "https://menuply.com/restaurants/california/los-angeles/chick-fil-a-usc/menu",
    reviewedAt: null,
  });
  assert.ok(url.startsWith("mailto:menus@menuply.com?subject="));
  const text = decodeURIComponent(url);
  assert.ok(text.includes("subject=Menu report: Chick-fil-A, Los Angeles, CA (#10272)"));
  assert.ok(text.includes("Menu: https://menuply.com/restaurants/california/los-angeles/chick-fil-a-usc/menu"));
  assert.ok(text.includes("What's wrong:"));
});
