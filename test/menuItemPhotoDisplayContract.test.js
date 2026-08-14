/**
 * MenuDesignPhotoSlot must keep sized wrappers in consumer (non-designEdit) view.
 * Regression: returning bare <img> dropped 72×72 constraints and blew dish photos
 * across the public menu card (Klaudette 2026-08-14).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const slotSrc = fs.readFileSync(
  path.join(root, "src/components/menu-templates/MenuDesignPhotoEditOverlay.jsx"),
  "utf8"
);

test("MenuDesignPhotoSlot wraps children with style when designEdit disabled", () => {
  assert.match(
    slotSrc,
    /if\s*\(\s*!enabled\s*\)\s*\{[\s\S]*?return\s*\(\s*<div\s+style=\{style\}/
  );
  assert.doesNotMatch(
    slotSrc,
    /if\s*\(\s*!enabled\s*\)\s*\{\s*return children/
  );
});

test("PublicMenuItemCard passes fixed item thumb dimensions into MenuDesignPhotoSlot", () => {
  const card = fs.readFileSync(
    path.join(root, "src/components/menu-templates/PublicMenuItemCard.jsx"),
    "utf8"
  );
  assert.match(card, /MenuDesignPhotoSlot/);
  assert.match(card, /width:\s*density\s*===\s*"cinematic"\s*\?\s*100\s*:\s*72/);
  assert.match(card, /flexShrink:\s*0/);
  assert.match(card, /overflow:\s*"hidden"/);
});
