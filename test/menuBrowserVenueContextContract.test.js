import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  clusterSlugFromPathname,
  resolveBrowseMenusHref,
} from "../src/lib/menuBrowserVenueContext.js";
import { INDIO_FESTIVAL_GROUNDS_SLUG } from "../src/lib/clusterSlugAliases.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const browseSrc = readFileSync(join(root, "src/pages/BrowseMenus.jsx"), "utf8");


test("clusterSlugFromPathname extracts Place slug", () => {
  assert.equal(
    clusterSlugFromPathname("/clusters/california/indio/coachella-2027"),
    INDIO_FESTIVAL_GROUNDS_SLUG
  );
  assert.equal(
    clusterSlugFromPathname("/clusters/california/indio/indio-festival-grounds"),
    INDIO_FESTIVAL_GROUNDS_SLUG
  );
  assert.equal(
    clusterSlugFromPathname("/clusters/california/los-angeles/la-live?view=restaurants"),
    "la-live"
  );
  assert.equal(clusterSlugFromPathname("/browse-menus"), null);
});

test("resolveBrowseMenusHref prefers Indio festival path over bare browse", () => {
  assert.equal(
    resolveBrowseMenusHref({
      pathname: "/clusters/california/indio/indio-festival-grounds",
      search: "",
    }),
    `/browse-menus?cluster=${INDIO_FESTIVAL_GROUNDS_SLUG}`
  );
  assert.equal(resolveBrowseMenusHref({ pathname: "/", search: "" }), "/browse-menus");
});

test("BottomNav uses venue-aware Yellow Browser href", () => {
  const nav = readFileSync(join(root, "src/components/BottomNav.jsx"), "utf8");
  assert.match(nav, /resolveBrowseMenusHref/);
  assert.match(nav, /BrowseMenusIcon/);
});

test("BrowseMenus wires venue session/path into Yellow Browser", () => {
  assert.match(browseSrc, /readMenuBrowserVenueSession/);
  assert.match(browseSrc, /rememberMenuBrowserVenueSession/);
  assert.match(browseSrc, /clearMenuBrowserVenueSession/);
  assert.match(browseSrc, /sessionSlug/);
  assert.match(browseSrc, /resolveMenuBrowserMembershipSlug/);
});
