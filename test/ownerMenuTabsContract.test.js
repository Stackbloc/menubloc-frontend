/**
 * Owner Menu Manager: same-screen menu tabs + programmable display order.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("owner menu tabs + display order", () => {
  it("Menu Manager workspace exposes tabs, default, activate, and order controls", () => {
    const src = readFileSync(join(root, "src/pages/owner/OwnerMenuCreateWorkspace.jsx"), "utf8");
    assert.match(src, /function sortMenusByDisplayPriority/);
    assert.match(src, /data-testid="owner-menu-tabs-panel"/);
    assert.match(src, /data-testid="owner-menu-tab"/);
    assert.match(src, /data-testid="owner-menu-set-default"/);
    assert.match(src, /data-testid="owner-menu-toggle-active"/);
    assert.match(src, /data-testid="owner-menu-order-earlier"/);
    assert.match(src, /data-testid="owner-menu-order-later"/);
    assert.match(src, /data-testid="owner-add-another-menu"/);
    assert.match(src, /async function handleAddMenu/);
    assert.match(src, /createMenuConsoleMenu/);
    assert.match(src, /display_priority/);
    assert.match(src, /is_primary: true/);
    assert.match(src, /is_active: nextActive/);
    assert.match(src, /All menus share this screen as tabs/);
  });
});
