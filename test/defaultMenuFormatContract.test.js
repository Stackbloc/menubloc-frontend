/**
 * Canonical Default public-menu format (Classic v1 + Fine v17).
 *
 * Locked from the 2026-08-03 Fixins Soul Kitchen reference:
 * - Restaurant header: name, then like + share immediately adjacent
 * - Every section labeled (uppercase), including the first
 * - Item row: name | like + share + price
 *
 * Custom gallery layouts (v12–v15) are out of scope for this contract.
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

test("PublicMenuMainContent defaults unknown styles to Classic (v1)", () => {
  const src = read("src/components/menu-templates/PublicMenuMainContent.jsx");
  assert.match(src, /else content = <ClassicMenuTemplate/);
  assert.match(src, /resolveTemplateMenuStyle/);
});

test("resolveTemplateMenuStyle maps brand-tint and editorial-refresh to Classic", async () => {
  const { resolveTemplateMenuStyle } = await import(
    "../src/components/menu-templates/menuPresentationUtils.js"
  );
  assert.equal(resolveTemplateMenuStyle("v1"), "v1");
  assert.equal(resolveTemplateMenuStyle("classic"), "v1");
  assert.equal(resolveTemplateMenuStyle(""), "v1");
  assert.equal(resolveTemplateMenuStyle("v16"), "v1");
  assert.equal(resolveTemplateMenuStyle("v11"), "v1");
  assert.equal(resolveTemplateMenuStyle("v17"), "v17");
});

test("ClassicMenuTemplate: header like/share adjacent + every section titled + editorial item rows", () => {
  const src = read("src/components/menu-templates/ClassicMenuTemplate.jsx");
  assert.match(src, /MenuHeaderNameWithActions/);
  assert.match(src, /FollowRestaurantButton/);
  assert.match(src, /ShareButton/);
  assert.match(src, /displaySections\.map/);
  assert.match(src, /getLocalizedField\(sec,\s*"title"/);
  assert.match(src, /textTransform:\s*"uppercase"/);
  // Title is always rendered — no first-section skip.
  assert.doesNotMatch(src, /sIdx\s*===\s*0\s*\?\s*null/);
  assert.doesNotMatch(src, /sIdx\s*>\s*0\s*&&[\s\S]{0,40}title/);
  assert.match(src, /editorialRefresh=\{true\}/);
});

test("FineMenuTemplate: same header icons, section titles, and editorial item rows", () => {
  const src = read("src/components/menu-templates/FineMenuTemplate.jsx");
  assert.match(src, /MenuHeaderNameWithActions/);
  assert.match(src, /FollowRestaurantButton/);
  assert.match(src, /ShareButton/);
  assert.match(src, /displaySections\.map/);
  assert.match(src, /getLocalizedField\(sec,\s*"title"/);
  assert.match(src, /editorialRefresh=\{true\}/);
});

test("MenuHeaderNameWithActions keeps like/share beside the restaurant name", () => {
  const src = read("src/components/menu-templates/MenuHeaderIconRail.jsx");
  assert.match(src, /flex:\s*["']0 1 auto["']/);
  assert.doesNotMatch(src, /flex:\s*1[,\n]/);
  assert.doesNotMatch(src, /marginLeft:\s*["']?auto["']?/);
});

test("PublicMenuItemCard editorial row order is like → share → price", () => {
  const src = read("src/components/menu-templates/PublicMenuItemCard.jsx");
  const editorialBlock = src.slice(src.indexOf("editorialRefresh ? ("), src.indexOf(") : compactActions ? ("));
  assert.ok(editorialBlock.length > 200, "expected editorialRefresh title/actions block");
  const likeIdx = editorialBlock.indexOf("LikeMenuItemButton");
  const shareIdx = editorialBlock.indexOf("ShareButton");
  const priceIdx = editorialBlock.indexOf("{price ? (");
  assert.ok(likeIdx > 0, "LikeMenuItemButton in editorial row");
  assert.ok(shareIdx > likeIdx, "ShareButton after Like");
  assert.ok(priceIdx > shareIdx, "price after Share");
});

test("normalizeMenuDisplaySections never drops section titles", async () => {
  const { normalizeMenuDisplaySections } = await import(
    "../src/lib/menuClientPreferenceFilter.js"
  );
  const sections = normalizeMenuDisplaySections([
    { title: "LIL' BITS", items: [{ name: "Artichoke Dip" }] },
    { title: "  ", items: [{ name: "Other" }] },
    { items: [{ name: "No title" }] },
  ]);
  assert.equal(sections[0].title, "LIL' BITS");
  assert.equal(sections[1].title, "Menu");
  assert.equal(sections[2].title, "Menu");
});

test("Menu Appearance surface must not clip first section title under sticky header", () => {
  for (const rel of [
    "src/pages/PublicMenuPage.jsx",
    "src/components/menuCatalog/CatalogMenuRenderer.jsx",
  ]) {
    const marker = "applyMenuAppearance && appearanceTokens";
    const src = read(rel);
    const idx = src.indexOf(marker);
    assert.ok(idx >= 0, rel);
    const snippet = src.slice(idx, idx + 650);
    assert.doesNotMatch(snippet, /overflow:\s*["']hidden["']/);
  }
});
