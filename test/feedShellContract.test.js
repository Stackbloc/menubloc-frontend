/**
 * Feed shell contract — center X, video-only create, Menus tab, diary on X.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Feed shell: FEED|MENUS|X|EVENTS|ME routes + video-first home", () => {
  const app = read("src/App.jsx");
  assert.match(app, /path="\/feed"/);
  assert.match(app, /FeedShellPage/);
  assert.match(app, /FeedHomePage/);
  assert.match(app, /FeedMenusPage/);
  assert.match(app, /FeedEventsPage/);
  assert.match(app, /FeedMePage/);
  assert.match(app, /Navigate to="\/feed\/menus"/);

  const nav = read("src/components/consumer/feed/FeedPrimaryNav.jsx");
  assert.match(nav, /feed-primary-nav/);
  assert.match(nav, /feed-nav-create-x/);
  assert.match(nav, /MenuplyXMark/);
  assert.match(nav, /\/feed/);
  assert.match(nav, /\/feed\/menus/);
  assert.match(nav, /feed-nav-menus/);
  assert.match(nav, /\/feed\/events/);
  assert.match(nav, /\/feed\/me/);
  assert.doesNotMatch(nav, /\/feed\/eating/);
  assert.doesNotMatch(nav, /\/waiter/);
  assert.doesNotMatch(nav, /Discover|For You/i);

  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shell, /FeedVideoCreateSheet/);
  assert.match(shell, /FeedVideoComposeOverlay/);
  assert.match(shell, /FeedDiaryComposeHost/);

  const createSheet = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");
  assert.match(createSheet, /FEED_VIDEO_CATEGORY_IDS\s*=\s*\["ate", "want"\]/);
  assert.match(createSheet, /feed-x-section-\$\{section\.id\}/);
  assert.match(createSheet, /id: "post-feed"/);
  assert.match(createSheet, /id: "diary"/);
  assert.match(createSheet, /feed-x-diary-ate/);
  assert.match(createSheet, /feed-x-diary-want/);
  assert.match(createSheet, /feed-x-diary-plan/);
  assert.match(createSheet, /id: "my-menuply"/);
  assert.match(createSheet, /id: "share-account"/);
  assert.match(createSheet, /testId: `feed-video-create-\$\{ch\.id\}`/);
  assert.match(createSheet, /feed-x-my-menuply/);
  assert.match(createSheet, /feed-x-share-my-menuply/);
  assert.match(createSheet, /feed-x-create-account/);
  assert.match(createSheet, /feed-x-sign-in/);
  assert.match(createSheet, /feed-x-account/);
  assert.doesNotMatch(createSheet, /feed-video-create-plan/);

  const shellShare = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shellShare, /ShareModal/);
  assert.match(shellShare, /buildDinerQrShareData/);
  assert.match(shellShare, /onShareMyMenuply/);

  const composeLib = read("src/lib/feedVideoCompose.js");
  assert.match(composeLib, /postFeedAteVideo/);
  assert.match(composeLib, /postFeedWantVideo/);
  assert.match(composeLib, /attachPlanVideo/);
  assert.match(composeLib, /market_discoverable:\s*true/);

  const eatingCompose = read("src/pages/consumer/myMenuply/EatingCompose.jsx");
  assert.match(eatingCompose, /feedMode/);
  assert.match(eatingCompose, /allowPhoto=\{!feedMode\}/);
  assert.match(eatingCompose, /data-feed-mode/);
  assert.match(eatingCompose, /Restaurant & menu item \(optional\)/);
  assert.match(eatingCompose, /allowDishSearch/);

  const picker = read("src/components/social/MenuplyMediaPicker.jsx");
  assert.match(picker, /allowPhoto \|\| allowVideo/);
  assert.match(picker, /allowPhoto=\{allowPhoto\}/);
  assert.match(picker, /ConsumerCameraSheet/);

  const home = read("src/pages/consumer/feed/FeedHomePage.jsx");
  assert.match(home, /listSeeWhosEating/);
  assert.match(home, /variant="feedHome"/);
  assert.match(home, /feed-search/);
  assert.match(home, /\/search/);
  assert.match(home, /feed-deals/);
  assert.match(home, /\/feed\/deals\?city=/);
  assert.match(home, /encodeURIComponent\(market\.city\)/);
  assert.match(home, /encodeURIComponent\(market\.state\)/);
  assert.match(home, /FEED_VIDEO_POSTED_EVENT/);
  assert.doesNotMatch(home, /feed-create/);
  assert.doesNotMatch(home, /compose=ate/);
  assert.doesNotMatch(home, /photo_url/);
  assert.doesNotMatch(home, /\/clusters/);
  assert.doesNotMatch(home, /\/menu-capture/);

  const appRoutes = read("src/App.jsx");
  assert.match(appRoutes, /FeedDealsPage/);
  assert.match(appRoutes, /path="deals"/);

  const feedDeals = read("src/pages/consumer/feed/FeedDealsPage.jsx");
  assert.match(feedDeals, /feed-deals-page/);
  assert.match(feedDeals, /has_video/);
  assert.match(feedDeals, /DealVideoSwipe/);
  assert.match(feedDeals, /feed-deals-search/);
  assert.match(feedDeals, /\/deals\?city=/);
  assert.match(feedDeals, /feed-deals-meal-filters/);
  assert.match(feedDeals, /meal_period/);
  assert.doesNotMatch(feedDeals, /\/waiter/);

  const me = read("src/pages/consumer/feed/FeedMePage.jsx");
  assert.match(me, /feed-me-clusters/);
  assert.match(me, /to: "\/clusters"/);
  assert.match(me, /feed-me-menu-upload/);
  assert.match(me, /to: "\/menu-capture"/);
  assert.match(me, /feed-me-create-account/);
  assert.match(me, /feed-me-sign-in/);
  assert.doesNotMatch(me, /to: "\/deals"/);

  assert.doesNotMatch(nav, /\/deals/);
  assert.doesNotMatch(nav, /\/clusters/);
  assert.doesNotMatch(nav, /\/menu-capture/);

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

  const menusPage = read("src/pages/consumer/feed/FeedMenusPage.jsx");
  assert.match(menusPage, /feed-menus-empty/);
  assert.match(menusPage, /Build your menu stack from Feed/);
  assert.match(menusPage, /feed-menus-browse-feed/);
  assert.match(menusPage, /48 hours/);
  assert.match(menusPage, /feed-menus-bookmark/);
  assert.match(menusPage, /feedMenuLibrary/);

  const diaryHost = read("src/pages/consumer/feed/FeedDiaryComposeHost.jsx");
  assert.match(diaryHost, /EatingComposeSheet/);
  assert.match(diaryHost, /EatingPlanDayForm/);
  assert.match(diaryHost, /feed-diary-plan-sheet/);

  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /see-whos-eating-menu-bookmark/);
  assert.match(reel, /recordFeedMenuOpen/);
});
