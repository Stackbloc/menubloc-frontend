/**
 * Video-first Feed shell contract — parallel /feed, four primary tabs, no HPP/Waiter edits.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Feed shell: FEED|EATING|EVENTS|ME routes + video-first home", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/feed"/);
  assert.match(app, /FeedShellPage/);
  assert.match(app, /FeedHomePage/);
  assert.match(app, /FeedEatingPage/);
  assert.match(app, /FeedEventsPage/);
  assert.match(app, /FeedMePage/);

  const nav = read("src/components/consumer/feed/FeedPrimaryNav.jsx");
  assert.match(nav, /feed-primary-nav/);
  assert.match(nav, /\/feed/);
  assert.match(nav, /\/feed\/eating/);
  assert.match(nav, /\/feed\/events/);
  assert.match(nav, /\/feed\/me/);
  assert.doesNotMatch(nav, /\/waiter/);
  assert.doesNotMatch(nav, /Discover|For You/i);

  const home = read("src/pages/consumer/feed/FeedHomePage.jsx");
  assert.match(home, /listSeeWhosEating/);
  assert.match(home, /variant="feedHome"/);
  assert.match(home, /feed-create/);
  assert.match(home, /feed-search/);
  assert.match(home, /\/search/);
  assert.match(home, /compose=ate/);
  assert.doesNotMatch(home, /photo_url/);

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

  // Shell must not import Waiter pages
  assert.doesNotMatch(read("src/pages/consumer/feed/FeedShellPage.jsx"), /FoodInterestsPage/);
  assert.doesNotMatch(read("src/pages/consumer/feed/FeedHomePage.jsx"), /FoodInterestsPage/);
});
