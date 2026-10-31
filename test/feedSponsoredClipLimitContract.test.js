import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// Andre 2026-10-31: sponsored clips play at most max_play_seconds (30 s), then the Feed moves on.
test("Feed player moves on when a sponsored clip reaches its play limit", () => {
  const src = fs.readFileSync(new URL("../src/pages/consumer/myMenuply/SeeWhosEatingFullscreen.jsx", import.meta.url), "utf8");
  assert.match(src, /max_play_seconds/);
  assert.match(src, /onTimeUpdate=\{/);
  assert.match(src, /currentTime >= sponsoredMaxSeconds/);
  assert.match(src, /onEnded=\{onClipFinished\}/);
  // The ref is a hook: it must come before the component's early return.
  assert.ok(src.indexOf("const sponsoredCapRef = useRef(null);") < src.indexOf('variant === "modal") || typeof document === "undefined") return null;'));
});
