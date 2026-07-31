/**
 * Owner Menu Manager — Add Restaurant restore contract.
 * Reuses existing Menu Manager create/upload flow; asserts discoverability + ID success copy.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("owner Add Restaurant restore", () => {
  it("Menu Manager shell exposes labeled Add Restaurant CTA to create=1", () => {
    const shell = read("src/pages/owner/OwnerMenuUploads.jsx");
    assert.match(shell, /data-testid="owner-add-restaurant"/);
    assert.match(shell, /Add Restaurant/);
    assert.match(shell, /startAddRestaurant/);
    assert.match(shell, /set\("create", "1"\)/);
    assert.match(shell, /delete\("restaurant"\)/);
  });

  it("restaurant finder exposes Add Restaurant wired to create flow", () => {
    const finder = read("src/pages/owner/OwnerMenuRestaurantFinder.jsx");
    const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(finder, /data-testid="owner-finder-add-restaurant"/);
    assert.match(finder, /onAddRestaurant/);
    assert.match(finder, /Add Restaurant/);
    assert.match(workspace, /onAddRestaurant=\{clearSelectedRestaurant\}/);
    assert.match(workspace, /set\("create", "1"\)/);
  });

  it("create success shows persistent Restaurant ID and Menu ID", () => {
    const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(workspace, /data-testid="owner-restaurant-created-success"/);
    assert.match(workspace, /Restaurant created successfully/);
    assert.match(workspace, /Restaurant ID:/);
    assert.match(workspace, /Menu ID:/);
    assert.match(workspace, /\/owner\/profile-manager\?restaurant=\$\{restaurant\.id\}/);
  });

  it("upload success panel shows Restaurant ID, Menu ID, and parse status", () => {
    const workspace = read("src/pages/owner/OwnerMenuCreateWorkspace.jsx");
    assert.match(workspace, /data-testid="owner-upload-menu-panel"/);
    assert.match(workspace, /data-testid="owner-menu-attached-success"/);
    assert.match(workspace, /Menu attached successfully/);
    assert.match(workspace, /Upload ID:/);
    assert.match(workspace, /parseStatus/);
    assert.match(workspace, /\+ Add Another Menu/);
  });

  it("create API client still posts to menu-console restaurants", () => {
    const api = read("src/lib/ownerApi.js");
    assert.match(api, /post\("\/api\/owner\/menu-console\/restaurants"/);
  });
});
