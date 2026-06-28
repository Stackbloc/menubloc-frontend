import { isLegacyHomepageEnabled } from "../lib/featureFlags.js";
import LegacyDiscoveryHome from "./LegacyDiscoveryHome.jsx";
import HomeNext from "./HomeNext.jsx";

/**
 * Live "/" selector. HomeNext is the AUTHORITATIVE default home page.
 * LegacyDiscoveryHome only when VITE_USE_LEGACY_HOME=1 or VITE_ENABLE_NEW_HOMEPAGE=0.
 * See: src/pages/HOME_PAGE_AUTHORITY.md
 */
export default function HomeRoot() {
  return isLegacyHomepageEnabled() ? <LegacyDiscoveryHome /> : <HomeNext />;
}
