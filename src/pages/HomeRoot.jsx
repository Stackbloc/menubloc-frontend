import { Navigate } from "react-router-dom";
import { isLegacyHomepageEnabled, isFeedAsHomeEnabled } from "../lib/featureFlags.js";
import LegacyDiscoveryHome from "./LegacyDiscoveryHome.jsx";
import HomeNext from "./HomeNext.jsx";

/**
 * Live "/" selector.
 * Default (feed-as-home): redirect `/` → `/feed` so **one** FeedShell + Outlet owns
 * Feed → Profile → Deals on **mobile and desktop** (no second shell via children on `/`).
 * Mobile: FeedPrimaryNav. Desktop: FeedDesktopRail. Same `/feed/*` routes either way.
 * VITE_FEED_AS_HOME=0 → HomeNext at `/` (HPP rollback).
 * VITE_USE_LEGACY_HOME / VITE_ENABLE_NEW_HOMEPAGE=0 → LegacyDiscoveryHome.
 * HomeNext always at `/home-next`. Parallel `/feed` routes unchanged.
 * See: src/pages/HOME_PAGE_AUTHORITY.md
 */
export default function HomeRoot() {
  if (isLegacyHomepageEnabled()) return <LegacyDiscoveryHome />;
  if (isFeedAsHomeEnabled()) {
    // One shell only (mobile bottom nav + desktop left rail). Mounting
    // FeedShellPage+FeedHomePage as children on `/` while Profile lived under
    // `/feed/*` tore down/rebuilt the shell and left primary tabs dead after
    // Feed → Profile on both viewports.
    return <Navigate to="/feed" replace />;
  }
  return <HomeNext />;
}
