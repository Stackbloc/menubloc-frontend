/**
 * profileViewMode helpers — Connect view URL must follow window search, not stale RR.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  buildProfileViewSearchParams,
  readConnectViewFromSearch,
} from "../src/pages/consumer/feed/profileViewMode.js";

test("readConnectViewFromSearch recognizes view=connect", () => {
  assert.equal(readConnectViewFromSearch(""), false);
  assert.equal(readConnectViewFromSearch("?view=connect"), true);
  assert.equal(readConnectViewFromSearch("view=connect"), true);
  assert.equal(readConnectViewFromSearch("?compose=ate&view=connect"), true);
});

test("buildProfileViewSearchParams toggles view while keeping other keys", () => {
  const prev = globalThis.window;
  globalThis.window = {
    location: { search: "?compose=ate&view=connect" },
  };
  try {
    const off = buildProfileViewSearchParams(false);
    assert.equal(off.get("view"), null);
    assert.equal(off.get("compose"), "ate");
    const on = buildProfileViewSearchParams(true);
    assert.equal(on.get("view"), "connect");
    assert.equal(on.get("compose"), "ate");
  } finally {
    globalThis.window = prev;
  }
});
