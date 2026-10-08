import test from "node:test";
import assert from "node:assert/strict";

// Minimal browser globals before importing the tracker (it registers pagehide listeners at load).
function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

const sent = [];
const nav = { userAgent: "Mozilla/5.0 (iPhone) Mobile Safari", globalPrivacyControl: undefined, doNotTrack: null };
globalThis.window = {
  location: { pathname: "/clusters/ca/los-angeles/usc", origin: "https://menuply.com", search: "" },
  navigator: nav,
  sessionStorage: makeStorage(),
  localStorage: makeStorage(),
  addEventListener: () => {},
  crypto: globalThis.crypto,
};
globalThis.document = { referrer: "", visibilityState: "visible", addEventListener: () => {} };
Object.defineProperty(globalThis, "navigator", { value: nav, configurable: true });
globalThis.fetch = async (url, init) => {
  sent.push({ url, body: JSON.parse(init.body) });
  return { ok: true, json: async () => ({ ok: true }) };
};

const tracker = await import("../src/lib/engagementTracking.js");
const { classifyRestaurantLink } = await import("../src/lib/engagementLinkClassifier.js");

function flushed() {
  tracker.flushEngagementEvents();
  const events = sent.flatMap((b) => b.body.events);
  sent.length = 0;
  return events;
}

function reset(pathname = "/clusters/ca/los-angeles/usc") {
  tracker.resetEngagementTrackingForTests();
  window.sessionStorage.clear();
  window.location.pathname = pathname;
  nav.globalPrivacyControl = undefined;
  nav.doNotTrack = null;
  sent.length = 0;
}

test("one page view per navigation; re-render / StrictMode repeat is ignored", () => {
  reset();
  const a = tracker.beginPageView({ pageType: "cluster", clusterId: 1, navigationKey: "/clusters/usc" });
  const b = tracker.beginPageView({ pageType: "cluster", clusterId: 1, navigationKey: "/clusters/usc" });
  assert.equal(a, b);
  const events = flushed();
  assert.equal(events.filter((e) => e.event_name === "page_view").length, 1);
  assert.match(events[0].event_id, /^[0-9a-f-]{36}$/);
  assert.equal(events[0].page_view_id, a);
});

test("repeat clicks within 1s count once; different items both count", () => {
  reset("/restaurants/ca/la/burger-barn/menu");
  tracker.beginPageView({ pageType: "menu", restaurantId: 10, navigationKey: "m" });
  tracker.trackEngagement("menu_item_click", { menu_item_id: 1001 });
  tracker.trackEngagement("menu_item_click", { menu_item_id: 1001 });
  tracker.trackEngagement("menu_item_click", { menu_item_id: 1002 });
  const clicks = flushed().filter((e) => e.event_name === "menu_item_click");
  assert.deepEqual(clicks.map((c) => c.menu_item_id), [1001, 1002]);
  assert.ok(clicks.every((c) => c.restaurant_id === 10 && c.page_type === "menu"));
});

test("cluster click-through: immediate source on next view + session attribution on later events", () => {
  reset();
  tracker.beginPageView({ pageType: "cluster", clusterId: 1, navigationKey: "c" });
  tracker.trackEngagement(
    "restaurant_click",
    { restaurant_id: 10, subtype: "menu", placement: "cluster_directory" },
    { target_restaurant_id: 10, href: "/restaurants/ca/la/burger-barn/menu" }
  );
  window.location.pathname = "/restaurants/ca/la/burger-barn/menu";
  tracker.beginPageView({ pageType: "menu", restaurantId: 10, navigationKey: "m1" });
  tracker.trackEngagement("menu_item_click", { menu_item_id: 1001 });
  const events = flushed();
  const menuView = events.find((e) => e.event_name === "page_view" && e.page_type === "menu");
  assert.equal(menuView.src_page_type, "cluster");
  assert.equal(menuView.src_cluster_id, 1);
  assert.equal(menuView.src_placement, "cluster_directory");
  assert.equal(menuView.attr_cluster_id, 1);
  const click = events.find((e) => e.event_name === "menu_item_click");
  assert.equal(click.attr_cluster_id, 1);
  assert.equal(click.src_cluster_id, undefined, "immediate source only on the page view");
});

test("no attribution when the next page is not the clicked destination", () => {
  reset();
  tracker.beginPageView({ pageType: "cluster", clusterId: 1, navigationKey: "c" });
  tracker.trackEngagement("restaurant_click", { restaurant_id: 10, subtype: "menu" }, { target_restaurant_id: 10 });
  window.location.pathname = "/restaurants/ca/la/noodle-house";
  tracker.beginPageView({ pageType: "profile", restaurantId: 20, navigationKey: "p" });
  const view = flushed().find((e) => e.page_type === "profile");
  assert.equal(view.src_page_type, null);
  assert.equal(view.attr_cluster_id, undefined);
  // The pending click was consumed: a later visit to restaurant 10 is not attributed either.
  window.location.pathname = "/restaurants/ca/la/burger-barn/menu";
  tracker.beginPageView({ pageType: "menu", restaurantId: 10, navigationKey: "m" });
  const later = flushed().find((e) => e.page_type === "menu");
  assert.equal(later.src_cluster_id, null);
  assert.equal(later.attr_cluster_id, undefined);
});

test("session attribution only applies to the restaurant that was clicked", () => {
  reset();
  tracker.beginPageView({ pageType: "cluster", clusterId: 2, navigationKey: "c" });
  tracker.trackEngagement("restaurant_click", { restaurant_id: 10 }, { target_restaurant_id: 10 });
  tracker.beginPageView({ pageType: "profile", restaurantId: 10, navigationKey: "p10" });
  tracker.beginPageView({ pageType: "profile", restaurantId: 20, navigationKey: "p20" });
  const views = flushed().filter((e) => e.page_type === "profile");
  assert.equal(views[0].attr_cluster_id, 2);
  assert.equal(views[1].attr_cluster_id, undefined);
});

test("Global Privacy Control, Do Not Track, and staff sessions disable tracking", () => {
  reset();
  nav.globalPrivacyControl = true;
  assert.equal(tracker.isEngagementTrackingAllowed(), false);
  assert.equal(tracker.beginPageView({ pageType: "cluster", clusterId: 1 }), null);
  nav.globalPrivacyControl = undefined;
  nav.doNotTrack = "1";
  assert.equal(tracker.isEngagementTrackingAllowed(), false);
  nav.doNotTrack = null;
  window.sessionStorage.setItem("grubbid.analytics.is_staff", "1");
  assert.equal(tracker.isEngagementTrackingAllowed(), false);
  window.sessionStorage.removeItem("grubbid.analytics.is_staff");
  assert.equal(tracker.isEngagementTrackingAllowed(), true);
  assert.equal(flushed().length, 0);
});

test("batch payload carries pseudonymous ids only and caps at 25 events", () => {
  reset();
  tracker.beginPageView({ pageType: "cluster", clusterId: 1, navigationKey: "c" });
  for (let i = 0; i < 30; i += 1) tracker.trackEngagement("restaurant_click", { restaurant_id: 100 + i });
  tracker.flushEngagementEvents();
  assert.ok(sent.every((b) => b.body.events.length <= 25));
  const body = sent[0].body;
  assert.deepEqual(Object.keys(body).sort(), ["device_type", "events", "referrer", "session_id", "visitor_id"]);
  assert.equal(body.device_type, "mobile");
  assert.ok(!("user_id" in body));
});

test("tracking never throws when fetch fails", () => {
  reset();
  const original = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("network down");
  };
  try {
    tracker.beginPageView({ pageType: "cluster", clusterId: 1, navigationKey: "c" });
    assert.doesNotThrow(() => tracker.flushEngagementEvents());
  } finally {
    globalThis.fetch = original;
  }
});

test("link classifier: phone, directions, order, website, deal, profile→menu", () => {
  const a = (href) => ({ getAttribute: () => href });
  const ctx = { restaurantId: 10, website: "https://burgerbarn.com/", pageType: "profile" };
  assert.deepEqual(classifyRestaurantLink(a("tel:+13105551212"), ctx).fields, { restaurant_id: 10, subtype: "phone" });
  assert.equal(classifyRestaurantLink(a("https://www.google.com/maps/dir/?api=1&destination=x"), ctx).fields.subtype, "directions");
  assert.equal(classifyRestaurantLink(a("https://www.doordash.com/store/123"), ctx).fields.subtype, "order");
  assert.equal(classifyRestaurantLink(a("https://www.burgerbarn.com"), ctx).fields.subtype, "website");
  assert.equal(classifyRestaurantLink(a("https://instagram.com/burgerbarn"), ctx), null, "unrelated links are not guessed");
  const deal = classifyRestaurantLink(a("/deals/501"), ctx);
  assert.equal(deal.event, "deal_click");
  assert.equal(deal.fields.deal_id, 501);
  const menu = classifyRestaurantLink(a("/restaurants/ca/la/burger-barn/menu"), ctx);
  assert.equal(menu.event, "restaurant_click");
  assert.equal(menu.fields.subtype, "menu");
  assert.equal(classifyRestaurantLink(a("/restaurants/ca/la/burger-barn/menu"), { ...ctx, pageType: "menu" }), null);
});
