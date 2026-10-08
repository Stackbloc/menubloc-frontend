/**
 * First-party engagement analytics (POST /api/analytics/events → engagement_events).
 * Counting rules: menubloc docs/audits/2026-10-09_engagement-analytics.md
 *
 * - Page view: one per navigation (beginPageView), keyed by page_view_id.
 * - Click: deliberate clicks; same element + entity within 1s counts once.
 * - Impression: >= 50% visible for >= 1s continuously, once per page view per placement.
 * - Attribution (sessionStorage, this tab only):
 *     immediate source — the click that led to the next page view (must match within 30s)
 *     session          — last cluster click-through to restaurant R, applied to R's events for 30 min
 *   New tabs, private windows, and blocked storage lose attribution. Unknown sources stay null.
 * - Tracking is off for owner/operator sessions and when GPC or Do Not Track is set.
 * - Every call is fire-and-forget and swallows errors; it can never break navigation.
 */

import { getAnalyticsSessionId, getAnalyticsVisitorId, isAnalyticsStaffSession } from "./analyticsSessionId.js";
import { classifyDeviceType } from "./analyticsClientHints.js";

const ENV = import.meta.env || {};
const API = (
  ENV.VITE_API_BASE_URL ||
  (ENV.DEV ? "http://localhost:3001" : "https://menubloc-backend-production.up.railway.app")
).replace(/\/$/, "");

const PENDING_NAV_KEY = "menuply.engagement.pending_nav.v1";
const SESSION_ATTR_KEY = "menuply.engagement.cluster_attr.v1";
const PENDING_NAV_TTL_MS = 30 * 1000;
const SESSION_ATTR_TTL_MS = 30 * 60 * 1000;
const CLICK_DEDUPE_MS = 1000;
const PAGE_VIEW_DEDUPE_MS = 2000;
const IMPRESSION_VISIBLE_RATIO = 0.5;
const IMPRESSION_DWELL_MS = 1000;
const FLUSH_DELAY_MS = 1500;
const BATCH_MAX = 25;

const NAVIGATING_EVENTS = new Set(["restaurant_click", "deal_click", "ad_click", "menu_item_click"]);

let queue = [];
let flushTimer = null;
let currentPage = null;
let lastPageViewKey = null;
const recentClicks = new Map();
const firedImpressions = new Set();

// ── consent / privacy gate ───────────────────────────────────────────────────
/** Single gate for all engagement tracking. A future consent banner plugs in here. */
export function isEngagementTrackingAllowed() {
  try {
    if (typeof window === "undefined" || typeof fetch !== "function") return false;
    if (isAnalyticsStaffSession()) return false;
    const nav = window.navigator || {};
    if (nav.globalPrivacyControl === true) return false;
    const dnt = nav.doNotTrack || window.doNotTrack || nav.msDoNotTrack;
    if (dnt === "1" || dnt === "yes") return false;
    return true;
  } catch {
    return false;
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
export function newEventId() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  } catch {
    return null;
  }
}

function toId(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

function readSession(key) {
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    if (value == null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked → attribution simply unavailable
  }
}

function pathOnly(href) {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return null;
  }
}

function sessionAttributionFor(restaurantId, now = Date.now()) {
  if (!restaurantId) return null;
  const map = readSession(SESSION_ATTR_KEY);
  const entry = map?.[String(restaurantId)];
  if (!entry || now - Number(entry.ts) > SESSION_ATTR_TTL_MS) return null;
  return entry;
}

function rememberSessionAttribution(restaurantId, attr, now = Date.now()) {
  if (!restaurantId || !attr?.cluster_id) return;
  const map = readSession(SESSION_ATTR_KEY) || {};
  for (const [key, entry] of Object.entries(map)) {
    if (now - Number(entry?.ts) > SESSION_ATTR_TTL_MS) delete map[key];
  }
  map[String(restaurantId)] = {
    cluster_id: attr.cluster_id,
    placement: attr.placement || null,
    advertisement_id: attr.advertisement_id || null,
    ts: now,
  };
  writeSession(SESSION_ATTR_KEY, map);
}

// ── transport ────────────────────────────────────────────────────────────────
function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEngagementEvents();
  }, FLUSH_DELAY_MS);
}

export function flushEngagementEvents() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  while (queue.length) {
    const events = queue.splice(0, BATCH_MAX);
    try {
      const ua = window.navigator?.userAgent || "";
      fetch(`${API}/api/analytics/events`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: getAnalyticsSessionId() || null,
          visitor_id: getAnalyticsVisitorId() || null,
          device_type: classifyDeviceType(ua),
          referrer: document.referrer || null,
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
    window.addEventListener("pagehide", flushEngagementEvents);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushEngagementEvents();
    });
  } catch {
    // ignore
  }
}

function enqueue(event) {
  queue.push(event);
  if (queue.length >= BATCH_MAX) flushEngagementEvents();
  else scheduleFlush();
}

// ── page views ───────────────────────────────────────────────────────────────
/**
 * Start a page view once the page's entity has loaded.
 * @param {object} spec { pageType, restaurantId, clusterId, dealId, menuId, navigationKey }
 *   navigationKey: router location.key — distinguishes real navigations from re-renders.
 * @returns {string|null} page_view_id
 */
export function beginPageView({ pageType, restaurantId = null, clusterId = null, dealId = null, menuId = null, navigationKey = "" } = {}) {
  try {
    if (!pageType || !isEngagementTrackingAllowed()) return null;
    const now = Date.now();
    const rid = toId(restaurantId);
    const cid = toId(clusterId);
    const did = toId(dealId);
    const viewKey = `${pageType}|${rid || ""}|${cid || ""}|${did || ""}|${navigationKey}`;
    if (lastPageViewKey && lastPageViewKey.key === viewKey && now - lastPageViewKey.ts < PAGE_VIEW_DEDUPE_MS) {
      return currentPage?.page_view_id || null;
    }

    const pageViewId = newEventId();
    if (!pageViewId) return null;
    const pagePath = window.location.pathname;
    // Pending impression timers belong to the previous page view.
    for (const el of [...observed.keys()]) unobserveImpression(el);

    // Immediate source: consumed by the first page view after the click, kept only if it matches.
    let src = null;
    const pending = readSession(PENDING_NAV_KEY);
    writeSession(PENDING_NAV_KEY, null);
    if (pending && now - Number(pending.ts) <= PENDING_NAV_TTL_MS) {
      const matches =
        (pending.target_restaurant_id && pending.target_restaurant_id === rid) ||
        (pending.target_deal_id && pending.target_deal_id === did) ||
        (pending.target_path && pending.target_path === pagePath);
      if (matches) src = pending;
    }
    if (src?.src_cluster_id && rid) {
      rememberSessionAttribution(rid, {
        cluster_id: src.src_cluster_id,
        placement: src.src_placement,
        advertisement_id: src.src_advertisement_id,
      }, now);
    }

    currentPage = {
      page_view_id: pageViewId,
      page_type: pageType,
      page_path: pagePath,
      restaurant_id: pageType === "menu" || pageType === "profile" ? rid : null,
      cluster_id: pageType === "cluster" ? cid : null,
      deal_id: pageType === "deal" ? did : null,
    };
    lastPageViewKey = { key: viewKey, ts: now };

    enqueue(withAttribution({
      event_id: newEventId(),
      event_name: "page_view",
      ...currentPage,
      restaurant_id: rid,
      menu_id: toId(menuId),
      src_page_type: src?.src_page_type || null,
      src_cluster_id: src?.src_cluster_id || null,
      src_placement: src?.src_placement || null,
      src_advertisement_id: src?.src_advertisement_id || null,
    }));
    return pageViewId;
  } catch {
    return null;
  }
}

function withAttribution(event) {
  if (event.page_type === "cluster") return event;
  const attr = sessionAttributionFor(toId(event.restaurant_id));
  if (!attr) return event;
  return {
    ...event,
    attr_cluster_id: attr.cluster_id,
    attr_placement: attr.placement,
    attr_advertisement_id: attr.advertisement_id,
  };
}

export function getCurrentPageView() {
  return currentPage;
}

// ── events ───────────────────────────────────────────────────────────────────
/**
 * Record an engagement event on the current page view.
 * fields: restaurant_id, menu_item_id, deal_id, advertisement_id, ad_default_banner_id,
 *   ad_inventory_id, venue_event_id, placement, position, subtype, label, menu_id
 * navigation: optional { target_restaurant_id, target_deal_id, href } — the click leads to another page.
 */
export function trackEngagement(eventName, fields = {}, navigation = null) {
  try {
    if (!eventName || !currentPage || !isEngagementTrackingAllowed()) return;
    const now = Date.now();
    const entityKey = [
      eventName, fields.restaurant_id, fields.menu_item_id, fields.deal_id,
      fields.advertisement_id, fields.ad_default_banner_id, fields.subtype, fields.label, fields.placement,
      currentPage.page_view_id,
    ].join("|");
    const last = recentClicks.get(entityKey);
    if (last && now - last < CLICK_DEDUPE_MS) return;
    recentClicks.set(entityKey, now);
    if (recentClicks.size > 200) {
      for (const [key, ts] of recentClicks) if (now - ts > CLICK_DEDUPE_MS) recentClicks.delete(key);
    }

    const event = {
      event_id: newEventId(),
      event_name: eventName,
      page_view_id: currentPage.page_view_id,
      page_type: currentPage.page_type,
      page_path: currentPage.page_path,
      restaurant_id: currentPage.restaurant_id,
      cluster_id: currentPage.cluster_id,
      deal_id: currentPage.deal_id,
      ...stripNulls(fields),
    };
    enqueue(withAttribution(event));

    if (navigation && NAVIGATING_EVENTS.has(eventName)) {
      const targetPath = navigation.href ? pathOnly(navigation.href) : null;
      writeSession(PENDING_NAV_KEY, {
        src_page_type: currentPage.page_type,
        src_cluster_id: currentPage.cluster_id || null,
        src_placement: fields.placement || null,
        src_advertisement_id: toId(fields.advertisement_id),
        target_restaurant_id: toId(navigation.target_restaurant_id),
        target_deal_id: toId(navigation.target_deal_id),
        target_path: targetPath,
        ts: now,
      });
    }
  } catch {
    // never throw into the UI
  }
}

function stripNulls(fields) {
  const out = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value != null && value !== "") out[key] = value;
  }
  return out;
}

// ── impressions ──────────────────────────────────────────────────────────────
let observer = null;
const observed = new Map(); // element → { eventName, fields, timer }

function impressionKey(eventName, fields) {
  return [
    currentPage?.page_view_id, eventName, fields.restaurant_id, fields.deal_id,
    fields.advertisement_id, fields.ad_default_banner_id, fields.placement,
  ].join("|");
}

function ensureObserver() {
  if (observer || typeof window === "undefined" || typeof window.IntersectionObserver !== "function") return observer;
  observer = new window.IntersectionObserver((entries) => {
    for (const entry of entries) {
      const state = observed.get(entry.target);
      if (!state) continue;
      if (entry.isIntersecting && entry.intersectionRatio >= IMPRESSION_VISIBLE_RATIO) {
        if (!state.timer) {
          state.timer = setTimeout(() => {
            state.timer = null;
            const key = impressionKey(state.eventName, state.fields);
            if (!firedImpressions.has(key)) {
              firedImpressions.add(key);
              trackEngagement(state.eventName, state.fields);
            }
            unobserveImpression(entry.target);
          }, IMPRESSION_DWELL_MS);
        }
      } else if (state.timer) {
        clearTimeout(state.timer);
        state.timer = null;
      }
    }
  }, { threshold: [0, IMPRESSION_VISIBLE_RATIO, 1] });
  return observer;
}

/** Measure an impression for el. No IntersectionObserver → no impression (never assumed). */
export function observeImpression(el, eventName, fields = {}) {
  try {
    if (!el || observed.has(el) || !currentPage || !isEngagementTrackingAllowed()) return;
    if (firedImpressions.has(impressionKey(eventName, fields))) return;
    const io = ensureObserver();
    if (!io) return;
    observed.set(el, { eventName, fields, timer: null });
    io.observe(el);
  } catch {
    // ignore
  }
}

export function unobserveImpression(el) {
  const state = observed.get(el);
  if (!state) return;
  if (state.timer) clearTimeout(state.timer);
  observed.delete(el);
  try {
    observer?.unobserve(el);
  } catch {
    // ignore
  }
}

/** Test hook. */
export function resetEngagementTrackingForTests() {
  queue = [];
  currentPage = null;
  lastPageViewKey = null;
  recentClicks.clear();
  firedImpressions.clear();
  for (const el of [...observed.keys()]) unobserveImpression(el);
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
}

export function peekEngagementQueueForTests() {
  return queue.slice();
}

export function observedImpressionCountForTests() {
  return observed.size;
}
