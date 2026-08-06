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
  buildPresetCatalog,
  buildMenuChromeRootStyle,
  resolveMenuPattern,
  randomizeWallpaperParams,
  pickRandomMenuChromeDefaults,
} from "../src/lib/menuWallpapers.js";
import { getMenuAppearanceTokens } from "../src/lib/menuAppearances.js";

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

  it("new-menu chrome picker never returns dark", () => {
    for (let i = 0; i < 40; i++) {
      const picked = pickRandomMenuChromeDefaults();
      assert.notEqual(picked.menu_appearance_key, "dark");
      assert.ok(MENU_WALLPAPER_PRESET_KEYS.includes(picked.menu_wallpaper_key));
    }
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
