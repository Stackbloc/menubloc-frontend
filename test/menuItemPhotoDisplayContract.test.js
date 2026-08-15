/**
 * MenuDesignPhotoSlot must keep sized wrappers in consumer (non-designEdit) view.
 * Regression: returning bare <img> dropped 72×72 constraints and blew dish photos
 * across the public menu card (Klaudette 2026-08-14).
 *
 * All public gallery layouts must allow Klaudette-style left dish thumbs (not hard-off).
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
  assert.match(card, /width:\s*density\s*===\s*"cinematic"\s*\?\s*115\s*:\s*83/);
  assert.match(card, /width:\s*74/);
  assert.match(card, /flexShrink:\s*0/);
  assert.match(card, /overflow:\s*"hidden"/);
});

test("Fine menu uses shouldShowItemImages (no hard-coded photo off)", () => {
  const fine = fs.readFileSync(
    path.join(root, "src/components/menu-templates/FineMenuTemplate.jsx"),
    "utf8"
  );
  assert.match(fine, /shouldShowItemImages/);
  assert.match(fine, /showImage=\{showItemImages\}/);
  assert.doesNotMatch(fine, /showImage=\{false\}/);
});

test("Gallery presets enable item photo thumbnails (Klaudette layout)", async () => {
  const { MENU_DESIGN_LAB_THEMES } = await import("../src/data/menuDesignLabThemes.js");
  const gallery = MENU_DESIGN_LAB_THEMES.filter((t) => t.visibleInGallery !== false);
  assert.ok(gallery.length >= 5, "expected gallery themes");
  for (const theme of gallery) {
    const itemImages = String(theme?.preset?.imageRules?.itemImages || "").toLowerCase();
    assert.ok(
      itemImages.includes("thumbnail") ||
        itemImages.includes("optional") ||
        itemImages.includes("all"),
      `${theme.style} (${theme.name}) must allow item photos, got itemImages=${itemImages}`
    );
    assert.ok(!itemImages.includes("none"), `${theme.style} must not set itemImages none`);
  }
});

test("DEFAULT_MENU_THEME_SETTINGS enables Klaudette-style item thumbs", async () => {
  const { DEFAULT_MENU_THEME_SETTINGS, shouldShowItemImages } = await import(
    "../src/components/menu-templates/menuThemeSettings.js"
  );
  assert.equal(DEFAULT_MENU_THEME_SETTINGS.image_density, "thumbnail");
  assert.equal(DEFAULT_MENU_THEME_SETTINGS.item_image_style, "thumbnail");
  assert.equal(shouldShowItemImages(DEFAULT_MENU_THEME_SETTINGS), true);
});
