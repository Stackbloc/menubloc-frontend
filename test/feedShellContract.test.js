/**
 * Feed shell contract — center X, video-only create, plan video attach.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Feed shell: FEED|EATING|X|EVENTS|ME routes + video-first home", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/feed"/);
  assert.match(app, /FeedShellPage/);
  assert.match(app, /FeedHomePage/);
  assert.match(app, /FeedEatingPage/);
  assert.match(app, /FeedEventsPage/);
  assert.match(app, /FeedMePage/);

  const nav = read("src/components/consumer/feed/FeedPrimaryNav.jsx");
  assert.match(nav, /feed-primary-nav/);
  assert.match(nav, /feed-nav-create-x/);
  assert.match(nav, /MenuplyXMark/);
  assert.match(nav, /\/feed/);
  assert.match(nav, /\/feed\/eating/);
  assert.match(nav, /\/feed\/events/);
  assert.match(nav, /\/feed\/me/);
  assert.doesNotMatch(nav, /\/waiter/);
  assert.doesNotMatch(nav, /Discover|For You/i);

  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shell, /FeedVideoCreateSheet/);
  assert.match(shell, /FeedVideoComposeOverlay/);

  const createSheet = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");
  assert.match(createSheet, /feed-video-create-\$\{row\.id\}/);
  assert.match(createSheet, /\["ate", "want"\]/);
  assert.doesNotMatch(createSheet, /feed-video-create-plan/);

  const composeLib = read("src/lib/feedVideoCompose.js");
  assert.match(composeLib, /postFeedAteVideo/);
  assert.match(composeLib, /postFeedWantVideo/);
  assert.match(composeLib, /attachPlanVideo/);
  assert.match(composeLib, /market_discoverable:\s*true/);

  const eatingCompose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(eatingCompose, /feedMode/);
  assert.match(eatingCompose, /allowPhoto=\{!feedMode\}/);
  assert.match(eatingCompose, /data-feed-mode/);

  const picker = read("src/components/social/MenuplyMediaPicker.jsx");
  assert.match(picker, /allowPhoto \|\| allowVideo/);
  assert.match(picker, /allowPhoto=\{allowPhoto\}/);
  assert.match(picker, /ConsumerCameraSheet/);

  const home = read("src/pages/consumer/feed/FeedHomePage.jsx");
  assert.match(home, /listSeeWhosEating/);
  assert.match(home, /variant="feedHome"/);
  assert.match(home, /feed-search/);
  assert.match(home, /\/search/);
  assert.match(home, /FEED_VIDEO_POSTED_EVENT/);
  assert.doesNotMatch(home, /feed-create/);
  assert.doesNotMatch(home, /compose=ate/);
  assert.doesNotMatch(home, /photo_url/);

  const planAttach = read("src/pages/consumer/myMenuply/PlanVideoAttachSheet.jsx");
  assert.match(planAttach, /plan-video-attach-sheet/);
  assert.match(read("src/pages/consumer/myMenuply/myMenuplyBits.jsx"), /plan-add-video/);

  const flags = read("src/lib/featureFlags.js");
  assert.match(flags, /isFeedAsHomeEnabled/);
  assert.match(flags, /VITE_FEED_AS_HOME/);

  const homeRoot = read("src/pages/HomeRoot.jsx");
  assert.match(homeRoot, /isFeedAsHomeEnabled/);
  assert.match(homeRoot, /HomeNext/);
  assert.match(homeRoot, /FeedShellPage/);

  const drawer = read("src/components/grubbid/DiscoveryDrawer.jsx");
  assert.match(drawer, /Feed \(preview\)/);
  assert.match(drawer, /to="\/feed"/);

  assert.doesNotMatch(read("src/pages/consumer/feed/FeedHomePage.jsx"), /FoodInterestsPage/);
});
