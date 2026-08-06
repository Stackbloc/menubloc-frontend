/**
 * Menu Wallpaper bank — resolve order + subtle opacity contract.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from "node:url";

import {
  MENU_WALLPAPER_NONE,
  MENU_WALLPAPER_PRESET_KEYS,
  SUBTLE_OPACITY_MIN,
  SUBTLE_OPACITY_MAX,
  APPEARANCE_TO_WALLPAPER_POOL,
  buildPresetCatalog,
  buildMenuChromeRootStyle,
  resolveMenuPattern,
  randomizeWallpaperParams,
  pickRandomMenuChromeDefaults,
  pickMenuChromeForRestaurant,
  wallpaperPoolForAppearance,
  getSuggestedWallpaperKeysForAppearance,
  sortWallpapersForAppearance,
} from "../src/lib/menuWallpapers.js";
import { getMenuAppearanceTokens } from "../src/lib/menuAppearances.js";
import { getTypeScopedAppearancePool } from "../src/lib/menuAppearanceRecommendation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

describe("Menu Wallpaper bank", () => {
  it("ships 20 subtle presets", () => {
    assert.equal(MENU_WALLPAPER_PRESET_KEYS.length, 20);
    for (const preset of buildPresetCatalog()) {
      const op = Number(preset.params.opacity);
      assert.ok(op >= SUBTLE_OPACITY_MIN && op <= SUBTLE_OPACITY_MAX, preset.key);
      assert.ok(String(preset.svg_data_uri).startsWith('url("data:image/svg+xml,'));
    }
  });

  it("resolve order: none → solid; null → appearance; key → bank", () => {
    const appearance = getMenuAppearanceTokens("classic_paper").backgroundPattern;
    assert.equal(
      resolveMenuPattern({ appearancePattern: appearance, wallpaperKey: MENU_WALLPAPER_NONE }),
      null
    );
    assert.equal(
      resolveMenuPattern({ appearancePattern: appearance, wallpaperKey: null }),
      appearance
    );
    const soft = resolveMenuPattern({
      appearancePattern: appearance,
      wallpaperKey: "soft_grid",
    });
    assert.ok(soft && soft !== appearance);
  });

  it("buildMenuChromeRootStyle honors none and bank override", () => {
    const noneStyle = buildMenuChromeRootStyle("classic_paper", MENU_WALLPAPER_NONE);
    assert.equal(noneStyle.backgroundImage, "none");
    const override = buildMenuChromeRootStyle("classic_paper", "quiet_dots");
    assert.ok(override.backgroundImage.includes("svg"));
  });

  it("randomize stays subtle and auto-names", () => {
    const c = randomizeWallpaperParams({ serial: 14, family: "rings", seed: 42 });
    assert.match(c.name, /Soft Rings 14/);
    assert.ok(c.params.opacity >= SUBTLE_OPACITY_MIN && c.params.opacity <= SUBTLE_OPACITY_MAX);
  });

  it("new-menu chrome picker never returns dark for bakery", () => {
    for (let i = 0; i < 40; i++) {
      const picked = pickRandomMenuChromeDefaults({ category: "bakery" });
      assert.notEqual(picked.menu_appearance_key, "dark");
      assert.ok(MENU_WALLPAPER_PRESET_KEYS.includes(picked.menu_wallpaper_key));
    }
  });

  it("type-scoped chrome: seafood coastal family + matching wallpaper", () => {
    const pool = new Set(getTypeScopedAppearancePool("seafood", null));
    assert.ok(APPEARANCE_TO_WALLPAPER_POOL.coastal.includes("coastal_waves"));
    for (let i = 0; i < 40; i++) {
      const picked = pickMenuChromeForRestaurant({
        category: "seafood",
        avoidAppearanceKey: null,
        avoidWallpaperKey: null,
      });
      assert.ok(pool.has(picked.menu_appearance_key), picked.menu_appearance_key);
      const walls = new Set(wallpaperPoolForAppearance(picked.menu_appearance_key));
      assert.ok(walls.has(picked.menu_wallpaper_key));
    }
  });

  it("suggested wallpapers sort first for appearance", () => {
    const catalog = buildPresetCatalog();
    const sorted = sortWallpapersForAppearance(catalog, "coastal");
    const suggested = getSuggestedWallpaperKeysForAppearance("coastal", catalog);
    assert.ok(suggested.includes("coastal_waves"));
    assert.ok(suggested.length >= 2);
    const head = sorted.slice(0, suggested.length).map((e) => e.key);
    assert.deepEqual(new Set(head), new Set(suggested));
    assert.ok(sorted.slice(suggested.length).every((e) => !suggested.includes(e.key)));
  });

  it("selectors sort type-related appearances and wallpapers", () => {
    const appearance = fs.readFileSync(
      path.join(ROOT, "src/components/operator/MenuAppearanceSelector.jsx"),
      "utf8"
    );
    const wallpaper = fs.readFileSync(
      path.join(ROOT, "src/components/operator/MenuWallpaperSelector.jsx"),
      "utf8"
    );
    assert.match(appearance, /sortAppearancesForRestaurantType/);
    assert.match(appearance, /getTypeScopedAppearancePool/);
    assert.match(wallpaper, /sortWallpapersForAppearance/);
    assert.match(wallpaper, /Suggested for this restaurant/);
  });

  it("public + owner surfaces wire wallpaper", () => {
    const publicMenu = fs.readFileSync(path.join(ROOT, "src/pages/PublicMenuPage.jsx"), "utf8");
    const catalog = fs.readFileSync(
      path.join(ROOT, "src/components/menuCatalog/CatalogMenuRenderer.jsx"),
      "utf8"
    );
    const owner = fs.readFileSync(
      path.join(ROOT, "src/pages/owner/OwnerProfileManager.jsx"),
      "utf8"
    );
    const lab = fs.readFileSync(
      path.join(ROOT, "src/pages/operator/OperatorMenuEditor.jsx"),
      "utf8"
    );
    assert.match(publicMenu, /buildMenuChromeRootStyle/);
    assert.match(publicMenu, /readMenuWallpaperQueryOverride/);
    assert.match(catalog, /buildMenuChromeRootStyle/);
    assert.match(owner, /MenuWallpaperSelector/);
    assert.match(lab, /MenuWallpaperSelector/);
  });
});
