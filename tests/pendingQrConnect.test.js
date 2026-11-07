import test from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};

const {
  dinerQrTokenFromConnectPath,
  savePendingQrConnect,
  loadPendingQrConnect,
  clearPendingQrConnect,
} = await import("../src/lib/pendingQrConnect.js");

const T = "d3671231-b597-4519-aa9b-3b05fe8d0440";
const OTHER = "11111111-1111-4111-8111-111111111111";

test("reads the token from a connect path", () => {
  assert.equal(dinerQrTokenFromConnectPath(`/connect/d/${T}`), T);
  assert.equal(dinerQrTokenFromConnectPath(`/connect/d/${T}?x=1`), T);
  assert.equal(dinerQrTokenFromConnectPath("/account"), "");
});

test("save → load → clear", () => {
  savePendingQrConnect(`/connect/d/${T}`);
  assert.deepEqual(loadPendingQrConnect(), { token: T });
  clearPendingQrConnect(OTHER); // a different QR doesn't clear it
  assert.deepEqual(loadPendingQrConnect(), { token: T });
  clearPendingQrConnect(T);
  assert.equal(loadPendingQrConnect(), null);
});

test("expires after 7 days", () => {
  store.set("menuply.pendingQrConnect.v1", JSON.stringify({ token: T, saved_at: Date.now() - 8 * 86400000 }));
  assert.equal(loadPendingQrConnect(), null);
});
