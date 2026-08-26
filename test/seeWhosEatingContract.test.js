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
  assert.match(surface, /embeddedShell/);
  assert.match(surface, /sticky\s*=\s*true/);
  assert.match(surface, /position:\s*"sticky"/);
  assert.match(surface, /--sph-h/);
  assert.match(surface, /LIVE FEED/);
  assert.match(surface, /see-whos-eating-surface/);
  assert.match(surface, /live-feed-channel-dials/);
  assert.match(surface, /LIVE_FEED_CHANNELS/);
  assert.match(surface, /minHeight:\s*40/);
  assert.match(surface, /channelLabel/);
  assert.match(surface, /resolveLiveFeedContentLink/);
  assert.match(surface, /see-whos-eating-content-link/);
  assert.match(surface, /see-whos-eating-expand-hint/);
  assert.match(surface, /Tap to expand/);
  assert.doesNotMatch(surface, /TAP · FULL SCREEN/);
  assert.match(surface, /captionMetaRow/);

  const fullscreen = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(fullscreen, /requestConnection/);
  assert.match(fullscreen, /see_whos_eating/);
  assert.match(fullscreen, /see-whos-eating-screen-name/);
  assert.match(fullscreen, /liveFeedFullCategoryLabel\(item\.kind\)/);
  assert.match(fullscreen, /resolveLiveFeedContentLink/);
  assert.match(fullscreen, /see-whos-eating-fullscreen-caption-meta/);
  assert.match(fullscreen, /see-whos-eating-fullscreen-content-link/);
  assert.match(fullscreen, /see-whos-eating-fullscreen-restaurant-link/);
  assert.match(fullscreen, /categoryChip/);
  assert.match(fullscreen, /dinerPeerProfilePath/);
  assert.match(fullscreen, /venueLiveFeedPath/);
  assert.match(fullscreen, /isLiveFeedVenueItem/);
  assert.match(fullscreen, /see-whos-eating-video-tap/);
  // Category sits below @screen name in caption meta row.
  {
    const nameIdx = fullscreen.indexOf("see-whos-eating-screen-name");
    const catIdx = fullscreen.indexOf("see-whos-eating-fullscreen-category");
    assert.ok(nameIdx > 0 && catIdx > nameIdx, "category markup after screen name");
    assert.match(fullscreen, /fontSize:\s*17/);
    assert.match(fullscreen, /categoryChip/);
  }
  assert.match(fullscreen, /resolveLiveFeedContentLink/);
  assert.match(read("src/lib/liveFeedCategory.js"), /menu_item_href|menu-items\//);
  assert.match(fullscreen, /createPortal/);
  assert.match(fullscreen, /100dvh|100vh/);
  assert.match(fullscreen, /objectFit:\s*"cover"/);
  assert.match(fullscreen, /see-whos-eating-fullscreen-close/);
  assert.match(fullscreen, /see-whos-eating-fullscreen-exit/);
  assert.match(fullscreen, /Swipe up|swipe up/);
  assert.match(fullscreen, /SWIPE_MIN_PX|onTouchEnd/);

  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(page, /SeeWhosEatingSurface/);
  assert.match(page, /is_recommend/);
  assert.doesNotMatch(page, /connections-eating/);
  assert.match(page, /my-menuply-sticky-head/);
  assert.match(page, /sticky=\{false\}/);
  assert.match(page, /uploadEatingPlanMedia/);
  assert.match(page, /market_discoverable/);
  // Green title above live feed; cluster sticky above EatingHub
  const heroIdx = page.indexOf("pageHeroBand");
  const seeIdx = page.indexOf("<SeeWhosEatingSurface");
  const eatingIdx = page.indexOf("<EatingHubSection");
  assert.ok(
    heroIdx > 0 && seeIdx > heroIdx && eatingIdx > seeIdx,
    "green My Menuply title above live feed; sticky cluster above What I'm Eating"
  );

  const compose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(compose, /MenuplyMediaPicker/);
  assert.match(compose, /isRecommend/);
  assert.match(compose, /isVideoFile/);
  assert.match(compose, /category === "plan"/);
  assert.match(compose, /acceptMedia/);
  assert.equal((compose.match(/MenuplyMediaPicker/g) || []).length >= 1, true);
  assert.doesNotMatch(compose, /SeeWhosEating.*Camera|new.*video.*capture/i);

  const api = read("src/lib/consumerApi.js");
  assert.match(api, /listSeeWhosEating/);
  assert.match(api, /\/api\/consumer\/see-whos-eating/);
  assert.match(api, /uploadEatingPlanMedia/);
  assert.match(api, /\/api\/consumer\/what-we-doing\/photo/);

  const cats = read("src/lib/liveFeedCategory.js");
  assert.match(cats, /resolveLiveFeedContentLink/);
  assert.match(cats, /liveFeedFullCategoryLabel/);
  assert.match(cats, /What I Wanna Eat/);
  assert.match(cats, /My Eating Plans/);
  assert.match(cats, /What I'm Eating/);
  assert.match(cats, /CHANNEL_LABEL_BY_KIND/);
  assert.doesNotMatch(cats, /LIVE_FEED_CATEGORY_LABELS/);
  assert.match(cats, /Events/);
  assert.match(cats, /All Content/);
  assert.match(cats, /I'm Eating/);
  assert.match(cats, /label:\s*"Wanna Eat"/);
  assert.match(cats, /Eating Plans/);
  assert.doesNotMatch(cats, /short:\s*"ALL"/);
  assert.doesNotMatch(cats, /label:\s*"What I Wanna Eat"/);
  assert.match(cats, /LIVE_FEED_FULL_CATEGORY_LABELS/);
  assert.match(cats, /LIVE_FEED_CHANNELS/);
  assert.match(cats, /venueLiveFeedPath/);

  const app = read("src/App.jsx");
  assert.match(app, /connections-eating/);
  assert.match(app, /Navigate to="\/my-menuply"/);

  const rails = read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx");
  assert.doesNotMatch(rails, /See who.?s eating/);
});
