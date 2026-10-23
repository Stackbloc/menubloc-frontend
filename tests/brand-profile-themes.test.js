import test from "node:test";
import assert from "node:assert/strict";

import {
  BRAND_PROFILE_THEMES,
  findBrandProfileTheme,
  normalizeBrandName,
  resolveBrandProfileTheme,
} from "../src/lib/brandProfileThemes.js";
import { profileStyleToCssVars } from "../src/lib/restaurantProfileStyles.js";

test("national brand names resolve to their theme", () => {
  assert.equal(findBrandProfileTheme("IHOP")?.name, "IHOP");
  assert.equal(findBrandProfileTheme("Starbucks")?.name, "Starbucks");
  assert.equal(findBrandProfileTheme("McDonald's")?.name, "McDonald's");
  assert.equal(findBrandProfileTheme("McDonald’s")?.name, "McDonald's");
  assert.equal(findBrandProfileTheme("Chick-fil-A")?.name, "Chick-fil-A");
  assert.equal(findBrandProfileTheme("Carl's Jr.")?.name, "Carl's Jr.");
  assert.equal(findBrandProfileTheme("In-N-Out Burger")?.name, "In-N-Out Burger");
  assert.equal(findBrandProfileTheme("Dunkin' Donuts")?.name, "Dunkin'");
  assert.equal(findBrandProfileTheme("Starbucks - Glendale #12")?.name, "Starbucks");
});

test("independents with brand-like names are not themed", () => {
  assert.equal(findBrandProfileTheme("Starbucks Deli & Grill"), null);
  assert.equal(findBrandProfileTheme("Subway Tacos"), null);
  assert.equal(findBrandProfileTheme("Cafe Dulce"), null);
  assert.equal(findBrandProfileTheme(""), null);
  assert.equal(normalizeBrandName("Chick-fil-A"), "chickfila");
});

test("owner manual style wins over brand theme; brand_profile name is used", () => {
  assert.equal(resolveBrandProfileTheme({ name: "IHOP", profile_style_key: "coastal" }), null);
  assert.equal(
    resolveBrandProfileTheme({ name: "Store 600", brand_profile: { name: "IHOP" } })?.name,
    "IHOP"
  );
});

test("brand themes set explicit hero stops and readable button text", () => {
  for (const theme of Object.values(BRAND_PROFILE_THEMES)) {
    const vars = profileStyleToCssVars(theme);
    assert.equal(vars["--profile-hero-from"], theme.hero[0]);
    assert.equal(vars["--profile-hero-via"], theme.hero[1]);
    assert.equal(vars["--profile-hero-to"], theme.hero[2]);
    assert.match(theme.pageBackground, /^#[0-9a-f]{6}$/i);
    assert.equal(theme.buttonText, "#ffffff");
  }
});
