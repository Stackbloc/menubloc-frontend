// WEB-001 (Andre 2026-11-13): web Feed follows the app; Today on the website.
import { test } from "vitest";
import assert from "node:assert/strict";
import { appendUniqueFeedRows } from "../feedRepeatVideos.js";
import { currentWindowKey, mealTabs, parseToday, todayQuery } from "../todayHome.js";
import { resolveFeedTabs } from "../feedShellLinks.js";

test("Feed skips a clip whose video file is already loaded; sponsored clips repeat on purpose", () => {
  const rows = [
    { id: "managed:1", video_url: "https://v/1.mp4" },
    { id: "managed:2", video_url: "https://v/1.mp4#t=0.1" },
    { id: "sponsored:9", kind: "sponsored", video_url: "https://v/1.mp4" },
    { id: "ate:3", video_url: "https://v/3.mp4" },
  ];
  assert.deepEqual(appendUniqueFeedRows([], rows).map((r) => r.id), ["managed:1", "sponsored:9", "ate:3"]);
  assert.deepEqual(appendUniqueFeedRows(rows.slice(3), [{ id: "x", video_url: "https://v/3.mp4" }]), []);
});

test("Today parses the server's reply like the app", () => {
  const t = parseToday({
    window: { key: "lunch" },
    days: [{ date: "2026-11-13", has_plans: true }, { date: "bad" }],
    picks: [{ rank: 1, kind: "dish", dish: { id: 5, name: "Taco" }, restaurant: { id: 2, name: "Spot" }, reason: { tag: "wish", label: "On your Wish List" } }, { restaurant: { id: 3 }, reason: { tag: "nope" } }],
    social: { open: { people: [{ user_id: 7, name: "Maya", vibe: "hungry", label: "Hungry now" }], up_for: [], plans: [{ ref: "1", place_name: "X", action: "weird" }] } },
  });
  assert.equal(t.window, "lunch");
  assert.equal(t.days.length, 1);
  assert.equal(t.picks.length, 1);
  assert.equal(t.picks[0].dish.name, "Taco");
  assert.equal(t.social.open.people[0].vibe, "hungry");
  assert.equal(t.social.open.plans.length, 0);
  assert.throws(() => parseToday({}));
});

test("Today meal windows: 12–4 AM opens on last night's Late night", () => {
  const twoAm = new Date(2026, 10, 13, 2, 0);
  assert.equal(currentWindowKey(twoAm), "late");
  assert.equal(mealTabs(twoAm)[0].key, "late");
  assert.equal(currentWindowKey(new Date(2026, 10, 13, 12, 0)), "lunch");
  assert.match(todayQuery("dinner", { lat: 1, lng: 2 }, { key: "fast", kind: "style" }, "2026-11-14"), /window=dinner&date=2026-11-14&style=fast&lat=1&lng=2/);
});

test("Tabs: Today · Feed · Post · Search · Profile only when signed in with today_home", () => {
  const off = resolveFeedTabs({ isAuthenticated: true, todayHome: false });
  assert.deepEqual([...off.left, ...off.right].map((t) => t.label), ["Home", "Deals", "Search", "Profile"]);
  const guest = resolveFeedTabs({ isAuthenticated: false, todayHome: true });
  assert.equal(guest.left[0].label, "Home");
  const on = resolveFeedTabs({ isAuthenticated: true, todayHome: true });
  assert.deepEqual([...on.left, ...on.right].map((t) => t.label), ["Today", "Feed", "Search", "Profile"]);
  assert.ok(on.home.alsoActiveOn.includes("/feed/deals"));
});

test("Today reads For you / Newly added / Sponsored like the app (2026-11-13); only sponsored ideas carry a sponsorship id", () => {
  const t = parseToday({
    window: { key: "lunch" },
    picks: [],
    more: [
      { rank: 4, sponsorship_id: 501, restaurant: { id: 21, name: "Thai Patio" }, reason: { tag: "sponsored", label: "Sponsored", line: "2 for 1" } },
      { rank: 5, sponsorship_id: 9, restaurant: { id: 22, name: "Bombay Grill" }, reason: { tag: "for_you", label: "For you" } },
      { rank: 6, restaurant: { id: 23, name: "Poke Lab" }, reason: { tag: "newly_added", label: "Newly added" } },
    ],
  });
  assert.deepEqual(t.more.map((p) => [p.reason.tag, p.sponsorshipId]), [["sponsored", 501], ["for_you", null], ["newly_added", null]]);
});
