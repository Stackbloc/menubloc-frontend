import test from "node:test";
import assert from "node:assert/strict";

import { apiGet } from "../src/lib/api.js";

test("apiGet includes credentials for authenticated menu filtering", async () => {
  const originalFetch = global.fetch;
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return {
      ok: true,
      text: async () => JSON.stringify({ ok: true }),
    };
  };

  try {
    await apiGet("/menus/browse");
  } finally {
    global.fetch = originalFetch;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.credentials, "include");
});
