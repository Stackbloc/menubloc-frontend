/**
 * Thin analytics wrappers for restaurant profile Videos.
 */
import { trackEvent } from "./analytics.js";

export function trackVideoTileImpression(params = {}) {
  return trackEvent("video_tile_impression", params);
}

export function trackVideoTileOpen(params = {}) {
  return trackEvent("video_tile_open", params);
}

export function trackVideoSheetClose(params = {}) {
  return trackEvent("video_sheet_close", params);
}
