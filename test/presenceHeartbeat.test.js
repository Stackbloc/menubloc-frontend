// Web presence heartbeat (Diner Intelligence Stage 2, plan 39).
import test from "node:test";
import assert from "node:assert/strict";

const store = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
};
const listeners = {};
globalThis.window = {
  localStorage: store(),
  sessionStorage: store(),
  navigator: {},
  location: { pathname: "/" },
  addEventListener: (t, f) => { listeners[t] = f; },
  removeEventListener: (t) => { delete listeners[t]; },
};
globalThis.document = { visibilityState: "visible", addEventListener: (t, f) => { listeners[t] = f; }, removeEventListener: (t) => { delete listeners[t]; } };
const sent = [];
let nextStatus = 200;
globalThis.fetch = async (url, init) => {
  sent.push({ url, init, body: JSON.parse(init.body) });
  return { ok: nextStatus < 300, status: nextStatus };
};

const P = await import("../src/lib/presenceHeartbeat.js");

test("first beat on start; web platform; cookie sent; no user id in the body", async () => {
  P.resetPresenceForTests();
  sent.length = 0;
  const stop = P.startPresenceHeartbeat();
  await new Promise((r) => setTimeout(r, 0));
  stop();
  assert.equal(sent.length, 1);
  const { url, init, body } = sent[0];
  assert.match(url, /\/api\/presence\/heartbeat$/);
  assert.equal(init.credentials, "include");
  assert.equal(body.platform, "web");
  assert.equal(body.state, "active");
  assert.match(body.session_key, /^[A-Za-z0-9_-]{8,80}$/);
  assert.ok(body.visitor_key.length >= 8);
  assert.equal("user_id" in body, false);
});

test("same key within 5 minutes; new key after a 5-minute gap, a 409 or a gone beat", async () => {
  P.resetPresenceForTests();
  const now = Date.now();
  const a = P.presenceSessionKey(now);
  assert.equal(P.presenceSessionKey(now + 4 * 60 * 1000), a);
  assert.notEqual(P.presenceSessionKey(now + 6 * 60 * 1000), a, "gap over 5 minutes");

  sent.length = 0;
  nextStatus = 409;
  await P.sendPresenceBeat("active");
  nextStatus = 200;
  await P.sendPresenceBeat("active");
  assert.notEqual(sent[1].body.session_key, sent[0].body.session_key, "409 → new key");

  await P.sendPresenceBeat("gone");
  await P.sendPresenceBeat("active");
  assert.equal(sent[2].body.state, "gone");
  assert.notEqual(sent[3].body.session_key, sent[2].body.session_key, "gone → new key");
});

test("staff browsers, GPC and hidden tabs don't beat", async () => {
  P.resetPresenceForTests();
  sent.length = 0;
  window.sessionStorage.setItem("grubbid.analytics.is_staff", "1");
  await P.sendPresenceBeat("active");
  window.sessionStorage.removeItem("grubbid.analytics.is_staff");
  window.navigator.globalPrivacyControl = true;
  await P.sendPresenceBeat("active");
  window.navigator.globalPrivacyControl = false;
  document.visibilityState = "hidden";
  const stop = P.startPresenceHeartbeat();
  stop();
  document.visibilityState = "visible";
  assert.equal(sent.length, 0);
});

// Stage 8 validation: a tab going to the background and coming back (fake clock; Date and setInterval mocked).
test("background → foreground: no beats while hidden, one beat on return; same session under 5 minutes, new after", async (t) => {
  t.mock.timers.enable({ apis: ["setInterval", "Date"], now: Date.parse("2026-11-14T20:00:00Z") });
  const flush = () => new Promise((r) => setImmediate(r));
  P.resetPresenceForTests();
  sent.length = 0;
  document.visibilityState = "visible";
  const stop = P.startPresenceHeartbeat();
  await flush();
  t.mock.timers.tick(60 * 1000);
  await flush();
  assert.equal(sent.length, 2, "first beat + one a minute while visible");
  const firstKey = sent[0].body.session_key;
  assert.equal(sent[1].body.session_key, firstKey);

  // Background for 3 minutes: the interval stops.
  document.visibilityState = "hidden";
  listeners.visibilitychange();
  t.mock.timers.tick(3 * 60 * 1000);
  await flush();
  assert.equal(sent.length, 2, "no beats while hidden");

  // Back within 5 minutes of the last beat: one beat right away, same session, then once a minute again.
  document.visibilityState = "visible";
  listeners.visibilitychange();
  await flush();
  assert.equal(sent.length, 3);
  assert.equal(sent[2].body.session_key, firstKey, "same session after a short background");
  t.mock.timers.tick(60 * 1000);
  await flush();
  assert.equal(sent.length, 4, "the minute beat restarted");

  // Background for 6 minutes: coming back starts a new session (the server counts it as a new visit).
  document.visibilityState = "hidden";
  listeners.visibilitychange();
  t.mock.timers.tick(6 * 60 * 1000);
  await flush();
  document.visibilityState = "visible";
  listeners.visibilitychange();
  await flush();
  assert.equal(sent.length, 5);
  assert.notEqual(sent[4].body.session_key, firstKey, "new session after a long background");

  // Closing the tab says goodbye.
  listeners.pagehide();
  await flush();
  assert.equal(sent[5].body.state, "gone");
  stop();
});
