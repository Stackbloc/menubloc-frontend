/**
 * Feed shell contract — TikTok-style nav, slim X (2 video items + share).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Feed shell: Home|Connects|Menus|X|Deals|Search|Profile + slim X sheet", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/feed"/);
  assert.match(app, /FeedShellPage/);
  assert.match(app, /FeedHomePage/);
  assert.match(app, /FeedMenusPage/);
  assert.match(app, /FeedConnectsPage/);
  assert.match(app, /FeedSearchPage/);
  assert.match(app, /FeedProfilePage/);
  assert.match(app, /Navigate to="\/feed\/profile"/);
  assert.match(app, /Navigate to="\/feed\/menus"/);
  assert.doesNotMatch(app, /FeedMePage/);
  assert.doesNotMatch(app, /FeedEventsPage/);

  const nav = read("src/components/consumer/feed/FeedPrimaryNav.jsx");
  assert.match(nav, /feed-primary-nav/);
  assert.match(nav, /feed-nav-create-x/);
  assert.match(nav, /feed-nav-home/);
  assert.match(nav, /feed-nav-connects/);
  assert.match(nav, /feed-nav-menus/);
  assert.match(nav, /feed-nav-deals/);
  assert.match(nav, /feed-nav-search/);
  assert.match(nav, /feed-nav-profile/);
  assert.doesNotMatch(nav, /feed-nav-me"/);
  assert.doesNotMatch(nav, /feed-nav-events/);
  assert.doesNotMatch(nav, /feed-nav-feed/);
  assert.doesNotMatch(nav, /\/feed\/eating/);

  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shell, /FeedVideoCreateSheet/);
  assert.match(shell, /FeedVideoComposeOverlay/);
  assert.doesNotMatch(shell, /FeedDiaryComposeHost/);

  const createSheet = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");
  assert.match(createSheet, /FEED_X_ITEMS/);
  assert.match(createSheet, /feed-video-create-\$\{ch\.id\}/);
  assert.match(createSheet, /feed-x-share-my-menuply/);
  assert.doesNotMatch(createSheet, /feed-x-diary/);
  assert.doesNotMatch(createSheet, /feed-x-my-menuply/);
  assert.doesNotMatch(createSheet, /feed-x-create-account/);
  assert.doesNotMatch(createSheet, /feed-x-sign-in/);
  assert.doesNotMatch(createSheet, /feed-x-account/);

  const home = read("src/pages/consumer/feed/FeedHomePage.jsx");
  assert.match(home, /listSeeWhosEating/);
  assert.match(home, /variant="feedHome"/);
  assert.doesNotMatch(home, /feed-home-chrome/);
  assert.doesNotMatch(home, /feed-search/);
  assert.doesNotMatch(home, /feed-deals/);

  const searchPage = read("src/pages/consumer/feed/FeedSearchPage.jsx");
  assert.match(searchPage, /embedInFeedShell/);

  const profilePage = read("src/pages/consumer/feed/FeedProfilePage.jsx");
  assert.match(profilePage, /embedInFeedShell/);

  const connectsPage = read("src/pages/consumer/feed/FeedConnectsPage.jsx");
  assert.match(connectsPage, /embedInFeedShell/);

  const myMenuply = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(myMenuply, /my-menuply-account-settings/);
  assert.match(myMenuply, /feed-profile-settings-row/);
  assert.match(myMenuply, /!embedInFeedShell[\s\S]*my-menuply-sticky-head/);

  const menusPage = read("src/pages/consumer/feed/FeedMenusPage.jsx");
  assert.match(menusPage, /Build your menu stack from Feed/);

  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /see-whos-eating-menu-bookmark/);
});
