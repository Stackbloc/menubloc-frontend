import test from "node:test";
import assert from "node:assert/strict";

import {
  trackCheckoutCompleted,
  trackEvent,
  trackSearchPerformed,
} from "../src/lib/analytics.js";

test("trackEvent returns false when gtag is unavailable", () => {
  const originalWindow = global.window;
  global.window = {};
  try {
    assert.equal(trackEvent("search_performed", { search_term: "chicken" }), false);
  } finally {
    global.window = originalWindow;
  }
});

test("trackEvent forwards sanitized payloads to gtag", () => {
  const calls = [];
  const originalWindow = global.window;
  global.window = {
    gtag: (...args) => calls.push(args),
    location: { search: "" },
    __grubbidAnalyticsDebug: { enabled: false },
  };
  try {
    assert.equal(
      trackSearchPerformed({ searchTerm: " chicken ", source: "discovery_search", resultCount: 12 }),
      true
    );
  } finally {
    global.window = originalWindow;
  }
  assert.deepEqual(calls[0], [
    "event",
    "search_performed",
    { search_term: "chicken", source: "discovery_search", result_count: 12 },
  ]);
});

test("purchase maps order id to transaction_id", () => {
  const calls = [];
  const originalWindow = global.window;
  global.window = {
    gtag: (...args) => calls.push(args),
    location: { search: "" },
    __grubbidAnalyticsDebug: { enabled: false },
  };
  try {
    assert.equal(
      trackCheckoutCompleted({
        restaurantId: 44,
        restaurantName: "Test Kitchen",
        orderId: "ord_123",
        value: 22.5,
        currency: "USD",
        itemCount: 3,
      }),
      true
    );
  } finally {
    global.window = originalWindow;
  }
  assert.equal(calls[0][1], "purchase");
  assert.equal(calls[0][2].transaction_id, "ord_123");
});
