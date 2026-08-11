import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  clusterSlugFromPathname,
  resolveBrowseMenusHref,
} from "../src/lib/menuBrowserVenueContext.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bottomNavSrc = readFileSync(join(root, "src/components/BottomNav.jsx"), "utf8");
const browseSrc = readFileSync(join(root, "src/pages/BrowseMenus.jsx"), "utf8");

test("clusterSlugFromPathname extracts Place slug", () => {
  assert.equal(
    clusterSlugFromPathname("/clusters/california/indio/coachella-2027"),
    "coachella-2027"
  );
  assert.equal(
    clusterSlugFromPathname("/clusters/california/los-angeles/la-live?view=restaurants"),
    "la-live"
  );
  assert.equal(clusterSlugFromPathname("/browse-menus"), null);
});

test("resolveBrowseMenusHref prefers Coachella path over bare browse", () => {
  assert.equal(
    resolveBrowseMenusHref({
      pathname: "/clusters/california/indio/coachella-2027",
      search: "",
    }),
    "/browse-menus?cluster=coachella-2027"
  );
  assert.equal(resolveBrowseMenusHref({ pathname: "/", search: "" }), "/browse-menus");
});

test("BottomNav and BrowseMenus wire venue session/path into Yellow Browser", () => {
  assert.match(bottomNavSrc, /resolveBrowseMenusHref/);
  assert.match(browseSrc, /readMenuBrowserVenueSession/);
  assert.match(browseSrc, /rememberMenuBrowserVenueSession/);
  assert.match(browseSrc, /sessionSlug/);
});
