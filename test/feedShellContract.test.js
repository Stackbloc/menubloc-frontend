/**
 * Feed shell contract — TikTok-style nav, X (ate/want/Food Review + share).
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("Feed shell: Home|Connects|Menus|X|Deals|Shop|Profile + slim X sheet", () => {
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
  assert.match(nav, /FEED_LEFT_TABS/);
  assert.match(nav, /FEED_RIGHT_TABS/);
  assert.doesNotMatch(nav, /feed-nav-me"/);
  assert.doesNotMatch(nav, /feed-nav-events/);
  assert.doesNotMatch(nav, /feed-nav-feed/);
  assert.doesNotMatch(nav, /\/feed\/eating/);

  const feedTabLinks = read("src/lib/feedShellLinks.js");
  assert.match(feedTabLinks, /feed-nav-home/);
  assert.match(feedTabLinks, /feed-nav-connects/);
  assert.match(feedTabLinks, /feed-nav-menus/);
  assert.match(feedTabLinks, /My Menu Stack/);
  assert.doesNotMatch(feedTabLinks, /label: "Menus"/);
  assert.match(feedTabLinks, /feed-nav-deals/);
  assert.match(feedTabLinks, /feed-nav-shop/);
  assert.doesNotMatch(feedTabLinks, /label: "Search"/);
  assert.match(feedTabLinks, /feed-nav-profile/);

  const shell = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shell, /FeedVideoCreateSheet/);
  assert.match(shell, /FeedVideoComposeOverlay/);
  assert.match(shell, /onPickUploadCategory/);
  assert.match(shell, /composeOpenLibrary/);
  assert.match(shell, /getMyDinerQr/);
  assert.match(shell, /buildDinerQrShareData/);
  assert.match(shell, /ShareModal/);
  assert.doesNotMatch(shell, /FeedDiaryComposeHost/);

  const createSheet = read("src/components/consumer/feed/FeedVideoCreateSheet.jsx");
  assert.match(createSheet, /FEED_X_ITEMS/);
  assert.match(createSheet, /feed-video-create-\$\{ch\.id\}/);
  assert.match(createSheet, /FEED_VIDEO_CATEGORY_IDS/);
  assert.match(createSheet, /FEED_CONTENT_KINDS\.REVIEWS/);
  assert.match(createSheet, /Food Review/);
  assert.doesNotMatch(createSheet, /Post Food Review/);
  assert.match(createSheet, /FEED_UPLOAD_MEDIA_ITEM/);
  assert.match(createSheet, /feed-x-upload-media/);
  assert.match(createSheet, /feed-upload-media-\$\{item\.id\}/);
  assert.match(createSheet, /FEED_QUICK_INVITE_ITEMS/);
  assert.match(createSheet, /feed-x-section-post-to-feed/);
  assert.match(createSheet, /feed-x-section-quick-invites/);
  assert.match(createSheet, /Post to Feed/);
  assert.match(createSheet, /Quick Invites/);
  assert.match(createSheet, /feed-quick-invite-\$\{code\.toLowerCase\(\)\}/);
  assert.match(createSheet, /onPickQuickInvite/);
  assert.match(shell, /onPickQuickInvite/);
  assert.match(shell, /seed_code/);
  assert.match(shell, /quick_invite/);
  assert.match(shell, /\/account\/invite-to-eat/);
  assert.match(createSheet, /RSVP without a Menuply account/);
  assert.doesNotMatch(createSheet, /feed-x-share-my-menuply/);
  assert.doesNotMatch(createSheet, /feed-x-diary/);
  assert.doesNotMatch(createSheet, /feed-x-my-menuply/);
  assert.doesNotMatch(createSheet, /feed-x-create-account/);
  assert.doesNotMatch(createSheet, /feed-x-sign-in/);
  assert.doesNotMatch(createSheet, /feed-x-account/);

  const home = read("src/pages/consumer/feed/FeedHomePage.jsx");
  assert.match(home, /listSeeWhosEating/);
  assert.match(home, /variant="feedHome"/);
  assert.match(home, /feed-home-x-coach/);
  assert.match(home, /FEED_HOME_X_COACH_COPY/);
  assert.match(home, /FEED_HOME_X_COACH_DURATION_MS/);
  assert.doesNotMatch(home, /feed-home-chrome/);
  assert.doesNotMatch(home, /feed-search/);
  assert.doesNotMatch(home, /feed-deals/);

  const searchPage = read("src/pages/consumer/feed/FeedSearchPage.jsx");
  assert.match(searchPage, /HomeNext embedInFeedShell/);
  assert.match(searchPage, /GrubbidSearchResults embedInFeedShell/);
  assert.match(searchPage, /isFeedShellSearchResultsView/);
  assert.match(searchPage, /feed-shop-page/);
  assert.match(searchPage, /minHeight: "100dvh"/);

  const siteFooter = read("src/components/SiteFooter.jsx");
  assert.match(siteFooter, /isFeedExperiencePath/);

  const searchResults = read("src/pages/GrubbidSearchResults.jsx");
  assert.doesNotMatch(searchResults, /FeedShopBasketButton/);
  assert.match(searchResults, /FEED_MOBILE_HEADER_OFFSET/);

  const shopBasket = read("src/components/consumer/feed/FeedShopBasketButton.jsx");
  assert.match(shopBasket, /feed-shop-basket/);

  const desktopRail = read("src/components/consumer/feed/FeedDesktopRail.jsx");
  assert.match(desktopRail, /feed-desktop-rail/);
  assert.match(desktopRail, /feed-desktop-login/);
  assert.match(desktopRail, /feed-more-open-desktop/);
  assert.match(desktopRail, /FEED_HOME_TAB/);
  assert.match(desktopRail, /FEED_RAIL_TABS_AFTER_HOME/);
  assert.match(desktopRail, /feed-desktop-share-my-menuply/);
  assert.match(desktopRail, /feed-desktop-add-menu/);
  assert.match(desktopRail, /FEED_MENU_CAPTURE_HINT/);
  assert.match(desktopRail, /Share My Menuply/);
  assert.match(desktopRail, /showShopBasket/);
  assert.match(desktopRail, /showShopBasket\s*=\s*false/);
  assert.match(desktopRail, /feed-desktop-shop-basket/);
  assert.match(desktopRail, /resetSearch/);

  const mobileHeader = read("src/components/consumer/feed/FeedMobileHeader.jsx");
  assert.match(mobileHeader, /feed-more-open-mobile/);
  assert.match(mobileHeader, /4caf50/);
  assert.match(mobileHeader, /showShopBasket/);
  assert.match(mobileHeader, /FeedShopBasketButton/);

  const homeNext = read("src/pages/HomeNext.jsx");
  assert.match(homeNext, /FEED_MENU_CAPTURE_HINT/);
  assert.doesNotMatch(homeNext, /FeedShopBasketButton/);
  assert.match(homeNext, /feed-shop-hero/);
  assert.match(homeNext, /FEED_MOBILE_HEADER_OFFSET/);
  assert.match(homeNext, /Help me decide/);
  assert.match(homeNext, /!embedInFeedShell \?/);
  assert.doesNotMatch(homeNext, /loadMenus: !embedInFeedShell/);
  assert.match(homeNext, /rewriteSearchPathForFeedShell/);

  const feedNavLib = read("src/lib/feedShellNavigation.js");
  assert.match(feedNavLib, /rewriteSearchPathForFeedShell/);
  assert.match(feedNavLib, /isFeedShellSearchResultsView/);
  assert.match(feedNavLib, /isFeedShopRoute/);

  const feedLinks = read("src/lib/feedShellLinks.js");
  assert.match(feedLinks, /resetSearch: true/);
  assert.match(feedLinks, /FEED_PRIMARY_TABS/);
  assert.match(feedLinks, /FEED_MORE_SECTIONS/);
  assert.match(feedLinks, /For Diners/);
  assert.match(feedLinks, /feed-more-signup/);
  assert.doesNotMatch(feedLinks, /Discover food/);
  assert.doesNotMatch(feedLinks, /feed-more-login/);
  assert.match(feedLinks, /\/clusters/);
  assert.match(feedLinks, /restaurant\/onboarding/);
  assert.match(feedLinks, /feed-nav-home/);

  const shellPage = read("src/pages/consumer/feed/FeedShellPage.jsx");
  assert.match(shellPage, /isFeedShopRoute/);
  assert.match(shellPage, /showShopBasket/);
  assert.match(shellPage, /FeedDesktopRail/);
  assert.match(shellPage, /FeedMobileHeader/);
  assert.match(shellPage, /FeedMorePanel/);
  assert.match(shellPage, /useFeedShellDesktop/);

  const guestLanding = read("src/components/consumer/feed/FeedGuestProfileLanding.jsx");
  assert.match(guestLanding, /FEED_GUEST_PROFILE_CARDS/);
  assert.match(guestLanding, /feed-guest-profile-landing/);
  assert.match(feedLinks, /feed-guest-join-card/);
  assert.match(feedLinks, /feed-more-add-menu/);

  const myMenuply = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.match(myMenuply, /FeedGuestProfileLanding/);
  assert.match(myMenuply, /!embedInFeedShell \? <BottomNav \/>/);

  const menusPage = read("src/pages/consumer/feed/FeedMenusPage.jsx");
  assert.match(menusPage, /My Menu Stack/);
  assert.doesNotMatch(menusPage, /feed-menus-add-menu/);
  assert.doesNotMatch(menusPage, /FEED_MENU_CAPTURE_PATH/);

  const morePanel = read("src/components/consumer/feed/FeedMorePanel.jsx");
  assert.match(morePanel, /feed-more-add-menu/);
  assert.match(morePanel, /FeedMenuCaptureCameraIcon/);

  const reel = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(reel, /see-whos-eating-menu-bookmark/);
  assert.match(reel, /"reviews"/);

  const eatingHub = read("src/pages/consumer/myMenuply/eatingHubUtils.js");
  assert.match(eatingHub, /id: "reviews"/);
  assert.match(eatingHub, /label: "Reviews"/);

  const compose = read("src/lib/feedVideoCompose.js");
  assert.match(compose, /postFeedReviewVideo/);
});

test("Feed as home: / uses Feed shell; FeedPrimaryNav paths unchanged", () => {
  const flags = read("src/lib/featureFlags.js");
  assert.match(flags, /export function isFeedAsHomeEnabled/);
  assert.match(flags, /isExplicitlyFalse\(import\.meta\.env\.VITE_FEED_AS_HOME\)/);

  const homeRoot = read("src/pages/HomeRoot.jsx");
  assert.match(homeRoot, /isFeedAsHomeEnabled\(\)/);
  assert.match(homeRoot, /FeedShellPage/);
  assert.match(homeRoot, /FeedHomePage/);
  assert.doesNotMatch(homeRoot, /BottomNav/);

  const nav = read("src/components/consumer/feed/FeedPrimaryNav.jsx");
  assert.match(nav, /FEED_LEFT_TABS/);
  assert.match(nav, /FEED_RIGHT_TABS/);

  const feedLinks = read("src/lib/feedShellLinks.js");
  assert.match(feedLinks, /to: "\/feed"/);
  assert.match(feedLinks, /to: "\/feed\/connects"/);
  assert.match(feedLinks, /to: "\/feed\/menus"/);
  assert.match(feedLinks, /to: "\/feed\/deals"/);
  assert.match(feedLinks, /to: "\/feed\/search"/);
  assert.match(feedLinks, /to: "\/feed\/profile"/);
  assert.match(feedLinks, /FEED_MENU_CAPTURE_PATH/);
  assert.match(feedLinks, /FEED_MENU_CAPTURE_HINT/);
  assert.doesNotMatch(feedLinks, /to: "\/"/);

  const app = read("src/App.jsx");
  assert.match(app, /path="\/home-next"/);
  assert.match(app, /HomeNext/);
});
