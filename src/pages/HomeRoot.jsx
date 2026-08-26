import { isLegacyHomepageEnabled, isFeedAsHomeEnabled } from "../lib/featureFlags.js";
import LegacyDiscoveryHome from "./LegacyDiscoveryHome.jsx";
import HomeNext from "./HomeNext.jsx";
import FeedShellPage from "./consumer/feed/FeedShellPage.jsx";
import FeedHomePage from "./consumer/feed/FeedHomePage.jsx";

/**
 * Live "/" selector.
 * Default: HomeNext (authoritative HPP home).
 * VITE_USE_LEGACY_HOME / VITE_ENABLE_NEW_HOMEPAGE=0 → LegacyDiscoveryHome.
 * VITE_FEED_AS_HOME=1 → video-first Feed (Andre cutover only; HomeNext stays at /home-next).
 * Parallel `/feed` routes always available regardless of this flag.
 * See: src/pages/HOME_PAGE_AUTHORITY.md
 */
export default function HomeRoot() {
  if (isLegacyHomepageEnabled()) return <LegacyDiscoveryHome />;
  if (isFeedAsHomeEnabled()) {
    return (
      <FeedShellPage>
        <FeedHomePage />
      </FeedShellPage>
    );
  }
  return <HomeNext />;
}
