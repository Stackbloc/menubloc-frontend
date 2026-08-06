/**
 * Menu Wallpaper bank for Default (v1) public menu chrome.
 * Independent of Menu Appearance color/surface tokens — overrides pattern only.
 * Keys/params must stay in sync with menubloc-backend-main/src/lib/menuWallpapers.js
 */

import { getTypeScopedAppearancePool } from "./menuAppearanceRecommendation.js";

export const MENU_WALLPAPER_NONE = "none";
export const MENU_WALLPAPER_INHERIT = null;

export const SUBTLE_OPACITY_MIN = 0.16;
export const SUBTLE_OPACITY_MAX = 0.22;

export const WALLPAPER_FAMILIES = Object.freeze([
  "grid",
  "paper",
  "textile",
  "marble",
  "dots",
  "plank",
  "diamond",
  "waves",
  "stone",
  "flecks",
  "grain",
  "geometric",
  "executive",
  "heritage",
  "rings",
  "stipple",
  "lattice",
  "ripple",
  "confetti",
  "hatch",
]);

export const FAMILY_DISPLAY_NAMES = Object.freeze({
  grid: "Soft Grid",
  paper: "Paper Fiber",
  textile: "Linen Weave",
  marble: "Marble Veins",
  dots: "Quiet Dots",
  plank: "Rustic Plank",
  diamond: "Diamond Plate",
  waves: "Coastal Waves",
  stone: "Stone Blocks",
  flecks: "Parchment Flecks",
  grain: "Soft Grain",
  geometric: "Geo Diamonds",
  executive: "Executive Lines",
  heritage: "Heritage Cross",
  rings: "Soft Rings",
  stipple: "Stipple Dust",
  lattice: "Open Lattice",
  ripple: "Ripple Lines",
  confetti: "Confetti Specks",
  hatch: "Fine Hatch",
});

const PRESET_STROKES = Object.freeze([
  "#64748b",
  "#a16207",
  "#a8a29e",
  "#78716c",
  "#9a3412",
  "#475569",
  "#0e7490",
  "#92400e",
  "#a78bfa",
  "#334155",
  "#78350f",
  "#57534e",
]);

export function clampOpacity(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0.2;
  return Math.min(SUBTLE_OPACITY_MAX, Math.max(SUBTLE_OPACITY_MIN, n));
}

function svgDataUri(svgMarkup) {
  return `url("data:image/svg+xml,${encodeURIComponent(svgMarkup)}")`;
}

function renderFamilySvg(family, color, opacity, size) {
  const stroke = color || "#64748b";
  const op = clampOpacity(opacity);
  const s = Number(size) || 24;

  switch (family) {
    case "grid":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><path d="M${s} 0H0v${s}" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="0.85"/></svg>`
      );
    case "paper":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24"><g fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="0.8" stroke-linecap="round"><path d="M2 4h8M14 3h10M28 5h6"/><path d="M1 10h12M16 11h9M28 9h7"/><path d="M3 17h7M13 16h11M27 18h8"/><path d="M4 21h10M18 22h8"/></g></svg>`
      );
    case "textile":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path d="M0 4h16M0 8h16M0 12h16M4 0v16M8 0v16M12 0v16" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="0.75"/></svg>`
      );
    case "marble":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M0 28c8-6 14-2 20 2s14 8 28-4" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1.1"/><path d="M-4 12c12 4 18-2 28 2s16 6 28-2" fill="none" stroke="${stroke}" stroke-opacity="${op * 0.75}" stroke-width="0.85"/></svg>`
      );
    case "dots":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="4" cy="4" r="1.1" fill="${stroke}" fill-opacity="${op}"/><circle cx="14" cy="10" r="1" fill="${stroke}" fill-opacity="${op * 0.85}"/><circle cx="8" cy="16" r="1.2" fill="${stroke}" fill-opacity="${op}"/></svg>`
      );
    case "plank":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><path d="M0 4h40M0 10h40M0 16h40" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1.2"/><circle cx="8" cy="7" r="0.9" fill="${stroke}" fill-opacity="${op * 0.6}"/><circle cx="22" cy="13" r="0.8" fill="${stroke}" fill-opacity="${op * 0.55}"/></svg>`
      );
    case "diamond":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2l4 6-4 6-4-6z" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1"/><circle cx="6" cy="6" r="1" fill="${stroke}" fill-opacity="${op}"/><circle cx="18" cy="18" r="1" fill="${stroke}" fill-opacity="${op}"/></svg>`
      );
    case "waves":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 40 20"><path d="M0 6c5 4 10 4 15 0s10-4 15 0 10 4 15 0" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1.15"/><path d="M0 14c5 4 10 4 15 0s10-4 15 0 10 4 15 0" fill="none" stroke="${stroke}" stroke-opacity="${op * 0.7}" stroke-width="1"/></svg>`
      );
    case "stone":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="24" viewBox="0 0 36 24"><path d="M0 12h36M18 0v12M9 12v12M27 12v12" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1.05"/></svg>`
      );
    case "flecks":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><ellipse cx="5" cy="7" rx="2" ry="1" fill="${stroke}" fill-opacity="${op}" transform="rotate(-20 5 7)"/><ellipse cx="16" cy="5" rx="1.4" ry="0.7" fill="${stroke}" fill-opacity="${op * 0.7}" transform="rotate(15 16 5)"/><ellipse cx="22" cy="14" rx="1.8" ry="0.9" fill="${stroke}" fill-opacity="${op * 0.8}"/></svg>`
      );
    case "grain":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><g fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="0.9" stroke-linecap="round"><path d="M3 5c2 1 3-1 5 0M12 4c2 .8 3-1 5 .2M20 7c1.5.6 2.5-.8 4 .1"/><path d="M2 14c2 .7 3.2-1 5.2.1M11 13c2.2.9 3.5-1.2 5.5.2M19 15c1.8.5 3-.9 4.5.2"/></g></svg>`
      );
    case "geometric":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M14 2l10 10-10 10L4 12z" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1"/><path d="M14 8l5 5-5 5-5-5z" fill="none" stroke="${stroke}" stroke-opacity="${op * 0.65}" stroke-width="0.85"/></svg>`
      );
    case "executive":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" viewBox="0 0 32 16"><path d="M0 8h32M8 0v16M24 0v16" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="0.9"/></svg>`
      );
    case "heritage":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M0 0l32 32M32 0L0 32" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="0.95"/><circle cx="16" cy="16" r="4" fill="none" stroke="${stroke}" stroke-opacity="${op * 0.7}" stroke-width="0.9"/></svg>`
      );
    case "rings":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="8" cy="8" r="3" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1"/><circle cx="22" cy="10" r="2.5" fill="none" stroke="${stroke}" stroke-opacity="${op * 0.8}" stroke-width="0.9"/><circle cx="14" cy="22" r="3.2" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1"/></svg>`
      );
    case "stipple":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><circle cx="3" cy="4" r="0.7" fill="${stroke}" fill-opacity="${op}"/><circle cx="11" cy="3" r="0.6" fill="${stroke}" fill-opacity="${op * 0.8}"/><circle cx="18" cy="6" r="0.75" fill="${stroke}" fill-opacity="${op}"/><circle cx="6" cy="12" r="0.65" fill="${stroke}" fill-opacity="${op * 0.85}"/><circle cx="14" cy="14" r="0.7" fill="${stroke}" fill-opacity="${op}"/><circle cx="19" cy="18" r="0.6" fill="${stroke}" fill-opacity="${op * 0.75}"/><circle cx="4" cy="19" r="0.7" fill="${stroke}" fill-opacity="${op}"/></svg>`
      );
    case "lattice":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0l24 24M24 0L0 24" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="0.8"/></svg>`
      );
    case "ripple":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="18" viewBox="0 0 36 18"><path d="M0 9c4-5 8-5 12 0s8 5 12 0 8-5 12 0" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="1"/><path d="M0 14c4-4 8-4 12 0s8 4 12 0 8-4 12 0" fill="none" stroke="${stroke}" stroke-opacity="${op * 0.65}" stroke-width="0.85"/></svg>`
      );
    case "confetti":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26"><rect x="3" y="4" width="2.2" height="2.2" rx="0.4" fill="${stroke}" fill-opacity="${op}" transform="rotate(18 4 5)"/><rect x="14" y="3" width="1.8" height="1.8" rx="0.3" fill="${stroke}" fill-opacity="${op * 0.75}" transform="rotate(-12 15 4)"/><rect x="20" y="12" width="2" height="2" rx="0.35" fill="${stroke}" fill-opacity="${op}" transform="rotate(25 21 13)"/><rect x="8" y="16" width="1.6" height="1.6" rx="0.3" fill="${stroke}" fill-opacity="${op * 0.8}"/><rect x="16" y="20" width="2.1" height="2.1" rx="0.4" fill="${stroke}" fill-opacity="${op * 0.7}" transform="rotate(-20 17 21)"/></svg>`
      );
    case "hatch":
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><path d="M0 3h18M0 9h18M0 15h18" fill="none" stroke="${stroke}" stroke-opacity="${op}" stroke-width="0.7"/></svg>`
      );
    default:
      return svgDataUri(
        `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="1.2" fill="${stroke}" fill-opacity="${op}"/></svg>`
      );
  }
}

export function renderWallpaperFromParams(params) {
  const p = params && typeof params === "object" ? params : {};
  return renderFamilySvg(p.family || "dots", p.color || "#64748b", p.opacity, p.size);
}

function wallpaperPresetDefs() {
  return [
    { key: "soft_grid", name: "Soft Grid", family: "grid", params: { family: "grid", color: "#64748b", opacity: 0.2, size: 18 } },
    { key: "paper_fiber", name: "Paper Fiber", family: "paper", params: { family: "paper", color: "#a16207", opacity: 0.2, size: 24 } },
    { key: "linen_weave", name: "Linen Weave", family: "textile", params: { family: "textile", color: "#a8a29e", opacity: 0.2, size: 16 } },
    { key: "marble_veins", name: "Marble Veins", family: "marble", params: { family: "marble", color: "#78716c", opacity: 0.18, size: 48 } },
    { key: "quiet_dots", name: "Quiet Dots", family: "dots", params: { family: "dots", color: "#64748b", opacity: 0.18, size: 20 } },
    { key: "rustic_plank", name: "Rustic Plank", family: "plank", params: { family: "plank", color: "#9a3412", opacity: 0.2, size: 40 } },
    { key: "diamond_plate", name: "Diamond Plate", family: "diamond", params: { family: "diamond", color: "#475569", opacity: 0.18, size: 24 } },
    { key: "coastal_waves", name: "Coastal Waves", family: "waves", params: { family: "waves", color: "#0e7490", opacity: 0.2, size: 40 } },
    { key: "stone_blocks", name: "Stone Blocks", family: "stone", params: { family: "stone", color: "#92400e", opacity: 0.18, size: 36 } },
    { key: "parchment_flecks", name: "Parchment Flecks", family: "flecks", params: { family: "flecks", color: "#a16207", opacity: 0.2, size: 28 } },
    { key: "soft_grain", name: "Soft Grain", family: "grain", params: { family: "grain", color: "#a78bfa", opacity: 0.16, size: 28 } },
    { key: "geo_diamonds", name: "Geo Diamonds", family: "geometric", params: { family: "geometric", color: "#475569", opacity: 0.18, size: 28 } },
    { key: "executive_lines", name: "Executive Lines", family: "executive", params: { family: "executive", color: "#334155", opacity: 0.16, size: 32 } },
    { key: "heritage_cross", name: "Heritage Cross", family: "heritage", params: { family: "heritage", color: "#78350f", opacity: 0.18, size: 32 } },
    { key: "soft_rings", name: "Soft Rings", family: "rings", params: { family: "rings", color: "#9a3412", opacity: 0.18, size: 30 } },
    { key: "stipple_dust", name: "Stipple Dust", family: "stipple", params: { family: "stipple", color: "#57534e", opacity: 0.18, size: 22 } },
    { key: "open_lattice", name: "Open Lattice", family: "lattice", params: { family: "lattice", color: "#78716c", opacity: 0.16, size: 24 } },
    { key: "ripple_lines", name: "Ripple Lines", family: "ripple", params: { family: "ripple", color: "#0e7490", opacity: 0.18, size: 36 } },
    { key: "confetti_specks", name: "Confetti Specks", family: "confetti", params: { family: "confetti", color: "#a16207", opacity: 0.18, size: 26 } },
    { key: "fine_hatch", name: "Fine Hatch", family: "hatch", params: { family: "hatch", color: "#64748b", opacity: 0.16, size: 18 } },
  ];
}

export const MENU_WALLPAPER_PRESETS = Object.freeze(
  wallpaperPresetDefs().map((def) => {
    const svg_data_uri = renderWallpaperFromParams(def.params);
    return Object.freeze({
      key: def.key,
      name: def.name,
      family: def.family,
      params: Object.freeze({ ...def.params }),
      svg_data_uri,
      source: "preset",
    });
  })
);

const PRESET_KEY_SET = new Set(MENU_WALLPAPER_PRESETS.map((p) => p.key));
export const MENU_WALLPAPER_PRESET_KEYS = Object.freeze(MENU_WALLPAPER_PRESETS.map((p) => p.key));

export function isPresetWallpaperKey(key) {
  if (key == null) return false;
  return PRESET_KEY_SET.has(String(key).trim());
}

export function getPresetWallpaper(key) {
  const k = String(key || "").trim();
  return MENU_WALLPAPER_PRESETS.find((p) => p.key === k) || null;
}

function isValidWallpaperKeyInput(raw, knownKeys = null) {
  if (raw === null || raw === undefined || raw === "") {
    return { ok: true, value: null };
  }
  const key = String(raw).trim();
  if (key === MENU_WALLPAPER_NONE) return { ok: true, value: MENU_WALLPAPER_NONE };
  if (knownKeys instanceof Set) {
    if (knownKeys.has(key) || isPresetWallpaperKey(key)) return { ok: true, value: key };
    return { ok: false, error: `Unknown menu_wallpaper_key: ${key}` };
  }
  if (isPresetWallpaperKey(key)) return { ok: true, value: key };
  if (/^[a-z0-9][a-z0-9_-]{1,80}$/.test(key)) return { ok: true, value: key, needsLookup: true };
  return { ok: false, error: "Invalid menu_wallpaper_key format" };
}

export function normalizeMenuWallpaperKeyInput(raw, knownKeys = null) {
  return isValidWallpaperKeyInput(raw, knownKeys);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomOpacity() {
  return pick([0.16, 0.17, 0.18, 0.19, 0.2, 0.21, 0.22]);
}

export function randomizeWallpaperParams(opts = {}) {
  const family = opts.family || pick(WALLPAPER_FAMILIES);
  const color = opts.color || pick(PRESET_STROKES);
  const opacity = clampOpacity(opts.opacity != null ? opts.opacity : randomOpacity());
  const size = opts.size || pick([16, 18, 20, 22, 24, 28, 32, 36, 40]);
  const seed = opts.seed != null ? Number(opts.seed) : Math.floor(Math.random() * 1e9);
  const serial = opts.serial != null ? Number(opts.serial) : Math.floor(Math.random() * 90) + 10;
  const familyTitle = FAMILY_DISPLAY_NAMES[family] || "Wallpaper";
  const name = `${familyTitle} ${String(serial).padStart(2, "0")}`;
  const slugBase = familyTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const key = opts.key || `${slugBase}_${serial}_${String(seed).slice(-4)}`;
  const params = { family, color, opacity, size, seed };
  const svg_data_uri = renderWallpaperFromParams(params);
  return {
    key,
    name,
    family,
    params,
    svg_data_uri,
    source: opts.source || "random",
  };
}

/**
 * Resolve the CSS backgroundImage pattern for Default menu chrome.
 */
export function resolveMenuPattern({ appearancePattern = null, wallpaperKey = null, bankEntry = null } = {}) {
  if (wallpaperKey === MENU_WALLPAPER_NONE) return null;
  if (wallpaperKey == null || wallpaperKey === "") {
    return appearancePattern || null;
  }
  if (bankEntry?.svg_data_uri) return bankEntry.svg_data_uri;
  const preset = getPresetWallpaper(wallpaperKey);
  if (preset) return preset.svg_data_uri;
  return appearancePattern || null;
}

export function catalogEntryFromRow(row) {
  if (!row) return null;
  return {
    key: row.key,
    name: row.name,
    family: row.family,
    params: row.params || {},
    svg_data_uri: row.svg_data_uri,
    source: row.source || "preset",
  };
}

export function buildPresetCatalog() {
  return MENU_WALLPAPER_PRESETS.map((p) => ({
    key: p.key,
    name: p.name,
    family: p.family,
    params: { ...p.params },
    svg_data_uri: p.svg_data_uri,
    source: "preset",
  }));
}

/** Appearance keys eligible for random chrome on new restaurants (exclude dark). */
export const RANDOM_APPEARANCE_POOL = Object.freeze([
  "modern_minimal",
  "classic_paper",
  "linen",
  "elegant",
  "contemporary",
  "rustic",
  "industrial",
  "coastal",
  "stone",
  "warm_paper",
  "soft_texture",
  "geometric",
  "executive",
  "heritage",
  "artisan",
]);

/**
 * Subtle wallpaper presets paired with each Menu Appearance (2–4 options).
 * Keys must exist in MENU_WALLPAPER_PRESET_KEYS.
 */
export const APPEARANCE_TO_WALLPAPER_POOL = Object.freeze({
  modern_minimal: ["soft_grid", "fine_hatch", "quiet_dots", "open_lattice"],
  classic_paper: ["paper_fiber", "parchment_flecks", "fine_hatch", "stipple_dust"],
  linen: ["linen_weave", "soft_grain", "fine_hatch", "quiet_dots"],
  elegant: ["marble_veins", "open_lattice", "soft_grain", "executive_lines"],
  contemporary: ["quiet_dots", "geo_diamonds", "soft_grid", "open_lattice"],
  rustic: ["rustic_plank", "parchment_flecks", "heritage_cross", "stipple_dust"],
  industrial: ["diamond_plate", "geo_diamonds", "soft_grid", "executive_lines"],
  coastal: ["coastal_waves", "ripple_lines", "quiet_dots", "soft_grain"],
  stone: ["stone_blocks", "marble_veins", "open_lattice", "heritage_cross"],
  warm_paper: ["parchment_flecks", "paper_fiber", "confetti_specks", "stipple_dust"],
  soft_texture: ["soft_grain", "soft_rings", "quiet_dots", "linen_weave"],
  geometric: ["geo_diamonds", "open_lattice", "diamond_plate", "soft_grid"],
  executive: ["executive_lines", "soft_grid", "fine_hatch", "open_lattice"],
  heritage: ["heritage_cross", "rustic_plank", "parchment_flecks", "stone_blocks"],
  artisan: ["soft_rings", "confetti_specks", "parchment_flecks", "rustic_plank"],
  dark: ["soft_grid", "fine_hatch", "executive_lines", "quiet_dots"],
});

let lastAssignedAppearance = null;
let lastAssignedWallpaper = null;

function pickAvoiding(pool, avoidKey) {
  const list = Array.isArray(pool) ? pool.filter(Boolean) : [];
  if (!list.length) return null;
  if (list.length === 1) return list[0];
  if (avoidKey == null || avoidKey === "") return pick(list);
  const filtered = list.filter((k) => k !== avoidKey);
  return pick(filtered.length ? filtered : list);
}

export function wallpaperPoolForAppearance(appearanceKey) {
  const mapped = APPEARANCE_TO_WALLPAPER_POOL[appearanceKey] || APPEARANCE_TO_WALLPAPER_POOL.modern_minimal;
  return mapped.filter((k) => isPresetWallpaperKey(k));
}

/**
 * Suggested wallpaper keys for picker (appearance family first).
 * @param {string} appearanceKey
 * @param {Array<{key:string}>} catalog
 * @returns {string[]}
 */
export function getSuggestedWallpaperKeysForAppearance(appearanceKey, catalog = null) {
  const suggested = wallpaperPoolForAppearance(appearanceKey || "modern_minimal");
  if (!Array.isArray(catalog) || !catalog.length) return suggested;
  const catalogKeys = new Set(catalog.map((e) => e && e.key).filter(Boolean));
  return suggested.filter((k) => catalogKeys.has(k));
}

/**
 * Sort wallpaper catalog: suggested-for-appearance first, then remainder.
 */
export function sortWallpapersForAppearance(catalog, appearanceKey) {
  const list = Array.isArray(catalog) ? catalog.slice() : [];
  const suggested = new Set(getSuggestedWallpaperKeysForAppearance(appearanceKey, list));
  const first = list.filter((e) => suggested.has(e.key));
  const rest = list.filter((e) => !suggested.has(e.key));
  return [...first, ...rest];
}

/**
 * Type-scoped chrome pick for new restaurants/menus.
 * Random within restaurant-type appearance pool + matching wallpaper pool.
 * Best-effort consecutive-duplicate avoidance for create bursts.
 *
 * @param {{ category?: string|null, cuisine?: string|null, avoidAppearanceKey?: string|null, avoidWallpaperKey?: string|null }} [opts]
 */
export function pickMenuChromeForRestaurant(opts = {}) {
  const avoidAppearance =
    opts.avoidAppearanceKey !== undefined ? opts.avoidAppearanceKey : lastAssignedAppearance;
  const avoidWallpaper =
    opts.avoidWallpaperKey !== undefined ? opts.avoidWallpaperKey : lastAssignedWallpaper;

  const appearancePool = getTypeScopedAppearancePool(opts.category, opts.cuisine);
  let menu_appearance_key = pickAvoiding(appearancePool, avoidAppearance);
  if (!menu_appearance_key) {
    menu_appearance_key = pick(RANDOM_APPEARANCE_POOL);
  }

  const wallPool = wallpaperPoolForAppearance(menu_appearance_key);
  let menu_wallpaper_key = pickAvoiding(wallPool, avoidWallpaper);
  if (!menu_wallpaper_key) {
    menu_wallpaper_key = pick(MENU_WALLPAPER_PRESET_KEYS);
  }

  lastAssignedAppearance = menu_appearance_key;
  lastAssignedWallpaper = menu_wallpaper_key;

  return {
    menu_appearance_key,
    menu_wallpaper_key,
  };
}

/**
 * Pick Menu Appearance + Wallpaper for newly created restaurants/menus.
 * Prefer type-scoped pools when category/cuisine provided; else type-default pool.
 * @param {{ category?: string|null, cuisine?: string|null } | string} [categoryOrOpts]
 * @param {string|null} [cuisine]
 */
export function pickRandomMenuChromeDefaults(categoryOrOpts, cuisine) {
  if (
    categoryOrOpts != null &&
    typeof categoryOrOpts === "object" &&
    !Array.isArray(categoryOrOpts)
  ) {
    return pickMenuChromeForRestaurant(categoryOrOpts);
  }
  if (categoryOrOpts != null || cuisine != null) {
    return pickMenuChromeForRestaurant({ category: categoryOrOpts, cuisine });
  }
  return pickMenuChromeForRestaurant({});
}


import { buildMenuAppearanceRootStyle, getMenuAppearanceTokens } from "./menuAppearances.js";

/**
 * Build Default menu root style with optional wallpaper pattern override.
 * wallpaperKey: null = inherit appearance pattern; "none" = solid; bank key = override.
 */
export function buildMenuChromeRootStyle(appearanceKey, wallpaperKey = null, bankEntry = null) {
  const base = buildMenuAppearanceRootStyle(appearanceKey);
  const appearancePattern = getMenuAppearanceTokens(appearanceKey).backgroundPattern;
  const pattern = resolveMenuPattern({
    appearancePattern,
    wallpaperKey,
    bankEntry,
  });
  if (pattern === null && wallpaperKey === MENU_WALLPAPER_NONE) {
    return {
      ...base,
      backgroundImage: "none",
      "--menu-pattern": "none",
    };
  }
  if (pattern && pattern !== appearancePattern) {
    return {
      ...base,
      backgroundImage: pattern,
      "--menu-pattern": pattern,
    };
  }
  return base;
}

export function lookupWallpaperInCatalog(catalog, key) {
  if (key == null || key === "" || key === MENU_WALLPAPER_NONE) return null;
  const list = Array.isArray(catalog) ? catalog : [];
  return list.find((e) => e && e.key === key) || getPresetWallpaper(key);
}
