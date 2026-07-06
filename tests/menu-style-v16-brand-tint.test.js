import test from "node:test";
import assert from "node:assert/strict";
import {
  BRAND_TINT_DEFAULT_SHELL_BACKGROUND,
  resolveMenuPageBackground,
} from "../src/components/menu-templates/menuThemeSettings.js";
import { normalizeMenuStyle, resolveTemplateMenuStyle } from "../src/components/menu-templates/menuPresentationUtils.js";

test("v16 Brand Tint normalizes and renders Classic layout", () => {
  assert.equal(normalizeMenuStyle("brand-tint"), "v16");
  assert.equal(resolveTemplateMenuStyle("v16"), "v1");
});

test("v16 shell background uses operator color with default fallback", () => {
  assert.equal(
    resolveMenuPageBackground({ menu_style: "v16", shell_background_color: "#FFEECC" }),
    "#FFEECC",
  );
  assert.equal(
    resolveMenuPageBackground({ menu_style: "v16" }),
    BRAND_TINT_DEFAULT_SHELL_BACKGROUND,
  );
});
