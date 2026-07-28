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
  getProfileStyleTokens,
  buildProfileStyleRootStyle,
  isValidProfileStyleKey,
} from "../src/lib/restaurantProfileStyles.js";
import {
  getRecommendedProfileStyle,
  resolveEffectiveProfileStyle,
} from "../src/lib/restaurantProfileStyleRecommendation.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("restaurant profile styles registry", () => {
  it("has 21 styles including Modern Minimal", () => {
    assert.equal(PROFILE_STYLE_KEYS.length, 21);
    assert.ok(isValidProfileStyleKey("modern_minimal"));
    assert.equal(getProfileStyleTokens("coastal").name, "Coastal");
  });

  it("buildProfileStyleRootStyle sets CSS variables", () => {
    const style = buildProfileStyleRootStyle("vineyard");
    assert.ok(style["--profile-page-background"]);
    assert.ok(style["--profile-accent"]);
    assert.ok(style["--profile-button-background"]);
    assert.equal(typeof style.backgroundImage, "string");
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

  it("PublicProfileShell applies data-profile-style and CSS vars without removing glance/menu", () => {
    const shell = readFileSync(
      join(root, "src/components/restaurant/publicProfile/PublicProfileShell.jsx"),
      "utf8"
    );
    assert.match(shell, /data-profile-style/);
    assert.match(shell, /buildProfileStyleRootStyle/);
    assert.match(shell, /ProfileAtAGlance/);
    assert.match(shell, /ProfileMenuHighlights/);
    assert.doesNotMatch(shell, /Football|fish illustration|mexican flag/i);
  });

  it("RestaurantStyleSelector has Use Recommended + preview cards", () => {
    const sel = readFileSync(
      join(root, "src/components/operator/RestaurantStyleSelector.jsx"),
      "utf8"
    );
    assert.match(sel, /Use Recommended Style/);
    assert.match(sel, /profile-style-live-preview/);
    assert.match(sel, /profile-style-card-/);
  });
});
