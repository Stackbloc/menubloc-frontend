/**
 * Contract: hide Google/Apple consumer auth UI when not configured.
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(
  join(root, "src/components/consumer/ConsumerAuthShared.jsx"),
  "utf8"
);

test("SocialAuthSection hides when Google and Apple are not configured", () => {
  assert.match(src, /function SocialAuthSection/);
  assert.match(src, /VITE_GOOGLE_CLIENT_ID/);
  assert.match(src, /VITE_APPLE_CLIENT_ID/);
  assert.match(src, /VITE_APPLE_REDIRECT_URI/);
  assert.match(src, /if \(!showGoogle && !showApple\) return null/);
  assert.match(src, /showGoogle \? \(/);
  assert.match(src, /showApple \? \(/);
});
