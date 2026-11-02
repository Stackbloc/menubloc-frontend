import test from "node:test";
import assert from "node:assert/strict";

import { BRAND_PROFILE_THEMES } from "../src/lib/brandProfileThemes.js";
import { brandMenuTokens, buildBrandMenuRootStyle, resolveBrandMenuTheme } from "../src/lib/brandMenuThemes.js";
import { contrastRatio } from "../src/lib/menuAppearances.js";

test("chain menus pick up the brand profile palette", () => {
  const ihop = resolveBrandMenuTheme({ restaurant_name: "IHOP" });
  assert.equal(ihop?.name, "IHOP");
  assert.equal(ihop.tokens.pageBackground, BRAND_PROFILE_THEMES.ihop.pageBackground);
  assert.equal(ihop.tokens.menuSurface, "#ffffff");
  assert.equal(resolveBrandMenuTheme({ name: "Starbucks - Glendale #12" })?.name, "Starbucks");
  assert.equal(resolveBrandMenuTheme({ restaurant_name: "Store 4" }, "Popeyes")?.name, "Popeyes");
});

test("independents and owner-chosen menu looks are not brand themed", () => {
  assert.equal(resolveBrandMenuTheme({ restaurant_name: "Cafe Dulce" }), null);
  assert.equal(resolveBrandMenuTheme({ restaurant_name: "Subway Tacos" }), null);
  assert.equal(resolveBrandMenuTheme({ restaurant_name: "IHOP", menu_appearance_key: "classic_paper" }), null);
  assert.equal(resolveBrandMenuTheme({ restaurant_name: "IHOP", menu_wallpaper_key: "none" }), null);
  assert.equal(resolveBrandMenuTheme(null), null);
});

test("every brand keeps menu text readable on the white menu card", () => {
  for (const [key, theme] of Object.entries(BRAND_PROFILE_THEMES)) {
    const t = brandMenuTokens(theme);
    assert.ok(contrastRatio(t.sectionHeader, t.menuSurface) >= 4.5, `${key} section header`);
    assert.ok(contrastRatio("#ffffff", t.tabActive) >= 4.5, `${key} active tab text`);
    assert.ok(contrastRatio(t.ink, t.menuSurface) >= 4.5, `${key} ink`);
    assert.ok(contrastRatio(t.onPage, t.pageBackground) >= 4.5, `${key} page text`);
    const style = buildBrandMenuRootStyle(t);
    assert.equal(style["--menu-tab-active"], t.tabActive);
    assert.equal(style["--menu-section-header"], t.sectionHeader);
  }
});
