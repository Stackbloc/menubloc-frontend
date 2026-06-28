import { isLegacyHomepageEnabled } from "../lib/featureFlags.js";
import LegacyDiscoveryHome from "./LegacyDiscoveryHome.jsx";
import HomeNext from "./HomeNext.jsx";

/**
 * Live "/" selector. HomeNext is default; legacy discovery home when flag is on.
 */
export default function HomeRoot() {
  return isLegacyHomepageEnabled() ? <LegacyDiscoveryHome /> : <HomeNext />;
}
