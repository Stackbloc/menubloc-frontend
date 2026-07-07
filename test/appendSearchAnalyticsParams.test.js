"use strict";

import { test } from "node:test";
import assert from "node:assert/strict";
import { appendSearchAnalyticsParams } from "../src/lib/analyticsSessionId.js";

test("appendSearchAnalyticsParams sets session_id from analytics session storage", () => {
  const storage = new Map();
  global.window = {
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
    crypto: { randomUUID: () => "test-analytics-session" },
  };

  const params = new URLSearchParams({ q: "burger" });
  appendSearchAnalyticsParams(params);

  assert.equal(params.get("session_id"), "test-analytics-session");
  assert.equal(params.get("q"), "burger");
});
