/**
 * Menu Appearance — registry + recommendation + Menu Lab / public apply contract.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  MENU_APPEARANCE_KEYS,
  DEFAULT_MENU_APPEARANCE_KEY,
  isValidMenuAppearanceKey,
  shouldApplyMenuAppearance,
  buildMenuAppearanceRootStyle,
  getMenuAppearanceTokens,
  evaluateMenuAppearanceContrast,
} from "../src/lib/menuAppearances.js";
import {
  getRecommendedMenuAppearance,
  resolveEffectiveMenuAppearance,
} from "../src/lib/menuAppearanceRecommendation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

describe("Menu Appearance registry", () => {
  it("has 15 approved keys including modern_minimal", () => {
    assert.equal(MENU_APPEARANCE_KEYS.length, 15);
    assert.ok(isValidMenuAppearanceKey("modern_minimal"));
    assert.ok(isValidMenuAppearanceKey("artisan"));
    assert.equal(isValidMenuAppearanceKey("bogus"), false);
  });

  it("builds CSS vars and root style for an appearance", () => {
    const style = buildMenuAppearanceRootStyle("coastal");
    assert.equal(style.backgroundColor, getMenuAppearanceTokens("coastal").pageBackground);
    assert.ok(style["--menu-surface"]);
    assert.ok(style["--menu-accent"]);
  });

  it("applies only for Default layout v1", () => {
    assert.equal(shouldApplyMenuAppearance("v1"), true);
    assert.equal(shouldApplyMenuAppearance("classic"), true);
    assert.equal(shouldApplyMenuAppearance("v12"), false);
    assert.equal(shouldApplyMenuAppearance("v16"), false);
    assert.equal(shouldApplyMenuAppearance("v17"), false);
  });

  it("keeps WCAG AA contrast for ink/muted/onPage on every appearance", () => {
    for (const key of MENU_APPEARANCE_KEYS) {
      const result = evaluateMenuAppearanceContrast(key);
      assert.ok(
        result.ok,
        `${key} failed contrast (ink=${result.inkRatio.toFixed(2)}, muted=${result.mutedRatio.toFixed(2)}, onPage=${result.onPageRatio.toFixed(2)})`
      );
      assert.ok(getMenuAppearanceTokens(key).ink);
      assert.ok(getMenuAppearanceTokens(key).muted);
    }
  });
});

describe("Menu Appearance recommendation", () => {
  it("maps category examples from the product brief", () => {
    assert.equal(getRecommendedMenuAppearance("fine_dining", null), "elegant");
    assert.equal(getRecommendedMenuAppearance("coffee_shop", null), "warm_paper");
    assert.equal(getRecommendedMenuAppearance("sports_bar", null), "industrial");
    assert.equal(getRecommendedMenuAppearance("seafood", null), "coastal");
    assert.equal(getRecommendedMenuAppearance("italian", null), "stone");
    assert.equal(getRecommendedMenuAppearance("bakery", null), "classic_paper");
    assert.equal(getRecommendedMenuAppearance("fast_casual", null), "modern_minimal");
    assert.equal(getRecommendedMenuAppearance("food_truck", null), "industrial");
  });

  it("falls back to modern_minimal for unknown", () => {
    assert.equal(getRecommendedMenuAppearance("xyz_unknown", null), DEFAULT_MENU_APPEARANCE_KEY);
  });

  it("manual override and clear-to-recommend", () => {
    assert.equal(
      resolveEffectiveMenuAppearance({
        menu_appearance_key: "linen",
        category: "fine_dining",
      }),
      "linen"
    );
    assert.equal(
      resolveEffectiveMenuAppearance({
        menu_appearance_key: null,
        category: "fine_dining",
      }),
      "elegant"
    );
  });
});

describe("Menu Appearance wiring contracts", () => {
  it("Menu Lab mounts Menu Appearance section and Save Design API", () => {
    const page = fs.readFileSync(
      path.join(ROOT, "src/pages/operator/OperatorMenuEditor.jsx"),
      "utf8"
    );
    assert.match(page, /Menu Appearance/);
    assert.match(page, /MenuAppearanceSelector/);
    assert.match(page, /menu_appearance_key|updateMenuAppearance/);
    assert.match(page, /menu-lab-menu-appearance-section/);
  });

  it("public Default menus gate appearance apply", () => {
    const publicMenu = fs.readFileSync(
      path.join(ROOT, "src/pages/PublicMenuPage.jsx"),
      "utf8"
    );
    const catalog = fs.readFileSync(
      path.join(ROOT, "src/components/menuCatalog/CatalogMenuRenderer.jsx"),
      "utf8"
    );
    const classic = fs.readFileSync(
      path.join(ROOT, "src/components/menu-templates/ClassicMenuTemplate.jsx"),
      "utf8"
    );
    assert.match(publicMenu, /shouldApplyMenuAppearance/);
    assert.match(publicMenu, /effective_menu_appearance|effectiveMenuAppearance/);
    assert.match(publicMenu, /data-menu-appearance/);
    assert.match(catalog, /shouldApplyMenuAppearance/);
    assert.match(classic, /menuAppearanceKey/);
    assert.match(classic, /--menu-surface/);
  });

  it("operator API exposes menu appearance helpers", () => {
    const api = fs.readFileSync(path.join(ROOT, "src/lib/operatorApi.js"), "utf8");
    assert.match(api, /getMenuAppearance/);
    assert.match(api, /updateMenuAppearance/);
    assert.match(api, /menu-appearance/);
  });
});
