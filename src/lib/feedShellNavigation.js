import { isFeedAsHomeEnabled } from "./featureFlags.js";

/** Discovery home path for Feed shell Search tab (avoids loop when Feed is `/`). */
export function resolveFeedSearchHomePath() {
  return isFeedAsHomeEnabled() ? "/home-next" : "/";
}
