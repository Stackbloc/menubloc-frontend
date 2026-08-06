/**
 * Menu Lab → public menu Preview URL builder.
 * Draft selections must travel as query overrides; Preview must never rely on Save alone.
 */
import {
  isValidMenuAppearanceKey,
  shouldApplyMenuAppearance,
} from "./menuAppearances.js";
import { resolveEffectiveMenuAppearance } from "./menuAppearanceRecommendation.js";

/**
 * @param {string|number} restaurantId
 * @param {{
 *   menuStyle?: string,
 *   menuAppearanceKey?: string|null,
 *   menuWallpaperKey?: string|null,
 *   category?: string,
 *   cuisine?: string,
 *   designEdit?: boolean,
 *   primaryColor?: string|null,
 *   accentColor?: string|null,
 *   backgroundStyle?: string|null,
 * }} opts
 */
export function buildMenuLabPreviewPath(restaurantId, opts = {}) {
  const rid = encodeURIComponent(String(restaurantId));
  const menuStyle = String(opts.menuStyle || "v1").trim() || "v1";
  const params = new URLSearchParams();
  params.set("menuStyle", menuStyle);
  if (opts.designEdit !== false) params.set("designEdit", "1");

  if (shouldApplyMenuAppearance(menuStyle)) {
    const effective = resolveEffectiveMenuAppearance({
      menu_appearance_key: opts.menuAppearanceKey ?? null,
      category: opts.category || "",
      cuisine: opts.cuisine || "",
    });
    params.set("menuAppearance", effective);
    if (opts.menuWallpaperKey != null && opts.menuWallpaperKey !== "") {
      params.set("menuWallpaper", String(opts.menuWallpaperKey).trim());
    }
  } else if (opts.backgroundStyle) {
    params.set("backgroundStyle", String(opts.backgroundStyle).trim());
  }

  if (opts.primaryColor) params.set("primaryColor", String(opts.primaryColor).trim());
  if (opts.accentColor) params.set("accentColor", String(opts.accentColor).trim());

  return `/restaurants/${rid}/menu?${params.toString()}`;
}

/** Valid Menu Appearance override from public menu query string. */
export function readMenuAppearanceQueryOverride(searchParams) {
  if (!searchParams || typeof searchParams.get !== "function") return null;
  const raw = searchParams.get("menuAppearance") || searchParams.get("previewAppearance");
  if (!isValidMenuAppearanceKey(raw)) return null;
  return String(raw).trim();
}

/** Menu Wallpaper override from public menu query string (bank key or "none"). */
export function readMenuWallpaperQueryOverride(searchParams) {
  if (!searchParams || typeof searchParams.get !== "function") return undefined;
  const raw = searchParams.get("menuWallpaper") || searchParams.get("previewWallpaper");
  if (raw == null || raw === "") return undefined;
  const v = String(raw).trim();
  if (!v) return undefined;
  if (v === "none") return "none";
  if (/^[a-z0-9][a-z0-9_-]{1,80}$/.test(v)) return v;
  return undefined;
}

export function readPreviewColorOverride(searchParams, key) {
  if (!searchParams || typeof searchParams.get !== "function") return null;
  const raw = searchParams.get(key);
  if (!raw || typeof raw !== "string") return null;
  const v = raw.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return null;
  return v;
}

export function readPreviewBackgroundStyleOverride(searchParams) {
  if (!searchParams || typeof searchParams.get !== "function") return null;
  const raw = searchParams.get("backgroundStyle");
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  const allowed = new Set(["dark", "light", "paper", "chalkboard", "charcoal"]);
  return allowed.has(v) ? v : null;
}
