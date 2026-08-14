/**
 * Restaurant Style — registry + recommendation + shell contract.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import {
  DEFAULT_PROFILE_STYLE_KEY,
  PROFILE_STYLE_KEYS,
  restaurantProfileStyles,
  getProfileStyleTokens,
  buildProfileStyleRootStyle,
  isValidProfileStyleKey,
} from "../src/lib/restaurantProfileStyles.js";
import {
  getRecommendedProfileStyle,
  resolveEffectiveProfileStyle,
} from "../src/lib/restaurantProfileStyleRecommendation.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const EXPECTED_NAMES = {
  modern_minimal: "Modern Minimal",
  fine_dining: "Marble & Linen",
  sports_bar: "Dark Leather",
  neighborhood_pub: "Neighborhood Pub",
  wood_and_steel: "Wood & Steel",
  rustic_bbq: "Rustic Wood",
  coastal: "Coastal Blue",
  tuscan_stone: "Tuscan Stone",
  tile: "Talavera Tile",
  minimal_bamboo: "Minimal Bamboo",
  silk: "Silk Pattern",
  warm_textile: "Warm Textile",
  white_stone: "White Stone",
  coffee_house: "Coffee Paper",
  parchment: "Parchment",
  brick_oven: "Brick Oven",
  industrial: "Industrial Metal",
  copper_and_oak: "Copper & Oak",
  vineyard: "Vineyard",
  soft_pastel: "Soft Pastels",
  sunrise: "Sunrise",
  jamaican: "Jamaican",
};

describe("restaurant profile styles registry", () => {
  it("has 22 styles with branded Smart Theme names", () => {
    assert.equal(PROFILE_STYLE_KEYS.length, 22);
    assert.ok(isValidProfileStyleKey("modern_minimal"));
    assert.equal(getProfileStyleTokens("coastal").name, "Coastal Blue");
    assert.equal(getProfileStyleTokens("sports_bar").name, "Dark Leather");
    assert.equal(getProfileStyleTokens("tile").name, "Talavera Tile");
    assert.equal(getProfileStyleTokens("silk").name, "Silk Pattern");
    assert.equal(getProfileStyleTokens("industrial").name, "Industrial Metal");
    assert.equal(getProfileStyleTokens("coffee_house").name, "Coffee Paper");
    assert.equal(getProfileStyleTokens("rustic_bbq").name, "Rustic Wood");
    assert.equal(getProfileStyleTokens("soft_pastel").name, "Soft Pastels");
    for (const key of PROFILE_STYLE_KEYS) {
      assert.equal(getProfileStyleTokens(key).name, EXPECTED_NAMES[key], key);
    }
  });

  it("buildProfileStyleRootStyle sets CSS variables", () => {
    const style = buildProfileStyleRootStyle("vineyard");
    assert.ok(style["--profile-page-background"]);
    assert.ok(style["--profile-accent"]);
    assert.ok(style["--profile-button-background"]);
    assert.ok(style["--profile-hero-from"]);
    assert.ok(style["--profile-hero-via"]);
    assert.ok(style["--profile-hero-to"]);
    assert.equal(typeof style.backgroundImage, "string");
    assert.notEqual(style["--profile-page-background"], "#fafaf9");
  });

  it("every style has a unique page background", () => {
    const backgrounds = PROFILE_STYLE_KEYS.map(
      (k) => restaurantProfileStyles[k].pageBackground
    );
    assert.equal(new Set(backgrounds).size, PROFILE_STYLE_KEYS.length);
  });

  it("every style has a unique background pattern string", () => {
    const patterns = PROFILE_STYLE_KEYS.map(
      (k) => restaurantProfileStyles[k].backgroundPattern
    );
    assert.equal(new Set(patterns).size, PROFILE_STYLE_KEYS.length);
  });

  it("signature themes are visually distinct from each other", () => {
    const coastal = getProfileStyleTokens("coastal").pageBackground;
    const leather = getProfileStyleTokens("sports_bar").pageBackground;
    const tile = getProfileStyleTokens("tile").pageBackground;
    const brick = getProfileStyleTokens("brick_oven").pageBackground;
    const silk = getProfileStyleTokens("silk").pageBackground;
    const modern = getProfileStyleTokens("modern_minimal").pageBackground;
    assert.notEqual(coastal, leather);
    assert.notEqual(coastal, modern);
    assert.notEqual(tile, brick);
    assert.notEqual(silk, tile);
    assert.match(coastal, /^#[0-9a-fA-F]{6}$/);
    assert.ok(coastal.toLowerCase() !== "#eef6f8", "coastal should use strengthened token");
    assert.ok(leather.toLowerCase() !== modern.toLowerCase());
  });
});

describe("restaurant profile style recommendation", () => {
  it("maps categories and falls back", () => {
    assert.equal(getRecommendedProfileStyle("wine_bar", null), "vineyard");
    assert.equal(getRecommendedProfileStyle("unknown_xyz", null), DEFAULT_PROFILE_STYLE_KEY);
    assert.equal(getRecommendedProfileStyle("restaurant", "italian"), "tuscan_stone");
  });

  it("null manual uses recommendation; manual overrides; clear restores", () => {
    assert.equal(
      resolveEffectiveProfileStyle({
        profile_style_key: null,
        category: "bakery",
      }),
      "parchment"
    );
    assert.equal(
      resolveEffectiveProfileStyle({
        profile_style_key: "industrial",
        category: "bakery",
      }),
      "industrial"
    );
    assert.equal(
      resolveEffectiveProfileStyle({
        profile_style_key: null,
        category: "bakery",
      }),
      "parchment"
    );
  });
});

describe("operator + public profile style wiring", () => {
  it("OperatorProfileEditor mounts Restaurant Style selector", () => {
    const page = readFileSync(
      join(root, "src/pages/operator/OperatorProfileEditor.jsx"),
      "utf8"
    );
    assert.match(page, /RestaurantStyleSelector/);
    assert.match(page, /Restaurant Style/);
    assert.match(page, /profile_style_key/);
  });

  it("PublicProfileShell applies data-profile-style and CSS vars on homepage layout", () => {
    const shell = readFileSync(
      join(root, "src/components/restaurant/publicProfile/PublicProfileShell.jsx"),
      "utf8"
    );
    const hero = readFileSync(
      join(root, "src/components/restaurant/publicProfile/ProfileHero.jsx"),
      "utf8"
    );
    assert.match(shell, /data-profile-style/);
    assert.match(shell, /buildProfileStyleRootStyle/);
    assert.match(shell, /ProfileFavoriteMenuItems/);
    assert.match(shell, /ProfileAboutFounded/);
    assert.doesNotMatch(shell, /Football|fish illustration|mexican flag/i);
    assert.match(hero, /--profile-hero-from/);
    assert.match(hero, /profile-hero-placeholder/);
  });

  it("ProfileSection text sits on a solid card so patterned styles stay readable", () => {
    const primitives = readFileSync(
      join(root, "src/components/restaurant/publicProfile/profilePrimitives.jsx"),
      "utf8"
    );
    assert.match(primitives, /function ProfileSection/);
    assert.match(primitives, /data-profile-surface="card"/);
    assert.match(primitives, /background:\s*"#fff"/);
    assert.match(primitives, /profileCardBorderVar/);
  });

  it("RestaurantStyleSelector has Use Recommended + preview cards emphasizing pattern body", () => {
    const sel = readFileSync(
      join(root, "src/components/operator/RestaurantStyleSelector.jsx"),
      "utf8"
    );
    assert.match(sel, /Use Recommended Style/);
    assert.match(sel, /profile-style-live-preview/);
    assert.match(sel, /profile-style-card-/);
    assert.match(sel, /applyMode/);
    assert.match(sel, /height:\s*78/);
    assert.match(sel, /backgroundPattern/);
  });
});
