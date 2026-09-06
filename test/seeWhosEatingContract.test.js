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
  assert.match(surface, /PUBLIC FEED/);
  assert.doesNotMatch(surface, /LIVE FEED/);
  assert.match(surface, /see-whos-eating-surface/);
  assert.match(surface, /live-feed-channel-dials/);
  assert.match(surface, /LIVE_FEED_CHANNELS/);
  assert.match(surface, /MENUPY_PRUNE_LIVE_FEED_ITEM/);
  assert.match(surface, /onRemovedFromFeed/);
  assert.match(surface, /Public Feed channels/);
  assert.match(surface, /minHeight:\s*40/);
  assert.match(surface, /channelLabel/);
  assert.match(surface, /resolveLiveFeedContentLink/);
  assert.match(surface, /FeedPlaceCaption/);
  assert.match(surface, /see-whos-eating-preview-place-caption/);
  assert.match(surface, /see-whos-eating-expand-hint/);
  assert.match(surface, /Tap to expand/);
  assert.doesNotMatch(surface, /TAP · FULL SCREEN/);

  const fullscreen = read("src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx");
  assert.match(fullscreen, /requestConnection/);
  assert.match(fullscreen, /hidePublicFeedItem/);
  assert.match(fullscreen, /Remove from Public Feed/);
  assert.match(fullscreen, /see-whos-eating-remove-public-feed/);
  assert.match(fullscreen, /onRemovedFromFeed/);
  assert.match(fullscreen, /see_whos_eating/);
  assert.match(fullscreen, /see-whos-eating-screen-name/);
  assert.match(fullscreen, /FeedPlaceCaption/);
  assert.match(fullscreen, /variant === "feedHome"|variant = "modal"/);
  assert.doesNotMatch(fullscreen, /showRestaurantSecondary/);
  assert.match(fullscreen, /liveFeedCreatorProfilePath/);
  assert.match(fullscreen, /isLiveFeedVenueItem/);
  assert.match(fullscreen, /see-whos-eating-video-tap/);
  assert.match(read("src/components/consumer/feed/FeedPlaceCaption.jsx"), /resolveFeedPlaceCaption/);
  assert.match(read("src/components/consumer/feed/FeedPlaceCaption.jsx"), /#5eead4/);
  assert.match(read("src/lib/liveFeedCategory.js"), /menu_item_href|menu-items\//);
  assert.match(read("src/lib/liveFeedCategory.js"), /resolveLiveFeedCaptionLinks/);
  assert.match(fullscreen, /createPortal/);
  assert.match(fullscreen, /100dvh|100vh/);
  assert.match(fullscreen, /feedVideoElementStyle/);
  assert.match(read("src/lib/feedVideoPresentation.js"), /defaultFeedVideoMuted/);
  assert.match(read("src/lib/feedVideoPresentation.js"), /attemptFeedVideoAutoplay/);
  assert.match(read("src/lib/feedVideoPresentation.js"), /preferSound/);
  assert.match(fullscreen, /defaultFeedVideoMuted/);
  assert.match(fullscreen, /attemptFeedVideoAutoplay/);
  assert.match(read("src/lib/feedVideoPresentation.js"), /FEED_VIDEO_OBJECT_FIT_DESKTOP.*contain/s);
  assert.match(read("src/lib/feedVideoPresentation.js"), /FEED_VIDEO_OBJECT_FIT_MOBILE.*cover/s);
  assert.match(fullscreen, /desktopFeedShell/);
  assert.match(read("src/pages/consumer/feed/FeedHomePage.jsx"), /desktopFeedShell=\{isDesktop\}/);
  assert.match(fullscreen, /resolveFeedVideoOverlayStyle|feed-desktop-rail-w/);
  assert.match(fullscreen, /see-whos-eating-sound-toggle/);
  assert.match(fullscreen, /useFeedShellDesktop/);
  assert.match(fullscreen, /showDesktopSoundLayer/);
  assert.match(fullscreen, /Click for sound/);
  assert.match(fullscreen, /applyVideoSoundState/);
  assert.match(fullscreen, /see-whos-eating-video-sound-layer/);
  assert.match(read("src/components/consumer/feed/FeedPlaceCaption.jsx"), /feed-video-restaurant-caption/);
  assert.match(read("src/components/consumer/feed/FeedPlaceCaption.jsx"), /feed-video-menu-item-caption/);
  assert.match(read("src/lib/liveFeedCategory.js"), /resolveFeedPlaceCaption/);
  assert.match(read("src/lib/liveFeedCategory.js"), /liveFeedRestaurantProfilePath/);
  assert.doesNotMatch(read("src/lib/liveFeedCategory.js"), /`\/r\/\$\{/);
  assert.match(read("src/pages/consumer/feed/FeedHomePage.jsx"), /isDesktop \? 0 : FEED_PRIMARY_NAV_HEIGHT/);
  assert.doesNotMatch(
    read("src/pages/consumer/feed/FeedHomePage.jsx"),
    /feed-home-desktop-nav-coach|FEED_HOME_DESKTOP_NAV_COACH/
  );
  assert.match(read("src/lib/feedVerticalReelNavigationCopy.js"), /arrow key/);
  assert.match(fullscreen, /see-whos-eating-fullscreen-close/);
  assert.match(fullscreen, /see-whos-eating-fullscreen-exit/);
  assert.match(fullscreen, /feedVerticalReelNavigationCopy/);
  assert.match(fullscreen, /formatVerticalReelNavHint/);
  assert.match(read("src/lib/feedVerticalReelNavigationCopy.js"), /Swipe up|swipe up|arrow key/);
  assert.match(fullscreen, /SWIPE_MIN_PX|onTouchEnd/);

  const page = read("src/pages/consumer/MyMenuplyPage.jsx");
  assert.doesNotMatch(page, /SeeWhosEatingSurface/);
  assert.doesNotMatch(page, /my-menuply-sticky-head/);
  assert.match(page, /pruneMenuplyLiveFeedItem/);

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
  assert.match(api, /hidePublicFeedItem/);
  assert.match(api, /market_discoverable:\s*false/);
  assert.match(api, /\/api\/consumer\/see-whos-eating/);
  assert.match(api, /uploadEatingPlanMedia/);
  assert.match(api, /\/api\/consumer\/what-we-doing\/photo/);

  const feedCtl = read("src/lib/menuplyLiveFeedControl.js");
  assert.match(feedCtl, /MENUPY_PRUNE_LIVE_FEED_ITEM/);
  assert.match(feedCtl, /pruneMenuplyLiveFeedItem/);
  assert.match(feedCtl, /Public Feed/);

  const cats = read("src/lib/liveFeedCategory.js");
  assert.match(cats, /resolveLiveFeedContentLink/);
  assert.match(cats, /abbreviateLiveFeedRestaurantName/);
  assert.match(cats, /\$\{place\}\/\$\{dishName\}/);
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
  assert.match(app, /Navigate to="\/feed\/profile"/);

  const rails = read("src/pages/consumer/myMenuply/MyMenuplyPresentationRails.jsx");
  assert.doesNotMatch(rails, /See who.?s eating/);
});
