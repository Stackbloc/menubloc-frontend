/**
 * Restaurant Style design tokens for public profile atmosphere.
 * Keys must stay in sync with menubloc-backend/src/lib/restaurantProfileStyles.js
 *
 * Visibility note (2026-07-28): page backgrounds and patterns are intentionally
 * distinct from one another; placeholder hero tints from accent via CSS vars.
 */

export const DEFAULT_PROFILE_STYLE_KEY = "modern_minimal";

/** Stationary SVG grid pattern (data URI). */
function gridPattern(stroke = "%23a8a29e", opacity = 0.28) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 0H0v24" fill="none" stroke="${decodeURIComponent(stroke)}" stroke-opacity="${opacity}" stroke-width="0.75"/></svg>`
  );
  return `url("data:image/svg+xml,${svg}")`;
}

function dotsPattern(fill = "%23a8a29e", opacity = 0.28) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="2" cy="2" r="1.25" fill="${decodeURIComponent(fill)}" fill-opacity="${opacity}"/></svg>`
  );
  return `url("data:image/svg+xml,${svg}")`;
}

function diagonalPattern(stroke = "%23a8a29e", opacity = 0.22) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M-2 22L22-2" stroke="${decodeURIComponent(stroke)}" stroke-opacity="${opacity}" stroke-width="0.85"/></svg>`
  );
  return `url("data:image/svg+xml,${svg}")`;
}

function linenPattern(stroke = "%23a8a29e", opacity = 0.2) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M0 4h8M4 0v8" stroke="${decodeURIComponent(stroke)}" stroke-opacity="${opacity}" stroke-width="0.55"/></svg>`
  );
  return `url("data:image/svg+xml,${svg}")`;
}

function parseHex(hex) {
  const h = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return { r: 22, g: 101, b: 52 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function toHex({ r, g, b }) {
  return (
    "#" +
    [r, g, b]
      .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function mixRgb(a, b, t) {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

/** Dark hero stops derived from style accent (placeholder banner when no photo). */
export function buildHeroCssVarsFromAccent(accent) {
  const c = parseHex(accent);
  const black = { r: 28, g: 25, b: 23 };
  return {
    "--profile-hero-from": toHex(mixRgb(c, black, 0.68)),
    "--profile-hero-via": toHex(mixRgb(c, black, 0.38)),
    "--profile-hero-to": toHex(mixRgb(c, black, 0.78)),
  };
}

/**
 * @typedef {object} RestaurantProfileStyleTokens
 * @property {string} name
 * @property {string} pageBackground
 * @property {string} backgroundPattern
 * @property {string} accent
 * @property {string} sectionLabel
 * @property {string} cardBorder
 * @property {string} cardShadow
 * @property {string} buttonBackground
 * @property {string} buttonText
 */

/** @type {Record<string, RestaurantProfileStyleTokens>} */
export const restaurantProfileStyles = {
  modern_minimal: {
    name: "Modern Minimal",
    pageBackground: "#f4f4f2",
    backgroundPattern: gridPattern("%23a8a29e", 0.4),
    accent: "#166534",
    sectionLabel: "#166534",
    cardBorder: "#e7e5e4",
    cardShadow: "0 1px 2px rgba(28,25,23,0.04)",
    buttonBackground: "#166534",
    buttonText: "#ffffff",
  },
  fine_dining: {
    name: "Marble & Linen",
    pageBackground: "#ebe6dc",
    backgroundPattern: linenPattern("%2378715c", 0.28),
    accent: "#3f3a36",
    sectionLabel: "#57534e",
    cardBorder: "#ddd6cb",
    cardShadow: "0 1px 3px rgba(28,25,23,0.05)",
    buttonBackground: "#3f3a36",
    buttonText: "#fafaf9",
  },
  sports_bar: {
    name: "Stadium & Slate",
    pageBackground: "#d8e0ea",
    backgroundPattern: diagonalPattern("%23334155", 0.28),
    accent: "#1e3a5f",
    sectionLabel: "#334155",
    cardBorder: "#b8c5d6",
    cardShadow: "0 1px 3px rgba(15,23,42,0.08)",
    buttonBackground: "#1e3a5f",
    buttonText: "#f8fafc",
  },
  neighborhood_pub: {
    name: "Neighborhood Pub",
    pageBackground: "#e8dcc8",
    backgroundPattern: gridPattern("%235c4033", 0.32),
    accent: "#5c4033",
    sectionLabel: "#6b5344",
    cardBorder: "#d4c4ae",
    cardShadow: "0 1px 3px rgba(60,40,20,0.07)",
    buttonBackground: "#5c4033",
    buttonText: "#faf7f2",
  },
  wood_and_steel: {
    name: "Wood & Steel",
    pageBackground: "#e4dccf",
    backgroundPattern: diagonalPattern("%2344403c", 0.26),
    accent: "#44403c",
    sectionLabel: "#57534e",
    cardBorder: "#cdc3b4",
    cardShadow: "0 1px 3px rgba(28,25,23,0.06)",
    buttonBackground: "#44403c",
    buttonText: "#fafaf9",
  },
  rustic_bbq: {
    name: "Rustic BBQ",
    pageBackground: "#e8d0bc",
    backgroundPattern: dotsPattern("%239a3412", 0.26),
    accent: "#9a3412",
    sectionLabel: "#7c2d12",
    cardBorder: "#d4b496",
    cardShadow: "0 1px 3px rgba(120,53,15,0.08)",
    buttonBackground: "#9a3412",
    buttonText: "#fff7ed",
  },
  coastal: {
    name: "Coastal",
    pageBackground: "#cfeaf1",
    backgroundPattern: gridPattern("%230e7490", 0.32),
    accent: "#0e7490",
    sectionLabel: "#155e75",
    cardBorder: "#9fd4e0",
    cardShadow: "0 1px 3px rgba(8,47,73,0.08)",
    buttonBackground: "#0e7490",
    buttonText: "#ecfeff",
  },
  tuscan_stone: {
    name: "Tuscan Stone",
    pageBackground: "#ead9c2",
    backgroundPattern: linenPattern("%2392400e", 0.26),
    accent: "#92400e",
    sectionLabel: "#78350f",
    cardBorder: "#d4c0a0",
    cardShadow: "0 1px 3px rgba(120,53,15,0.07)",
    buttonBackground: "#92400e",
    buttonText: "#fffbeb",
  },
  tile: {
    name: "Artisan Tile",
    pageBackground: "#eadcc8",
    backgroundPattern: gridPattern("%23b45309", 0.34),
    accent: "#b45309",
    sectionLabel: "#92400e",
    cardBorder: "#d6c2a4",
    cardShadow: "0 1px 3px rgba(120,53,15,0.07)",
    buttonBackground: "#b45309",
    buttonText: "#fffbeb",
  },
  minimal_bamboo: {
    name: "Minimal Bamboo",
    pageBackground: "#dde8d2",
    backgroundPattern: diagonalPattern("%233f6212", 0.26),
    accent: "#3f6212",
    sectionLabel: "#3f6212",
    cardBorder: "#c0d0b0",
    cardShadow: "0 1px 2px rgba(20,40,10,0.06)",
    buttonBackground: "#3f6212",
    buttonText: "#f7fee7",
  },
  silk: {
    name: "Silk",
    pageBackground: "#f0dce0",
    backgroundPattern: linenPattern("%239f1239", 0.24),
    accent: "#9f1239",
    sectionLabel: "#881337",
    cardBorder: "#ddb8c0",
    cardShadow: "0 1px 3px rgba(80,10,30,0.07)",
    buttonBackground: "#9f1239",
    buttonText: "#fff1f2",
  },
  warm_textile: {
    name: "Warm Textile",
    pageBackground: "#f0d8c4",
    backgroundPattern: dotsPattern("%23c2410c", 0.28),
    accent: "#c2410c",
    sectionLabel: "#9a3412",
    cardBorder: "#dcb896",
    cardShadow: "0 1px 3px rgba(120,53,15,0.07)",
    buttonBackground: "#c2410c",
    buttonText: "#fff7ed",
  },
  white_stone: {
    name: "White Stone",
    pageBackground: "#e8e6e1",
    backgroundPattern: gridPattern("%2378715c", 0.34),
    accent: "#57534e",
    sectionLabel: "#57534e",
    cardBorder: "#d6d3d1",
    cardShadow: "0 1px 2px rgba(28,25,23,0.05)",
    buttonBackground: "#57534e",
    buttonText: "#fafaf9",
  },
  coffee_house: {
    name: "Coffee House",
    pageBackground: "#e2d4c4",
    backgroundPattern: dotsPattern("%23784421", 0.28),
    accent: "#784221",
    sectionLabel: "#6b3a1c",
    cardBorder: "#cbb6a0",
    cardShadow: "0 1px 3px rgba(60,30,10,0.07)",
    buttonBackground: "#784221",
    buttonText: "#faf6f1",
  },
  parchment: {
    name: "Parchment",
    pageBackground: "#eee2c8",
    backgroundPattern: linenPattern("%23a16207", 0.26),
    accent: "#a16207",
    sectionLabel: "#854d0e",
    cardBorder: "#d8c8a4",
    cardShadow: "0 1px 2px rgba(80,50,10,0.06)",
    buttonBackground: "#a16207",
    buttonText: "#fefce8",
  },
  brick_oven: {
    name: "Brick Oven",
    pageBackground: "#ead4c4",
    backgroundPattern: diagonalPattern("%239a3412", 0.28),
    accent: "#9a3412",
    sectionLabel: "#7c2d12",
    cardBorder: "#d4b49c",
    cardShadow: "0 1px 3px rgba(120,53,15,0.07)",
    buttonBackground: "#9a3412",
    buttonText: "#fff7ed",
  },
  industrial: {
    name: "Industrial",
    pageBackground: "#d2d8e0",
    backgroundPattern: gridPattern("%23334155", 0.36),
    accent: "#334155",
    sectionLabel: "#475569",
    cardBorder: "#aeb8c6",
    cardShadow: "0 1px 3px rgba(15,23,42,0.08)",
    buttonBackground: "#334155",
    buttonText: "#f8fafc",
  },
  copper_and_oak: {
    name: "Copper & Oak",
    pageBackground: "#e8d6bc",
    backgroundPattern: dotsPattern("%23b45309", 0.28),
    accent: "#b45309",
    sectionLabel: "#92400e",
    cardBorder: "#d0b894",
    cardShadow: "0 1px 3px rgba(120,53,15,0.07)",
    buttonBackground: "#b45309",
    buttonText: "#fffbeb",
  },
  vineyard: {
    name: "Vineyard",
    pageBackground: "#e4d8ec",
    backgroundPattern: linenPattern("%236b21a8", 0.24),
    accent: "#6b21a8",
    sectionLabel: "#581c87",
    cardBorder: "#c8b4d8",
    cardShadow: "0 1px 3px rgba(60,20,80,0.07)",
    buttonBackground: "#6b21a8",
    buttonText: "#faf5ff",
  },
  soft_pastel: {
    name: "Soft Pastel",
    pageBackground: "#f5dce8",
    backgroundPattern: dotsPattern("%23db2777", 0.26),
    accent: "#be185d",
    sectionLabel: "#9d174d",
    cardBorder: "#e4b8cc",
    cardShadow: "0 1px 2px rgba(80,20,50,0.06)",
    buttonBackground: "#be185d",
    buttonText: "#fdf2f8",
  },
  sunrise: {
    name: "Sunrise",
    pageBackground: "#ffe0c0",
    backgroundPattern: diagonalPattern("%23ea580c", 0.28),
    accent: "#ea580c",
    sectionLabel: "#c2410c",
    cardBorder: "#f0c090",
    cardShadow: "0 1px 3px rgba(154,52,18,0.08)",
    buttonBackground: "#ea580c",
    buttonText: "#fff7ed",
  },
};

export const PROFILE_STYLE_KEYS = Object.freeze(Object.keys(restaurantProfileStyles));

export function isValidProfileStyleKey(key) {
  if (key == null) return false;
  return Object.prototype.hasOwnProperty.call(restaurantProfileStyles, String(key).trim());
}

export function getProfileStyleTokens(key) {
  if (isValidProfileStyleKey(key)) {
    return restaurantProfileStyles[String(key).trim()];
  }
  return restaurantProfileStyles[DEFAULT_PROFILE_STYLE_KEY];
}

/** CSS custom properties for a public-profile root element. */
export function profileStyleToCssVars(tokens) {
  const t = tokens || restaurantProfileStyles[DEFAULT_PROFILE_STYLE_KEY];
  return {
    "--profile-page-background": t.pageBackground,
    "--profile-pattern": t.backgroundPattern,
    "--profile-accent": t.accent,
    "--profile-section-label": t.sectionLabel,
    "--profile-card-border": t.cardBorder,
    "--profile-card-shadow": t.cardShadow,
    "--profile-button-background": t.buttonBackground,
    "--profile-button-text": t.buttonText,
    ...buildHeroCssVarsFromAccent(t.accent),
  };
}

export function buildProfileStyleRootStyle(styleKey) {
  const tokens = getProfileStyleTokens(styleKey);
  const vars = profileStyleToCssVars(tokens);
  return {
    ...vars,
    backgroundColor: tokens.pageBackground,
    backgroundImage: tokens.backgroundPattern,
    backgroundRepeat: "repeat",
    backgroundAttachment: "scroll",
  };
}
