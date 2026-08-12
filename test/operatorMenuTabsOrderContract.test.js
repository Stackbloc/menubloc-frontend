/**
 * Operator Menu Lab: same-screen tabs with programmable display_priority.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("operator menu tabs + display order", () => {
  it("Menu Lab keeps tab chips, default, activate, and order controls", () => {
    const src = readFileSync(join(root, "src/pages/operator/OperatorMenuEditor.jsx"), "utf8");
    assert.match(src, /function sortMenusByDisplayPriority/);
    assert.match(src, /Set default/);
    assert.match(src, /← Order/);
    assert.match(src, /Order →/);
    assert.match(src, /handleReorderMenu/);
    assert.match(src, /handleSetPrimaryMenu/);
    assert.match(src, /handleToggleMenuActive/);
    assert.match(src, /display_priority/);
    assert.match(src, /sortMenusByDisplayPriority\(menus\)\.map/);
  });
});
