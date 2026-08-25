/**
 * See Who's Eating FE contract — guest reel, CK dish links, existing camera path,
 * screen-name Connect request.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("See Who's Eating reel: guest watch, CK dish, existing camera, Connect notify", () => {
  const surface = read("src/pages/consumer/myMenuply/SeeWhosEatingSurface.jsx");
  assert.match(surface, /listSeeWhosEating/);
  assert.match(surface, /SeeWhosEatingFullscreen/);
  assert.match(surface, /Watch freely/);
  assert.match(surface, /MENUPY_PAUSE_LIVE_FEED|pause-live-feed/);
  assert.match(surface, /position:\s*"sticky"/);
  assert.match(surface, /--sph-h/);
  assert.match(surface, /LIVE FEED/);
  assert.match(surface, /see-whos-eating-surface/);

  const fullscreen = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(fullscreen, /requestConnection/);
  assert.match(fullscreen, /see_whos_eating/);
  assert.match(fullscreen, /see-whos-eating-screen-name/);
  assert.match(fullscreen, /menu_item_href|menu-items\//);

  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /SeeWhosEatingSurface/);
  assert.match(page, /is_recommend/);
  assert.doesNotMatch(page, /connections-eating/);
  // Live feed stays at top of page (before EatingHub)
  const seeIdx = page.indexOf("<SeeWhosEatingSurface");
  const eatingIdx = page.indexOf("<EatingHubSection");
  assert.ok(seeIdx > 0 && eatingIdx > seeIdx, "sticky live feed remains above What I'm Eating");

  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(compose, /MenuplyMediaPicker/);
  assert.match(compose, /isRecommend/);
  assert.match(compose, /isVideoFile/);
  assert.equal((compose.match(/MenuplyMediaPicker/g) || []).length >= 1, true);
  assert.doesNotMatch(compose, /SeeWhosEating.*Camera|new.*video.*capture/i);

  const api = read("src/lib/consumerApi.js");
  assert.match(api, /listSeeWhosEating/);
  assert.match(api, /\/api\/consumer\/see-whos-eating/);

  const app = read("src/App.jsx");
  assert.match(app, /connections-eating/);
  assert.match(app, /Navigate to="\/my-menuply"/);

  const rails = read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx");
  assert.doesNotMatch(rails, /See who.?s eating/);
});
