/**
 * Brand colors for national-chain menus, matching the brand profile page
 * (see brandProfileThemes.js — same palette, same name match).
 *
 * Display-only: never saved and never offered in the owner menu-look picker.
 * An owner-chosen menu appearance or wallpaper always wins. The menu surface
 * stays white with dark text so items read the same as every other menu;
 * brand color goes on the page, section titles, active tab, accent and a thin
 * stripe that echoes the profile hero.
 */

import { findBrandProfileTheme } from "./brandProfileThemes.js";
import { MENU_APPEARANCE_READABILITY, contrastRatio, menuAppearanceToCssVars } from "./menuAppearances.js";

const MENU_SURFACE = "#ffffff";

function mixHex(hex, targetHex, amount) {
  const parse = (h) => {
    const s = String(h || "").replace("#", "");
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
  };
  const a = parse(hex);
  const b = parse(targetHex);
  if (a.some(Number.isNaN) || b.some(Number.isNaN)) return hex;
  return `#${a
    .map((c, i) => Math.round(c + (b[i] - c) * amount).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Darken a brand color just enough for small text on white (WCAG AA 4.5:1). */
export function readableOnWhite(hex) {
  let out = hex;
  for (let step = 0; step < 10 && contrastRatio(out, MENU_SURFACE) < 4.5; step += 1) {
    out = mixHex(hex, "#000000", (step + 1) * 0.08);
  }
  return out;
}

/** Menu appearance tokens (same shape as menuAppearances.js) for a brand theme. */
export function brandMenuTokens(theme) {
  const text = readableOnWhite(theme.accent);
  return {
    name: theme.name,
    pageBackground: theme.pageBackground,
    backgroundPattern: theme.backgroundPattern,
    menuSurface: MENU_SURFACE,
    accent: text,
    divider: theme.cardBorder,
    sectionHeader: text,
    border: theme.cardBorder,
    shadow: theme.cardShadow,
    ...MENU_APPEARANCE_READABILITY,
    tabActive: text,
    heroStripe: Array.isArray(theme.hero) && theme.hero.length
      ? `linear-gradient(90deg, ${theme.hero.join(", ")})`
      : text,
  };
}

/** True when the owner picked a menu look; brand colors never override it. */
function hasOwnerMenuChrome(payload) {
  return (
    String(payload?.menu_appearance_key || "").trim() !== "" ||
    String(payload?.menu_wallpaper_key || "").trim() !== ""
  );
}

/**
 * Brand menu theme for a public menu payload, or null.
 * @returns {{ name: string, tokens: ReturnType<typeof brandMenuTokens> } | null}
 */
export function resolveBrandMenuTheme(payload, restaurantName = "") {
  if (!payload || hasOwnerMenuChrome(payload)) return null;
  const theme =
    findBrandProfileTheme(payload.brand_profile?.name) ||
    findBrandProfileTheme(payload.restaurant_name) ||
    findBrandProfileTheme(payload.name) ||
    findBrandProfileTheme(restaurantName);
  if (!theme) return null;
  return { name: theme.name, tokens: brandMenuTokens(theme) };
}

/** Root style for the menu page/pane — mirrors buildMenuAppearanceRootStyle. */
export function buildBrandMenuRootStyle(tokens) {
  return {
    ...menuAppearanceToCssVars(tokens),
    "--menu-tab-active": tokens.tabActive,
    backgroundColor: tokens.pageBackground,
    backgroundImage: tokens.backgroundPattern,
    backgroundRepeat: "repeat",
    backgroundAttachment: "scroll",
    color: tokens.onPage,
  };
}
