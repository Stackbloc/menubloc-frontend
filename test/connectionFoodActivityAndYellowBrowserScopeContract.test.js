import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  clusterEntryMatchesFoodSection,
  filterClusterEntriesByFoodSection,
} from "../src/lib/menuBrowserClusterCuisineFilter.js";
import {
  clearMenuBrowserVenueSession,
  resolveBrowseMenusHref,
} from "../src/lib/menuBrowserVenueContext.js";
import {
  resolveMenuBrowserMembershipSlug,
  resolveMenuBrowserVenueSlug,
} from "../src/lib/menuBrowserVenueCover.js";
import { INDIO_FESTIVAL_GROUNDS_SLUG } from "../src/lib/clusterSlugAliases.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const browseSrc = readFileSync(join(root, "src/pages/BrowseMenus.jsx"), "utf8");
const proofSrc = readFileSync(
  join(root, "src/components/social/ConnectionSocialProof.jsx"),
  "utf8"
);
const profileTabSrc = readFileSync(
  join(root, "src/pages/consumer/accountDashboard/ProfileTab.jsx"),
  "utf8"
);
const shellSrc = readFileSync(
  join(root, "src/components/restaurant/publicProfile/PublicProfileShell.jsx"),
  "utf8"
);
const detailSrc = readFileSync(join(root, "src/pages/MenuItemDetailPage.jsx"), "utf8");

test("membership slug does not default to la-live", () => {
  assert.equal(resolveMenuBrowserMembershipSlug(null), null);
  assert.equal(resolveMenuBrowserMembershipSlug(""), null);
  assert.equal(resolveMenuBrowserMembershipSlug("la-live"), "la-live");
  assert.equal(
    resolveMenuBrowserMembershipSlug(null, { sessionSlug: "coachella-2027" }),
    INDIO_FESTIVAL_GROUNDS_SLUG
  );
  assert.equal(
    resolveMenuBrowserMembershipSlug(null, { hostname: "venues.menuply.com" }),
    INDIO_FESTIVAL_GROUNDS_SLUG
  );
  // Cover helper may still default for assets
  assert.equal(resolveMenuBrowserVenueSlug(null), "la-live");
});

test("BrowseMenus has Browse city scope control", () => {
  assert.match(browseSrc, /resolveMenuBrowserMembershipSlug/);
  assert.match(browseSrc, /clearMenuBrowserVenueSession/);
  assert.match(browseSrc, /menu-browser-browse-city/);
  assert.match(browseSrc, /Browse city/);
  assert.match(browseSrc, /menu-browser-scope-bar/);
});

test("clearMenuBrowserVenueSession is exported", () => {
  assert.equal(typeof clearMenuBrowserVenueSession, "function");
});

test("resolveBrowseMenusHref stays city without session", () => {
  assert.equal(resolveBrowseMenusHref({ pathname: "/", search: "" }), "/browse-menus");
});

test("cluster food section filter matches cuisine and name hints", () => {
  assert.equal(
    clusterEntryMatchesFoodSection(
      { restaurant_name: "Katsuya", cuisine: "Japanese" },
      "asian"
    ),
    true
  );
  assert.equal(
    clusterEntryMatchesFoodSection(
      { restaurant_name: "Savoca", cuisine: null },
      "italian"
    ),
    true
  );
  assert.equal(
    clusterEntryMatchesFoodSection(
      { restaurant_name: "Fixins Soul Kitchen", cuisine: null },
      "american"
    ),
    true
  );
  assert.equal(
    clusterEntryMatchesFoodSection(
      { restaurant_name: "Katsuya", cuisine: "Japanese" },
      "mexican"
    ),
    false
  );
  assert.equal(
    filterClusterEntriesByFoodSection(
      [
        { restaurant_name: "Katsuya", cuisine: "Japanese" },
        { restaurant_name: "Lazy Dog", cuisine: "American" },
      ],
      "asian"
    ).length,
    1
  );
  assert.equal(
    filterClusterEntriesByFoodSection(
      [{ restaurant_name: "Katsuya", cuisine: "Japanese" }],
      "nearby"
    ).length,
    1
  );
  // "american" must not match italian via reverse substring on "italian american"
  assert.equal(
    clusterEntryMatchesFoodSection(
      { restaurant_name: "Lazy Dog", cuisine: "American" },
      "italian"
    ),
    false
  );
});

test("ConnectionSocialProof mounts on restaurant + menu item; settings toggle present", () => {
  assert.match(proofSrc, /connection-social-proof/);
  assert.match(proofSrc, /has_signals/);
  assert.match(shellSrc, /ConnectionSocialProof/);
  assert.match(detailSrc, /ConnectionSocialProof/);
  assert.match(profileTabSrc, /Show my connections/);
  assert.match(profileTabSrc, /showConnectionFoodActivity/);
});
