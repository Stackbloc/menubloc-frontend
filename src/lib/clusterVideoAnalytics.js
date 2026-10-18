/**
 * Cluster video analytics → POST /api/analytics/video-events (video_events pipeline).
 *
 * The server owns counting: a "view" is derived from watch_ms (2s or 25%), completions and
 * unique viewers are rolled up per video. The client only reports what happened:
 *   impression       — hero clip first shown on screen
 *   play             — playback started; metadata.trigger says how
 *                      (hero_autoplay | hero_tap | dish_icon | restaurant_icon | reel_thumb |
 *                       header_pill | next | resume)
 *   watch_progress   — furthest point reached, sent on pause / clip change / close / page hide
 *   click_menu_item  — "Order" on the From-the-video dish
 *   click_restaurant — "Menu" on a clip without a dish
 * Every event carries metadata.surface ("cluster_hero" | "cluster_floating") and cluster_id.
 *
 * Same privacy gate as engagement analytics (off for staff, GPC, Do Not Track). Fire-and-forget.
 */

import { getAnalyticsSessionId, getAnalyticsVisitorId } from "./analyticsSessionId.js";
import { classifyDeviceType } from "./analyticsClientHints.js";
import { isEngagementTrackingAllowed } from "./engagementTracking.js";

const ENV = import.meta.env || {};
const API = (
  ENV.VITE_API_BASE_URL ||
  (ENV.DEV ? "http://localhost:3001" : "https://menubloc-backend-production.up.railway.app")
).replace(/\/$/, "");

// Kinds the video analytics service accepts (videoAnalyticsConfig VIDEO_KINDS).
const TRACKED_KINDS = new Set(["ate", "want", "plan", "event", "deal", "managed"]);
const FLUSH_DELAY_MS = 1500;
const BATCH_MAX = 40;

let queue = [];
let flushTimer = null;

function sourceId(video) {
  const n = Number(video?.video_id);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function cleanMetadata(meta) {
  const out = {};
  for (const [key, value] of Object.entries(meta || {})) {
    if (value == null || value === "") continue;
    if (typeof value === "number" && !Number.isFinite(value)) continue;
    out[key] = value;
  }
  return out;
}

/**
 * @param {object} video — cluster video row (kind, video_id, restaurant_id, menu_item_id)
 * @param {string} eventType
 * @param {{ watchMs?: number, durationMs?: number, surface?: string, trigger?: string,
 *           clusterId?: number|string, menuItemId?: number|string }} [details]
 */
export function trackClusterVideoEvent(video, eventType, details = {}) {
  try {
    const kind = String(video?.kind || "").trim().toLowerCase();
    const id = sourceId(video);
    if (!TRACKED_KINDS.has(kind) || !id) return false;
    if (!isEngagementTrackingAllowed()) return false;

    const watchMs = Number(details.watchMs);
    const durationMs = Number(details.durationMs) || Number(video?.duration_ms) || null;
    queue.push({
      video_kind: kind,
      video_source_id: id,
      event_type: eventType,
      watch_ms: Number.isFinite(watchMs) && watchMs > 0 ? Math.round(watchMs) : undefined,
      video_duration_ms: durationMs && durationMs > 0 ? Math.round(durationMs) : undefined,
      event_timestamp: new Date().toISOString(),
      metadata: cleanMetadata({
        surface: details.surface || null,
        trigger: details.trigger || null,
        cluster_id: Number(details.clusterId) || null,
        restaurant_id: Number(video?.restaurant_id) || null,
        menu_item_id: Number(details.menuItemId ?? video?.menu_item_id) || null,
      }),
    });
    if (queue.length >= BATCH_MAX) flushClusterVideoEvents();
    else if (!flushTimer) flushTimer = setTimeout(flushClusterVideoEvents, FLUSH_DELAY_MS);
    return true;
  } catch {
    return false;
  }
}

export function flushClusterVideoEvents() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  while (queue.length) {
    const events = queue.splice(0, BATCH_MAX);
    try {
      fetch(`${API}/api/analytics/video-events`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: getAnalyticsSessionId() || null,
          visitor_id: getAnalyticsVisitorId() || null,
          device_type: classifyDeviceType(window.navigator?.userAgent || ""),
          events,
        }),
      }).catch(() => {});
    } catch {
      // never throw into the UI
    }
  }
}

if (typeof window !== "undefined") {
  try {
    window.addEventListener("pagehide", flushClusterVideoEvents);
  } catch {
    // ignore
  }
}

/**
 * Watch-time tracker for one <video> element: reports the furthest point reached once per
 * clip (on pause / switch / close), so the server can qualify views without a timer.
 */
export function createWatchReporter({ surface, clusterId }) {
  let current = null; // { video, maxMs, reportedMs }

  function sample(el) {
    if (!current || !el) return;
    const ms = Math.round((Number(el.currentTime) || 0) * 1000);
    if (ms > current.maxMs) current.maxMs = ms;
    const dur = Number(el.duration);
    if (Number.isFinite(dur) && dur > 0) current.durationMs = Math.round(dur * 1000);
  }

  function report() {
    if (!current || current.maxMs <= current.reportedMs) return;
    trackClusterVideoEvent(current.video, "watch_progress", {
      watchMs: current.maxMs,
      durationMs: current.durationMs,
      surface,
      clusterId,
    });
    current.reportedMs = current.maxMs;
  }

  return {
    start(video) {
      if (current?.video?.video_key === video?.video_key) return;
      report();
      current = video ? { video, maxMs: 0, reportedMs: 0, durationMs: null } : null;
    },
    sample,
    report,
    stop() {
      report();
      current = null;
    },
  };
}
