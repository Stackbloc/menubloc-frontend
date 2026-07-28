/**
 * Restaurant Style design tokens for public profile atmosphere.
 * Keys must stay in sync with menubloc-backend/src/lib/restaurantProfileStyles.js
 */

export const DEFAULT_PROFILE_STYLE_KEY = "modern_minimal";

/** Subtle stationary SVG grid pattern (data URI). */
function gridPattern(stroke = "%23a8a29e", opacity = 0.12) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M24 0H0v24" fill="none" stroke="${decodeURIComponent(stroke)}" stroke-opacity="${opacity}" stroke-width="0.5"/></svg>`
  );
  return `url("data:image/svg+xml,${svg}")`;
}

function dotsPattern(fill = "%23a8a29e", opacity = 0.14) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="2" cy="2" r="1" fill="${decodeURIComponent(fill)}" fill-opacity="${opacity}"/></svg>`
  );
  return `url("data:image/svg+xml,${svg}")`;
}

function diagonalPattern(stroke = "%23a8a29e", opacity = 0.1) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M-2 22L22-2" stroke="${decodeURIComponent(stroke)}" stroke-opacity="${opacity}" stroke-width="0.6"/></svg>`
  );
  return `url("data:image/svg+xml,${svg}")`;
}

function linenPattern(stroke = "%23a8a29e", opacity = 0.08) {
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M0 4h8M4 0v8" stroke="${decodeURIComponent(stroke)}" stroke-opacity="${opacity}" stroke-width="0.4"/></svg>`
  );
  return `url("data:image/svg+xml,${svg}")`;
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
    pageBackground: "#fafaf9",
    backgroundPattern: gridPattern("%23d6d3d1", 0.35),
    accent: "#166534",
    sectionLabel: "#166534",
    cardBorder: "#e7e5e4",
    cardShadow: "0 1px 2px rgba(28,25,23,0.04)",
    buttonBackground: "#166534",
    buttonText: "#ffffff",
  },
  fine_dining: {
    name: "Marble & Linen",
    pageBackground: "#f5f4f1",
    backgroundPattern: linenPattern("%23a8a29e", 0.12),
    accent: "#3f3a36",
    sectionLabel: "#57534e",
    cardBorder: "#e7e5e4",
    cardShadow: "0 1px 3px rgba(28,25,23,0.05)",
    buttonBackground: "#3f3a36",
    buttonText: "#fafaf9",
  },
  sports_bar: {
    name: "Stadium & Slate",
    pageBackground: "#eef1f4",
    backgroundPattern: diagonalPattern("%23475569", 0.12),
    accent: "#1e3a5f",
    sectionLabel: "#334155",
    cardBorder: "#d0d7e2",
    cardShadow: "0 1px 3px rgba(15,23,42,0.06)",
    buttonBackground: "#1e3a5f",
    buttonText: "#f8fafc",
  },
  neighborhood_pub: {
    name: "Neighborhood Pub",
    pageBackground: "#f3efe8",
    backgroundPattern: gridPattern("%2378715c", 0.18),
    accent: "#5c4033",
    sectionLabel: "#6b5344",
    cardBorder: "#e4dcd0",
    cardShadow: "0 1px 3px rgba(60,40,20,0.05)",
    buttonBackground: "#5c4033",
    buttonText: "#faf7f2",
  },
  wood_and_steel: {
    name: "Wood & Steel",
    pageBackground: "#f2efe9",
    backgroundPattern: diagonalPattern("%2378715c", 0.14),
    accent: "#44403c",
    sectionLabel: "#57534e",
    cardBorder: "#ddd6cb",
    cardShadow: "0 1px 3px rgba(28,25,23,0.05)",
    buttonBackground: "#44403c",
    buttonText: "#fafaf9",
  },
  rustic_bbq: {
    name: "Rustic BBQ",
    pageBackground: "#f4ebe3",
    backgroundPattern: dotsPattern("%239a3412", 0.1),
    accent: "#9a3412",
    sectionLabel: "#7c2d12",
    cardBorder: "#e7d5c4",
    cardShadow: "0 1px 3px rgba(120,53,15,0.06)",
    buttonBackground: "#9a3412",
    buttonText: "#fff7ed",
  },
  coastal: {
    name: "Coastal",
    pageBackground: "#eef6f8",
    backgroundPattern: gridPattern("%230e7490", 0.12),
    accent: "#0e7490",
    sectionLabel: "#155e75",
    cardBorder: "#cfe8ef",
    cardShadow: "0 1px 3px rgba(8,47,73,0.05)",
    buttonBackground: "#0e7490",
    buttonText: "#ecfeff",
  },
  tuscan_stone: {
    name: "Tuscan Stone",
    pageBackground: "#f6f0e8",
    backgroundPattern: linenPattern("%23a16207", 0.1),
    accent: "#92400e",
    sectionLabel: "#78350f",
    cardBorder: "#e8dcc8",
    cardShadow: "0 1px 3px rgba(120,53,15,0.05)",
    buttonBackground: "#92400e",
    buttonText: "#fffbeb",
  },
  tile: {
    name: "Artisan Tile",
    pageBackground: "#f7f3ee",
    backgroundPattern: gridPattern("%23b45309", 0.16),
    accent: "#b45309",
    sectionLabel: "#92400e",
    cardBorder: "#eadfce",
    cardShadow: "0 1px 3px rgba(120,53,15,0.05)",
    buttonBackground: "#b45309",
    buttonText: "#fffbeb",
  },
  minimal_bamboo: {
    name: "Minimal Bamboo",
    pageBackground: "#f4f6f1",
    backgroundPattern: diagonalPattern("%234d7c0f", 0.1),
    accent: "#3f6212",
    sectionLabel: "#3f6212",
    cardBorder: "#dce5d4",
    cardShadow: "0 1px 2px rgba(20,40,10,0.04)",
    buttonBackground: "#3f6212",
    buttonText: "#f7fee7",
  },
  silk: {
    name: "Silk",
    pageBackground: "#f8f2f2",
    backgroundPattern: linenPattern("%239f1239", 0.08),
    accent: "#9f1239",
    sectionLabel: "#881337",
    cardBorder: "#ecdada",
    cardShadow: "0 1px 3px rgba(80,10,30,0.05)",
    buttonBackground: "#9f1239",
    buttonText: "#fff1f2",
  },
  warm_textile: {
    name: "Warm Textile",
    pageBackground: "#f8f1ea",
    backgroundPattern: dotsPattern("%23c2410c", 0.12),
    accent: "#c2410c",
    sectionLabel: "#9a3412",
    cardBorder: "#ebd8c6",
    cardShadow: "0 1px 3px rgba(120,53,15,0.05)",
    buttonBackground: "#c2410c",
    buttonText: "#fff7ed",
  },
  white_stone: {
    name: "White Stone",
    pageBackground: "#f7f7f5",
    backgroundPattern: gridPattern("%23a8a29e", 0.2),
    accent: "#57534e",
    sectionLabel: "#57534e",
    cardBorder: "#e7e5e4",
    cardShadow: "0 1px 2px rgba(28,25,23,0.04)",
    buttonBackground: "#57534e",
    buttonText: "#fafaf9",
  },
  coffee_house: {
    name: "Coffee House",
    pageBackground: "#f3eee8",
    backgroundPattern: dotsPattern("%23784421", 0.12),
    accent: "#784221",
    sectionLabel: "#6b3a1c",
    cardBorder: "#e4d8cc",
    cardShadow: "0 1px 3px rgba(60,30,10,0.05)",
    buttonBackground: "#784221",
    buttonText: "#faf6f1",
  },
  parchment: {
    name: "Parchment",
    pageBackground: "#f7f3e9",
    backgroundPattern: linenPattern("%23a16207", 0.1),
    accent: "#a16207",
    sectionLabel: "#854d0e",
    cardBorder: "#ebe1cd",
    cardShadow: "0 1px 2px rgba(80,50,10,0.04)",
    buttonBackground: "#a16207",
    buttonText: "#fefce8",
  },
  brick_oven: {
    name: "Brick Oven",
    pageBackground: "#f6efea",
    backgroundPattern: diagonalPattern("%239a3412", 0.12),
    accent: "#9a3412",
    sectionLabel: "#7c2d12",
    cardBorder: "#e8d5c8",
    cardShadow: "0 1px 3px rgba(120,53,15,0.05)",
    buttonBackground: "#9a3412",
    buttonText: "#fff7ed",
  },
  industrial: {
    name: "Industrial",
    pageBackground: "#eef0f2",
    backgroundPattern: gridPattern("%23475569", 0.18),
    accent: "#334155",
    sectionLabel: "#475569",
    cardBorder: "#d2d8e0",
    cardShadow: "0 1px 3px rgba(15,23,42,0.06)",
    buttonBackground: "#334155",
    buttonText: "#f8fafc",
  },
  copper_and_oak: {
    name: "Copper & Oak",
    pageBackground: "#f4efe8",
    backgroundPattern: dotsPattern("%23b45309", 0.12),
    accent: "#b45309",
    sectionLabel: "#92400e",
    cardBorder: "#e6d9c8",
    cardShadow: "0 1px 3px rgba(120,53,15,0.05)",
    buttonBackground: "#b45309",
    buttonText: "#fffbeb",
  },
  vineyard: {
    name: "Vineyard",
    pageBackground: "#f4f1f5",
    backgroundPattern: linenPattern("%236b21a8", 0.08),
    accent: "#6b21a8",
    sectionLabel: "#581c87",
    cardBorder: "#e4dceb",
    cardShadow: "0 1px 3px rgba(60,20,80,0.05)",
    buttonBackground: "#6b21a8",
    buttonText: "#faf5ff",
  },
  soft_pastel: {
    name: "Soft Pastel",
    pageBackground: "#faf5f7",
    backgroundPattern: dotsPattern("%23db2777", 0.1),
    accent: "#be185d",
    sectionLabel: "#9d174d",
    cardBorder: "#f0dce6",
    cardShadow: "0 1px 2px rgba(80,20,50,0.04)",
    buttonBackground: "#be185d",
    buttonText: "#fdf2f8",
  },
  sunrise: {
    name: "Sunrise",
    pageBackground: "#fff8f0",
    backgroundPattern: diagonalPattern("%23ea580c", 0.1),
    accent: "#ea580c",
    sectionLabel: "#c2410c",
    cardBorder: "#f3dfc8",
    cardShadow: "0 1px 3px rgba(154,52,18,0.05)",
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
