"use strict";

const assert = require("assert");

// Simulate Vite env injection for unit checks
function legacyEnabled(env) {
  const isTruthy = (v) => /^(1|true|yes|on)$/i.test(String(v || "").trim());
  const isFalse = (v) => /^(0|false|no|off)$/i.test(String(v || "").trim());
  if (isTruthy(env.VITE_USE_LEGACY_HOME)) return true;
  if (isFalse(env.VITE_ENABLE_NEW_HOMEPAGE)) return true;
  return false;
}

assert.strictEqual(legacyEnabled({}), false, "default is new home");
assert.strictEqual(legacyEnabled({ VITE_USE_LEGACY_HOME: "1" }), true);
assert.strictEqual(legacyEnabled({ VITE_ENABLE_NEW_HOMEPAGE: "0" }), true);
assert.strictEqual(legacyEnabled({ VITE_ENABLE_NEW_HOMEPAGE: "1" }), false);

console.log("featureFlags routing tests passed");
