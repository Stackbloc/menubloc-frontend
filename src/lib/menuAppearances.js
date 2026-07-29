/**
 * Menu Appearance design tokens for Default (v1) public menu chrome.
 * Keys must stay in sync with menubloc-backend-main/src/lib/menuAppearances.js
 *
 * Custom Menu Lab layouts (v12–v17) do not consume these tokens.
 */

export const DEFAULT_MENU_APPEARANCE_KEY = "modern_minimal";

function svgDataUri(svgMarkup) {
  return `url("data:image/svg+xml,${encodeURIComponent(svgMarkup)}")`;
}

function patternGrid(stroke = "#a8a29e", opacity = 0.35, size = 20) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><path d="M${size} 0H0v${size}" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.85"/></svg>`
  );
}

function patternPaperFiber(stroke = "#78350f", opacity = 0.32) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24"><g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.8" stroke-linecap="round"><path d="M2 4h8M14 3h10M28 5h6"/><path d="M1 10h12M16 11h9M28 9h7"/><path d="M3 17h7M13 16h11M27 18h8"/><path d="M4 21h10M18 22h8"/></g></svg>`
  );
}

function patternTextile(stroke = "#a8a29e", opacity = 0.32) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M0 4h16M0 8h16M0 12h16M4 0v16M8 0v16M12 0v16" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.75"/></svg>`
  );
}

function patternMarble(stroke = "#78716c", opacity = 0.28) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M0 28c8-6 14-2 20 2s14 8 28-4" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.1"/><path d="M-4 12c12 4 18-2 28 2s16 6 28-2" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.75}" stroke-width="0.85"/></svg>`
  );
}

function patternDots(fill = "#64748b", opacity = 0.28) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="4" cy="4" r="1.1" fill="${fill}" fill-opacity="${opacity}"/><circle cx="14" cy="10" r="1" fill="${fill}" fill-opacity="${opacity * 0.85}"/><circle cx="8" cy="16" r="1.2" fill="${fill}" fill-opacity="${opacity}"/></svg>`
  );
}

function patternRusticPlank(stroke = "#7c2d12", opacity = 0.35) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><path d="M0 4h40M0 10h40M0 16h40" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.2"/><circle cx="8" cy="7" r="0.9" fill="${stroke}" fill-opacity="${opacity * 0.6}"/><circle cx="22" cy="13" r="0.8" fill="${stroke}" fill-opacity="${opacity * 0.55}"/></svg>`
  );
}

function patternDiamondPlate(stroke = "#475569", opacity = 0.32) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2l4 6-4 6-4-6z" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/><circle cx="6" cy="6" r="1" fill="${stroke}" fill-opacity="${opacity}"/><circle cx="18" cy="18" r="1" fill="${stroke}" fill-opacity="${opacity}"/></svg>`
  );
}

function patternWaves(stroke = "#0e7490", opacity = 0.32) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><path d="M0 6c5 4 10 4 15 0s10-4 15 0 10 4 15 0" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.15"/><path d="M0 14c5 4 10 4 15 0s10-4 15 0 10 4 15 0" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.7}" stroke-width="1"/></svg>`
  );
}

function patternStoneBlocks(stroke = "#92400e", opacity = 0.3) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24"><path d="M0 12h36M18 0v12M9 12v12M27 12v12" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1.05"/></svg>`
  );
}

function patternParchmentFlecks(fill = "#a16207", opacity = 0.32) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><ellipse cx="5" cy="7" rx="2" ry="1" fill="${fill}" fill-opacity="${opacity}" transform="rotate(-20 5 7)"/><ellipse cx="16" cy="5" rx="1.4" ry="0.7" fill="${fill}" fill-opacity="${opacity * 0.7}" transform="rotate(15 16 5)"/><ellipse cx="22" cy="14" rx="1.8" ry="0.9" fill="${fill}" fill-opacity="${opacity * 0.8}"/></svg>`
  );
}

function patternSoftGrain(stroke = "#a8a29e", opacity = 0.28) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.9" stroke-linecap="round"><path d="M3 5c2 1 3-1 5 0M12 4c2 .8 3-1 5 .2M20 7c1.5.6 2.5-.8 4 .1"/><path d="M2 14c2 .7 3.2-1 5.2.1M11 13c2.2.9 3.5-1.2 5.5.2M19 15c1.8.5 3-.9 4.5.2"/></g></svg>`
  );
}

function patternGeometric(stroke = "#475569", opacity = 0.3) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M14 2l10 10-10 10L4 12z" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/><path d="M14 8l5 5-5 5-5-5z" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.65}" stroke-width="0.85"/></svg>`
  );
}

function patternExecutive(stroke = "#334155", opacity = 0.28) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" viewBox="0 0 32 16"><path d="M0 8h32M8 0v16M24 0v16" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.9"/></svg>`
  );
}

function patternHeritage(stroke = "#78350f", opacity = 0.3) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M0 0l32 32M32 0L0 32" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="0.95"/><circle cx="16" cy="16" r="4" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.7}" stroke-width="0.9"/></svg>`
  );
}

function patternArtisan(stroke = "#9a3412", opacity = 0.3) {
  return svgDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="8" cy="8" r="3" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/><circle cx="22" cy="10" r="2.5" fill="none" stroke="${stroke}" stroke-opacity="${opacity * 0.8}" stroke-width="0.9"/><circle cx="14" cy="22" r="3.2" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/></svg>`
  );
}

/**
 * @typedef {object} MenuAppearanceTokens
 * @property {string} name
 * @property {string} pageBackground
 * @property {string} backgroundPattern
 * @property {string} menuSurface
 * @property {string} accent
 * @property {string} divider
 * @property {string} sectionHeader
 * @property {string} border
 * @property {string} shadow
 * @property {string} ink - primary text on menuSurface (WCAG AA vs surface)
 * @property {string} muted - secondary text on menuSurface
 * @property {string} onPage - text/icons on page chrome (sticky bars, outer shell)
 */

/** Default readable text colors for light menu surfaces / page chrome. */
export const MENU_APPEARANCE_READABILITY = Object.freeze({
  ink: "#1c1917",
  muted: "#57534e",
  onPage: "#1c1917",
});

/** @type {Record<string, MenuAppearanceTokens>} */
export const menuAppearances = {
  modern_minimal: {
    name: "Modern Minimal",
    pageBackground: "#eef1ee",
    backgroundPattern: patternGrid("#64748b", 0.22, 18),
    menuSurface: "#ffffff",
    accent: "#166534",
    divider: "#e5e7eb",
    sectionHeader: "#14532d",
    border: "#e5e7eb",
    shadow: "0 1px 3px rgba(15,23,42,0.06)",
    ...MENU_APPEARANCE_READABILITY,
  },
  classic_paper: {
    name: "Classic Paper",
    pageBackground: "#f3ead8",
    backgroundPattern: patternPaperFiber("#a16207", 0.22),
    menuSurface: "#fffdf8",
    accent: "#92400e",
    divider: "#e8dcc8",
    sectionHeader: "#78350f",
    border: "#e4d5bc",
    shadow: "0 1px 3px rgba(120,53,15,0.08)",
    ...MENU_APPEARANCE_READABILITY,
  },
  linen: {
    name: "Linen",
    pageBackground: "#ebe6dc",
    backgroundPattern: patternTextile("#a8a29e", 0.22),
    menuSurface: "#fffcf7",
    accent: "#44403c",
    divider: "#e7e5e4",
    sectionHeader: "#292524",
    border: "#ddd6ce",
    shadow: "0 1px 3px rgba(28,25,23,0.06)",
    ...MENU_APPEARANCE_READABILITY,
  },
  elegant: {
    name: "Elegant",
    pageBackground: "#ece7df",
    backgroundPattern: patternMarble("#78716c", 0.2),
    menuSurface: "#fffcf8",
    accent: "#3f3a36",
    divider: "#e7e0d6",
    sectionHeader: "#292524",
    border: "#ddd6cb",
    shadow: "0 1px 3px rgba(28,25,23,0.05)",
    ...MENU_APPEARANCE_READABILITY,
  },
  contemporary: {
    name: "Contemporary",
    pageBackground: "#e8eef3",
    backgroundPattern: patternDots("#64748b", 0.2),
    menuSurface: "#ffffff",
    accent: "#0f766e",
    divider: "#e2e8f0",
    sectionHeader: "#115e59",
    border: "#dbe3eb",
    shadow: "0 1px 3px rgba(15,23,42,0.06)",
    ...MENU_APPEARANCE_READABILITY,
  },
  rustic: {
    name: "Rustic",
    pageBackground: "#edd8c4",
    backgroundPattern: patternRusticPlank("#9a3412", 0.22),
    menuSurface: "#fffaf4",
    accent: "#9a3412",
    divider: "#ead7c4",
    sectionHeader: "#7c2d12",
    border: "#e0c9b0",
    shadow: "0 1px 3px rgba(120,53,15,0.1)",
    ...MENU_APPEARANCE_READABILITY,
  },
  industrial: {
    name: "Industrial",
    pageBackground: "#e2e6eb",
    backgroundPattern: patternDiamondPlate("#475569", 0.2),
    menuSurface: "#f8fafc",
    accent: "#334155",
    divider: "#e2e8f0",
    sectionHeader: "#0f172a",
    border: "#cbd5e1",
    shadow: "0 1px 3px rgba(15,23,42,0.08)",
    ...MENU_APPEARANCE_READABILITY,
  },
  coastal: {
    name: "Coastal",
    pageBackground: "#dff0f5",
    backgroundPattern: patternWaves("#0e7490", 0.22),
    menuSurface: "#f7fcfd",
    accent: "#0e7490",
    divider: "#d4e8ef",
    sectionHeader: "#155e75",
    border: "#c5dde6",
    shadow: "0 1px 3px rgba(8,47,73,0.08)",
    ...MENU_APPEARANCE_READABILITY,
  },
  stone: {
    name: "Stone",
    pageBackground: "#e8dccb",
    backgroundPattern: patternStoneBlocks("#92400e", 0.2),
    menuSurface: "#fffaf3",
    accent: "#92400e",
    divider: "#e8d9c4",
    sectionHeader: "#78350f",
    border: "#dcc9ae",
    shadow: "0 1px 3px rgba(120,53,15,0.09)",
    ...MENU_APPEARANCE_READABILITY,
  },
  warm_paper: {
    name: "Warm Paper",
    pageBackground: "#f2e6d4",
    backgroundPattern: patternParchmentFlecks("#a16207", 0.22),
    menuSurface: "#fff8ee",
    accent: "#b45309",
    divider: "#ead9c0",
    sectionHeader: "#92400e",
    border: "#e2d0b4",
    shadow: "0 1px 3px rgba(146,64,14,0.08)",
    ...MENU_APPEARANCE_READABILITY,
  },
  soft_texture: {
    name: "Soft Texture",
    pageBackground: "#efe8f0",
    backgroundPattern: patternSoftGrain("#a78bfa", 0.18),
    menuSurface: "#fffbfe",
    accent: "#6d28d9",
    divider: "#e9e0f0",
    sectionHeader: "#5b21b6",
    border: "#ddd0e8",
    shadow: "0 1px 3px rgba(76,29,149,0.07)",
    ...MENU_APPEARANCE_READABILITY,
  },
  geometric: {
    name: "Geometric",
    pageBackground: "#e8edf4",
    backgroundPattern: patternGeometric("#475569", 0.2),
    menuSurface: "#ffffff",
    accent: "#1d4ed8",
    divider: "#e2e8f0",
    sectionHeader: "#1e3a8a",
    border: "#d4dce8",
    shadow: "0 1px 3px rgba(30,64,175,0.07)",
    ...MENU_APPEARANCE_READABILITY,
  },
  executive: {
    name: "Executive",
    pageBackground: "#e6eaee",
    backgroundPattern: patternExecutive("#334155", 0.18),
    menuSurface: "#fbfcfd",
    accent: "#0f172a",
    divider: "#e2e8f0",
    sectionHeader: "#0f172a",
    border: "#d0d7e0",
    shadow: "0 1px 3px rgba(15,23,42,0.07)",
    ...MENU_APPEARANCE_READABILITY,
  },
  heritage: {
    name: "Heritage",
    pageBackground: "#e8dccb",
    backgroundPattern: patternHeritage("#78350f", 0.2),
    menuSurface: "#fff9f1",
    accent: "#78350f",
    divider: "#e8d8c4",
    sectionHeader: "#5c2a0a",
    border: "#dcc9ae",
    shadow: "0 1px 3px rgba(120,53,15,0.09)",
    ...MENU_APPEARANCE_READABILITY,
  },
  artisan: {
    name: "Artisan",
    pageBackground: "#ecdccf",
    backgroundPattern: patternArtisan("#9a3412", 0.2),
    menuSurface: "#fff7f0",
    accent: "#c2410c",
    divider: "#ead7c6",
    sectionHeader: "#9a3412",
    border: "#e0c8b2",
    shadow: "0 1px 3px rgba(154,52,18,0.09)",
    ...MENU_APPEARANCE_READABILITY,
  },
  dark: {
    name: "Dark",
    pageBackground: "#000000",
    backgroundPattern: patternGrid("#a3a3a3", 0.22, 18),
    menuSurface: "#000000",
    accent: "#fafafa",
    divider: "#262626",
    sectionHeader: "#f5f5f5",
    border: "#333333",
    shadow: "0 1px 3px rgba(255,255,255,0.08)",
    ink: "#ffffff",
    muted: "#a3a3a3",
    onPage: "#ffffff",
  },
};

export const MENU_APPEARANCE_KEYS = Object.freeze(Object.keys(menuAppearances));

export function isValidMenuAppearanceKey(key) {
  if (key == null) return false;
  return Object.prototype.hasOwnProperty.call(menuAppearances, String(key).trim());
}

export function getMenuAppearanceTokens(key) {
  const base = isValidMenuAppearanceKey(key)
    ? menuAppearances[String(key).trim()]
    : menuAppearances[DEFAULT_MENU_APPEARANCE_KEY];
  return {
    ...MENU_APPEARANCE_READABILITY,
    ...base,
  };
}

function parseHexRgb(hex) {
  const h = String(hex || "").replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function relativeLuminance(hex) {
  const rgb = parseHexRgb(hex);
  if (!rgb) return 0;
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** WCAG contrast ratio between two hex colors. */
export function contrastRatio(foregroundHex, backgroundHex) {
  const L1 = relativeLuminance(foregroundHex);
  const L2 = relativeLuminance(backgroundHex);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Assert primary body text meets WCAG AA (≥4.5:1) on the menu surface.
 * @returns {{ ok: boolean, inkRatio: number, mutedRatio: number, onPageRatio: number }}
 */
export function evaluateMenuAppearanceContrast(appearanceKey) {
  const t = getMenuAppearanceTokens(appearanceKey);
  const inkRatio = contrastRatio(t.ink, t.menuSurface);
  const mutedRatio = contrastRatio(t.muted, t.menuSurface);
  const onPageRatio = contrastRatio(t.onPage, t.pageBackground);
  return {
    ok: inkRatio >= 4.5 && mutedRatio >= 4.5 && onPageRatio >= 4.5,
    inkRatio,
    mutedRatio,
    onPageRatio,
  };
}

/** CSS custom properties for Default-layout menu chrome. */
export function menuAppearanceToCssVars(tokens) {
  const t = tokens || getMenuAppearanceTokens(DEFAULT_MENU_APPEARANCE_KEY);
  return {
    "--menu-page-background": t.pageBackground,
    "--menu-pattern": t.backgroundPattern,
    "--menu-surface": t.menuSurface,
    "--menu-accent": t.accent,
    "--menu-divider": t.divider,
    "--menu-section-header": t.sectionHeader,
    "--menu-border": t.border,
    "--menu-shadow": t.shadow,
    "--menu-ink": t.ink,
    "--menu-muted": t.muted,
    "--menu-on-page": t.onPage,
  };
}

export function buildMenuAppearanceRootStyle(appearanceKey) {
  const tokens = getMenuAppearanceTokens(appearanceKey);
  const vars = menuAppearanceToCssVars(tokens);
  return {
    ...vars,
    backgroundColor: tokens.pageBackground,
    backgroundImage: tokens.backgroundPattern,
    backgroundRepeat: "repeat",
    backgroundAttachment: "scroll",
    color: tokens.onPage,
  };
}

export function buildMenuAppearanceSurfaceStyle(appearanceKey) {
  const tokens = getMenuAppearanceTokens(appearanceKey);
  return {
    backgroundColor: tokens.menuSurface,
    border: `1px solid ${tokens.border}`,
    boxShadow: tokens.shadow,
    borderRadius: 12,
    color: tokens.ink,
  };
}

/** True when Menu Appearance should drive public chrome (Default layout only). */
export function shouldApplyMenuAppearance(menuStyleRaw) {
  const s = String(menuStyleRaw || "v1").toLowerCase().trim();
  return s === "v1" || s === "classic" || s === "";
}
