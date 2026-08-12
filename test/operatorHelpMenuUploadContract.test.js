/**
 * Operator Help Center documents menu scan upload steps and 20 MB cap.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("operator Help Center menu upload", () => {
  it("includes How to Upload a Menu with 20 MB parameters and operator steps", () => {
    const src = readFileSync(join(root, "src/pages/operator/RestaurantHelpCenter.jsx"), "utf8");
    assert.match(src, /id: "how-to-upload-a-menu"/);
    assert.match(src, /How to Upload a Menu/);
    assert.match(src, /\/operator\/login/);
    assert.match(src, /\/operator\/menulab/);
    assert.match(src, /Add via Upload/);
    assert.match(src, /Maximum 20 MB per file/);
    assert.match(src, /File is too large\. Maximum is 20 MB\./);
    assert.match(src, /id: "menu-upload-problems"/);
    assert.match(src, /Do not retry the same oversized file/);
    assert.match(src, /Add Another Menu/);
    assert.match(src, /display order/);
  });
});
