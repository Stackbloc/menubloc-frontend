/**
 * Profile Manager: Save profile vs Add update are separate actions.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(join(root, "src/pages/owner/OwnerProfileManager.jsx"), "utf8");

test("Add update stays disabled without a title; favorites use Save profile", () => {
  assert.match(src, /owner-profile-add-update/);
  assert.match(src, /disabled=\{updateSaving \|\| !String\(updateDraft\.title/);
  assert.match(src, /owner-profile-add-update-hint/);
  assert.match(src, /Favorite menu items are saved with Save\s+profile/);
  assert.match(src, /does not use Add update/);
  assert.match(src, /owner-profile-manager-unsaved-banner/);
  assert.match(src, /owner-profile-manager-save-inline/);
  assert.match(src, /Enter a title to enable/);
});
