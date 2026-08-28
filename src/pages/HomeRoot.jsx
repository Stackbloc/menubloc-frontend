import { isLegacyHomepageEnabled, isFeedAsHomeEnabled } from "../lib/featureFlags.js";
import LegacyDiscoveryHome from "./LegacyDiscoveryHome.jsx";
import HomeNext from "./HomeNext.jsx";
import FeedShellPage from "./consumer/feed/FeedShellPage.jsx";
import FeedHomePage from "./consumer/feed/FeedHomePage.jsx";

/**
 * Live "/" selector.
 * Default: Feed shell (FeedPrimaryNav + FeedHomePage; nav links stay `/feed/*`).
 * VITE_FEED_AS_HOME=0 → HomeNext at `/` (HPP rollback).
 * VITE_USE_LEGACY_HOME / VITE_ENABLE_NEW_HOMEPAGE=0 → LegacyDiscoveryHome.
 * HomeNext always at `/home-next`. Parallel `/feed` routes unchanged.
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
