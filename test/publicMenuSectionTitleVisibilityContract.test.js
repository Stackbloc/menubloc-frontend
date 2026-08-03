/**
 * Public menu section titles must stay visible below the sticky restaurant header.
 *
 * Root cause (Fixins LIL' BITS, 2026-08-03): Menu Appearance wrapped
 * PublicMenuMainContent in overflow:"hidden". That + position:sticky on the
 * Classic/Fine header overlaps ~32px of following content, covering the first
 * section label under the sticky hairline.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

/** Extract the Menu Appearance surface wrapper around PublicMenuMainContent. */
function appearanceSurfaceSnippet(src) {
  const marker = "applyMenuAppearance && appearanceTokens";
  const idx = src.indexOf(marker);
  assert.ok(idx >= 0, "expected Menu Appearance surface wrapper");
  return src.slice(idx, idx + 650);
}

test("PublicMenuPage appearance surface must not use overflow:hidden around sticky menus", () => {
  const snippet = appearanceSurfaceSnippet(read("src/pages/PublicMenuPage.jsx"));
  assert.match(snippet, /PublicMenuMainContent/);
  assert.match(snippet, /borderRadius:\s*12/);
  assert.doesNotMatch(snippet, /overflow:\s*["']hidden["']/);
  assert.match(snippet, /Keep overflow visible/);
});

test("CatalogMenuRenderer appearance surface must not use overflow:hidden around sticky menus", () => {
  const snippet = appearanceSurfaceSnippet(read("src/components/menuCatalog/CatalogMenuRenderer.jsx"));
  assert.match(snippet, /PublicMenuMainContent/);
  assert.match(snippet, /borderRadius:\s*12/);
  assert.doesNotMatch(snippet, /overflow:\s*["']hidden["']/);
  assert.match(snippet, /Keep overflow visible/);
});

test("ClassicMenuTemplate still renders section titles from displaySections", () => {
  const src = read("src/components/menu-templates/ClassicMenuTemplate.jsx");
  assert.match(src, /position:\s*"sticky"/);
  assert.match(src, /getLocalizedField\(sec,\s*"title"/);
  assert.match(src, /textTransform:\s*"uppercase"/);
  assert.match(src, /--menu-section-header/);
});
