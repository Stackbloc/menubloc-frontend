/**
 * Restaurant Style (Menuply Smart Themes) design tokens for public profile atmosphere.
 * Keys must stay in sync with menubloc-backend/src/lib/restaurantProfileStyles.js
 *
 * Each theme uses a unique SVG motif + distinct hue family so selector cards
 * and public page bodies are visually distinguishable (not color-only chips).
 */

export const DEFAULT_PROFILE_STYLE_KEY = "modern_minimal";

function svgDataUri(svgMarkup) {
  return `url("data:image/svg+xml,${encodeURIComponent(svgMarkup)}")`;
}

/** Fine orthogonal grid */
function patternGrid(stroke = "#a8a29e", opacity = 0.45, size = 20) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><path d="M${size} 0H0v${size}" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.9"/></svg>`
  );
}

/** Soft marble-like veining */
function patternMarble(stroke = "#78716c", opacity = 0.35) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M0 28c8-6 14-2 20 2s14 8 28-4" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.2"/><path d="M-4 12c12 4 18-2 28 2s16 6 28-2" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.75}" stroke-width="0.9"/><path d="M0 40c10 2 16-6 24-2s14 6 24 0" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.55}" stroke-width="0.8"/></svg>`
  );
}

/** Leather grain — irregular short strokes */
function patternLeather(stroke = "#1c1917", opacity = 0.4) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1" stroke-linecap="round"><path d="M3 5c2 1 3-1 5 0M12 4c2 .8 3-1 5 .2M20 7c1.5.6 2.5-.8 4 .1"/><path d="M2 14c2 .7 3.2-1 5.2.1M11 13c2.2.9 3.5-1.2 5.5.2M19 15c1.8.5 3-.9 4.5.2"/><path d="M4 22c1.8.7 3-1 5 .1M13 21c2 .8 3.2-1.1 5.2.2M21 23c1.6.5 2.8-.7 4 .2"/></g></svg>`
  );
}

/** Vertical wood panel lines */
function patternWoodPanels(stroke = "#5c4033", opacity = 0.42) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24" viewBox="0 0 32 24"><path d="M8 0v24M16 0v24M24 0v24" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.4"/><path d="M0 6h32M0 12h32M0 18h32" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.35}" stroke-width="0.6"/></svg>`
  );
}

/** Horizontal wood grain + steel hatch */
function patternWoodSteel(wood = "#57534e", steel = "#64748b", opacity = 0.4) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24"><path d="M0 5h36M0 12h36M0 19h36" fill="none" stroke="${wood}" stroke-opacity="${opacity}" stroke-width="1.1"/><path d="M0 24L12 0M12 24L24 0M24 24L36 0" fill="none" stroke="${steel}" stroke-opacity="${opacity * 0.55}" stroke-width="0.7"/></svg>`
  );
}

/** Coarse rustic plank + speck */
function patternRusticPlank(stroke = "#7c2d12", opacity = 0.45) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><path d="M0 0h40v20H0z" fill="none"/><path d="M0 4h40M0 10h40M0 16h40" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.6"/><circle cx="8" cy="7" r="1.1" fill="${stroke}" fill-opacity="${opacity * 0.7}"/><circle cx="22" cy="13" r="0.9" fill="${stroke}" fill-opacity="${opacity * 0.6}"/><circle cx="33" cy="6" r="1" fill="${stroke}" fill-opacity="${opacity * 0.65}"/></svg>`
  );
}

/** Soft water waves */
function patternWaves(stroke = "#0e7490", opacity = 0.42) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><path d="M0 6c5 4 10 4 15 0s10-4 15 0 10 4 15 0" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.3"/><path d="M0 14c5 4 10 4 15 0s10-4 15 0 10 4 15 0" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.7}" stroke-width="1.1"/></svg>`
  );
}

/** Stone / masonry blocks */
function patternStoneBlocks(stroke = "#92400e", opacity = 0.4) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24"><path d="M0 12h36M18 0v12M9 12v12M27 12v12" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.2"/><path d="M0 0h36v24H0z" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.5}" stroke-width="0.8"/></svg>`
  );
}

/** Talavera-like multi-cell tile with accent fills */
function patternTalavera(outline = "#9a3412", teal = "#0f766e", cream = "#fef3c7", opacity = 0.55) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" fill="none"/><rect x="1" y="1" width="14" height="14" fill="${cream}" fill-opacity="0.35" stroke="${outline}" stroke-opacity="${opacity}" stroke-width="1.2"/><rect x="17" y="1" width="14" height="14" fill="${teal}" fill-opacity="0.22" stroke="${outline}" stroke-opacity="${opacity}" stroke-width="1.2"/><rect x="1" y="17" width="14" height="14" fill="${teal}" fill-opacity="0.18" stroke="${outline}" stroke-opacity="${opacity}" stroke-width="1.2"/><rect x="17" y="17" width="14" height="14" fill="${cream}" fill-opacity="0.3" stroke="${outline}" stroke-opacity="${opacity}" stroke-width="1.2"/><circle cx="8" cy="8" r="3" fill="none" stroke="${teal}" stroke-opacity="${opacity}" stroke-width="1"/><circle cx="24" cy="24" r="3" fill="none" stroke="${teal}" stroke-opacity="${opacity}" stroke-width="1"/></svg>`
  );
}

/** Vertical bamboo canes */
function patternBamboo(stroke = "#3f6212", opacity = 0.45) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="32" viewBox="0 0 28 32"><path d="M6 0v32M14 0v32M22 0v32" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="2.2" stroke-linecap="round"/><path d="M4 8h4M12 16h4M20 10h4M4 22h4M12 26h4M20 20h4" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.85}" stroke-width="1.2"/></svg>`
  );
}

/** Diagonal silk weave */
function patternSilk(stroke = "#9f1239", opacity = 0.4) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M-2 8L8-2M-2 16L16-2M-2 24L24-2M6 26L26 6M14 26L26 14" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/><path d="M-2 4L4-2M-2 20L20-2M2 26L26 2M10 26L26 10" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.55}" stroke-width="0.7"/></svg>`
  );
}

/** Woven textile crosshatch */
function patternTextile(stroke = "#c2410c", opacity = 0.42) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M0 4h16M0 8h16M0 12h16M4 0v16M8 0v16M12 0v16" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.85"/></svg>`
  );
}

/** Limestone speckles */
function patternLimestone(fill = "#78716c", opacity = 0.35) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="4" cy="6" r="1.2" fill="${fill}" fill-opacity="${opacity}"/><circle cx="14" cy="4" r="0.8" fill="${fill}" fill-opacity="${opacity * 0.8}"/><circle cx="24" cy="9" r="1.4" fill="${fill}" fill-opacity="${opacity}"/><circle cx="8" cy="18" r="1" fill="${fill}" fill-opacity="${opacity * 0.9}"/><circle cx="18" cy="16" r="0.7" fill="${fill}" fill-opacity="${opacity * 0.7}"/><circle cx="28" cy="20" r="1.1" fill="${fill}" fill-opacity="${opacity}"/><circle cx="6" cy="28" r="0.9" fill="${fill}" fill-opacity="${opacity * 0.85}"/><circle cx="20" cy="26" r="1.3" fill="${fill}" fill-opacity="${opacity}"/><circle cx="12" cy="12" r="0.6" fill="${fill}" fill-opacity="${opacity * 0.6}"/></svg>`
  );
}

/** Kraft / coffee paper fiber */
function patternPaperFiber(stroke = "#78350f", opacity = 0.38) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24"><g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.85" stroke-linecap="round"><path d="M2 4h8M14 3h10M28 5h6"/><path d="M1 10h12M16 11h9M28 9h7"/><path d="M3 17h7M13 16h11M27 18h8"/><path d="M4 21h10M18 22h8"/></g></svg>`
  );
}

/** Aged parchment flecks */
function patternParchmentFlecks(fill = "#a16207", opacity = 0.4) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><ellipse cx="5" cy="7" rx="2.2" ry="1.1" fill="${fill}" fill-opacity="${opacity}" transform="rotate(-20 5 7)"/><ellipse cx="16" cy="5" rx="1.6" ry="0.8" fill="${fill}" fill-opacity="${opacity * 0.7}" transform="rotate(15 16 5)"/><ellipse cx="22" cy="14" rx="2" ry="1" fill="${fill}" fill-opacity="${opacity * 0.85}" transform="rotate(-10 22 14)"/><ellipse cx="8" cy="18" rx="1.8" ry="0.9" fill="${fill}" fill-opacity="${opacity * 0.75}" transform="rotate(25 8 18)"/><ellipse cx="18" cy="22" rx="2.4" ry="1.1" fill="${fill}" fill-opacity="${opacity}" transform="rotate(-5 18 22)"/></svg>`
  );
}

/** Brick running bond */
function patternBrick(stroke = "#7c2d12", fill = "#c2410c", opacity = 0.5) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" viewBox="0 0 40 24"><rect x="0.5" y="0.5" width="19" height="11" fill="${fill}" fill-opacity="0.12" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/><rect x="20.5" y="0.5" width="19" height="11" fill="${fill}" fill-opacity="0.08" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/><rect x="-9.5" y="12.5" width="19" height="11" fill="${fill}" fill-opacity="0.1" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/><rect x="10.5" y="12.5" width="19" height="11" fill="${fill}" fill-opacity="0.14" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/><rect x="30.5" y="12.5" width="19" height="11" fill="${fill}" fill-opacity="0.08" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/></svg>`
  );
}

/** Diamond plate / industrial metal */
function patternDiamondPlate(stroke = "#334155", opacity = 0.45) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2l4 6-4 6-4-6z" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.1"/><path d="M0 14l4 6-4 6M24 14l-4 6 4 6" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.7}" stroke-width="1"/><circle cx="6" cy="6" r="1.2" fill="${stroke}" fill-opacity="${opacity}"/><circle cx="18" cy="18" r="1.2" fill="${stroke}" fill-opacity="${opacity}"/></svg>`
  );
}

/** Oak grain with copper dots */
function patternCopperOak(oak = "#92400e", copper = "#b45309", opacity = 0.42) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="20" viewBox="0 0 36 20"><path d="M0 4c6 2 10-2 18 0s12 3 18 0M0 10c7 2 11-2 18 1s12 2 18-1M0 16c6 1 10-1 18 0s12 2 18 0" fill="none" stroke="${oak}" stroke-opacity="${opacity}" stroke-width="1.1"/><circle cx="8" cy="7" r="1.4" fill="${copper}" fill-opacity="${opacity * 0.9}"/><circle cx="20" cy="13" r="1.6" fill="${copper}" fill-opacity="${opacity}"/><circle cx="30" cy="6" r="1.3" fill="${copper}" fill-opacity="${opacity * 0.85}"/></svg>`
  );
}

/** Vineyard trellis lattice */
function patternTrellis(stroke = "#6b21a8", opacity = 0.42) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M0 0l28 28M28 0L0 28" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.2"/><path d="M14 2v24M2 14h24" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.55}" stroke-width="0.9"/><circle cx="14" cy="14" r="3" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.7}" stroke-width="1"/></svg>`
  );
}

/** Soft pastel confetti */
function patternPastelConfetti(a = "#db2777", b = "#8b5cf6", c = "#06b6d4", opacity = 0.45) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="6" cy="8" r="2.2" fill="${a}" fill-opacity="${opacity}"/><circle cx="18" cy="6" r="1.6" fill="${b}" fill-opacity="${opacity}"/><circle cx="26" cy="14" r="2" fill="${c}" fill-opacity="${opacity}"/><circle cx="10" cy="20" r="1.8" fill="${b}" fill-opacity="${opacity * 0.85}"/><circle cx="22" cy="24" r="2.2" fill="${a}" fill-opacity="${opacity}"/><circle cx="4" cy="26" r="1.4" fill="${c}" fill-opacity="${opacity * 0.9}"/></svg>`
  );
}

/** Dawn soft stripes */
function patternSunriseStripes(stroke = "#ea580c", opacity = 0.4) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M16 2v10M16 20v10M2 16h10M20 16h10M5 5l7 7M20 20l7 7M27 5l-7 7M12 20l-7 7" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.3" stroke-linecap="round"/><circle cx="16" cy="16" r="4" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.7}" stroke-width="1.1"/></svg>`
  );
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
    pageBackground: "#eef1ee",
    backgroundPattern: patternGrid("#64748b", 0.38, 18),
    accent: "#166534",
    sectionLabel: "#166534",
    cardBorder: "#d6d3d1",
    cardShadow: "0 1px 2px rgba(28,25,23,0.05)",
    buttonBackground: "#166534",
    buttonText: "#ffffff",
  },
  fine_dining: {
    name: "Marble & Linen",
    pageBackground: "#f3efe6",
    backgroundPattern: patternMarble("#78716c", 0.38),
    accent: "#3f3a36",
    sectionLabel: "#57534e",
    cardBorder: "#ddd6cb",
    cardShadow: "0 1px 3px rgba(28,25,23,0.05)",
    buttonBackground: "#3f3a36",
    buttonText: "#fafaf9",
  },
  sports_bar: {
    name: "Dark Leather",
    pageBackground: "#3f3a36",
    backgroundPattern: patternLeather("#a8a29e", 0.45),
    accent: "#1c1917",
    // sectionLabel is used on white cards — keep readable on #fff
    sectionLabel: "#44403c",
    cardBorder: "#57534e",
    cardShadow: "0 1px 4px rgba(0,0,0,0.25)",
    buttonBackground: "#1c1917",
    buttonText: "#fafaf9",
  },
  neighborhood_pub: {
    name: "Neighborhood Pub",
    pageBackground: "#c4a574",
    backgroundPattern: patternWoodPanels("#5c4033", 0.5),
    accent: "#5c4033",
    sectionLabel: "#4a3428",
    cardBorder: "#a8895c",
    cardShadow: "0 1px 3px rgba(60,40,20,0.12)",
    buttonBackground: "#5c4033",
    buttonText: "#faf7f2",
  },
  wood_and_steel: {
    name: "Wood & Steel",
    pageBackground: "#d7d2c8",
    backgroundPattern: patternWoodSteel("#57534e", "#475569", 0.45),
    accent: "#44403c",
    sectionLabel: "#44403c",
    cardBorder: "#a8a29e",
    cardShadow: "0 1px 3px rgba(28,25,23,0.08)",
    buttonBackground: "#44403c",
    buttonText: "#fafaf9",
  },
  rustic_bbq: {
    name: "Rustic Wood",
    pageBackground: "#c9956c",
    backgroundPattern: patternRusticPlank("#7c2d12", 0.5),
    accent: "#7c2d12",
    sectionLabel: "#5c1a0a",
    cardBorder: "#a66a3c",
    cardShadow: "0 1px 3px rgba(120,53,15,0.12)",
    buttonBackground: "#9a3412",
    buttonText: "#fff7ed",
  },
  coastal: {
    name: "Coastal Blue",
    pageBackground: "#9fd4e4",
    backgroundPattern: patternWaves("#0e7490", 0.5),
    accent: "#0e7490",
    sectionLabel: "#155e75",
    cardBorder: "#67b8cc",
    cardShadow: "0 1px 3px rgba(8,47,73,0.1)",
    buttonBackground: "#0e7490",
    buttonText: "#ecfeff",
  },
  tuscan_stone: {
    name: "Tuscan Stone",
    pageBackground: "#dcc4a0",
    backgroundPattern: patternStoneBlocks("#92400e", 0.45),
    accent: "#92400e",
    sectionLabel: "#78350f",
    cardBorder: "#c4a87c",
    cardShadow: "0 1px 3px rgba(120,53,15,0.1)",
    buttonBackground: "#92400e",
    buttonText: "#fffbeb",
  },
  tile: {
    name: "Talavera Tile",
    pageBackground: "#f0dcc4",
    backgroundPattern: patternTalavera("#9a3412", "#0f766e", "#fef3c7", 0.55),
    accent: "#b45309",
    sectionLabel: "#0f766e",
    cardBorder: "#d4b896",
    cardShadow: "0 1px 3px rgba(120,53,15,0.1)",
    buttonBackground: "#b45309",
    buttonText: "#fffbeb",
  },
  minimal_bamboo: {
    name: "Minimal Bamboo",
    pageBackground: "#c5d9b0",
    backgroundPattern: patternBamboo("#3f6212", 0.5),
    accent: "#3f6212",
    sectionLabel: "#365314",
    cardBorder: "#9cb882",
    cardShadow: "0 1px 2px rgba(20,40,10,0.08)",
    buttonBackground: "#3f6212",
    buttonText: "#f7fee7",
  },
  silk: {
    name: "Silk Pattern",
    pageBackground: "#e8b8c4",
    backgroundPattern: patternSilk("#9f1239", 0.45),
    accent: "#9f1239",
    sectionLabel: "#881337",
    cardBorder: "#d090a0",
    cardShadow: "0 1px 3px rgba(80,10,30,0.1)",
    buttonBackground: "#9f1239",
    buttonText: "#fff1f2",
  },
  warm_textile: {
    name: "Warm Textile",
    pageBackground: "#e8b078",
    backgroundPattern: patternTextile("#c2410c", 0.48),
    accent: "#c2410c",
    sectionLabel: "#9a3412",
    cardBorder: "#d09050",
    cardShadow: "0 1px 3px rgba(120,53,15,0.1)",
    buttonBackground: "#c2410c",
    buttonText: "#fff7ed",
  },
  white_stone: {
    name: "White Stone",
    pageBackground: "#eceae4",
    backgroundPattern: patternLimestone("#78716c", 0.4),
    accent: "#57534e",
    sectionLabel: "#57534e",
    cardBorder: "#d6d3d1",
    cardShadow: "0 1px 2px rgba(28,25,23,0.05)",
    buttonBackground: "#57534e",
    buttonText: "#fafaf9",
  },
  coffee_house: {
    name: "Coffee Paper",
    pageBackground: "#cbb59a",
    backgroundPattern: patternPaperFiber("#78350f", 0.45),
    accent: "#78350f",
    sectionLabel: "#5c2a0a",
    cardBorder: "#a89070",
    cardShadow: "0 1px 3px rgba(60,30,10,0.1)",
    buttonBackground: "#784221",
    buttonText: "#faf6f1",
  },
  parchment: {
    name: "Parchment",
    pageBackground: "#f0e0b8",
    backgroundPattern: patternParchmentFlecks("#a16207", 0.45),
    accent: "#a16207",
    sectionLabel: "#854d0e",
    cardBorder: "#d8c890",
    cardShadow: "0 1px 2px rgba(80,50,10,0.08)",
    buttonBackground: "#a16207",
    buttonText: "#fefce8",
  },
  brick_oven: {
    name: "Brick Oven",
    pageBackground: "#d4a088",
    backgroundPattern: patternBrick("#7c2d12", "#c2410c", 0.55),
    accent: "#9a3412",
    sectionLabel: "#7c2d12",
    cardBorder: "#b87860",
    cardShadow: "0 1px 3px rgba(120,53,15,0.12)",
    buttonBackground: "#9a3412",
    buttonText: "#fff7ed",
  },
  industrial: {
    name: "Industrial Metal",
    pageBackground: "#9aa8b8",
    backgroundPattern: patternDiamondPlate("#1e293b", 0.5),
    accent: "#1e293b",
    sectionLabel: "#334155",
    cardBorder: "#64748b",
    cardShadow: "0 1px 3px rgba(15,23,42,0.12)",
    buttonBackground: "#334155",
    buttonText: "#f8fafc",
  },
  copper_and_oak: {
    name: "Copper & Oak",
    pageBackground: "#d4b078",
    backgroundPattern: patternCopperOak("#92400e", "#ea580c", 0.48),
    accent: "#b45309",
    sectionLabel: "#92400e",
    cardBorder: "#b89050",
    cardShadow: "0 1px 3px rgba(120,53,15,0.1)",
    buttonBackground: "#b45309",
    buttonText: "#fffbeb",
  },
  vineyard: {
    name: "Vineyard",
    pageBackground: "#c8b0d8",
    backgroundPattern: patternTrellis("#6b21a8", 0.48),
    accent: "#6b21a8",
    sectionLabel: "#581c87",
    cardBorder: "#a888c0",
    cardShadow: "0 1px 3px rgba(60,20,80,0.1)",
    buttonBackground: "#6b21a8",
    buttonText: "#faf5ff",
  },
  soft_pastel: {
    name: "Soft Pastels",
    pageBackground: "#f5c8dc",
    backgroundPattern: patternPastelConfetti("#db2777", "#8b5cf6", "#06b6d4", 0.5),
    accent: "#be185d",
    sectionLabel: "#9d174d",
    cardBorder: "#e4a8c0",
    cardShadow: "0 1px 2px rgba(80,20,50,0.08)",
    buttonBackground: "#be185d",
    buttonText: "#fdf2f8",
  },
  sunrise: {
    name: "Sunrise",
    pageBackground: "#ffc090",
    backgroundPattern: patternSunriseStripes("#ea580c", 0.48),
    accent: "#ea580c",
    sectionLabel: "#c2410c",
    cardBorder: "#f0a060",
    cardShadow: "0 1px 3px rgba(154,52,18,0.1)",
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
