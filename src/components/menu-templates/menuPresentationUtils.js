/**
 * Shared helpers for data-driven menu templates (no presentation markup).
 */

import { useEffect, useState } from "react";

/**
 * True for iPad-range viewports (768–1024px). Independent of the page-level
 * `isMobile` hook (900px cutoff) so templates can apply a distinct spacing
 * tier for tablets instead of inheriting phone or desktop spacing.
 */
export function useIsTabletRange(min = 768, max = 1024) {
  const [isTablet, setIsTablet] = useState(
    typeof window !== "undefined" ? window.innerWidth >= min && window.innerWidth <= max : false
  );
  useEffect(() => {
    function onResize() {
      setIsTablet(window.innerWidth >= min && window.innerWidth <= max);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [min, max]);
  return isTablet;
}

export function normalizeMenuStyle(raw) {
  const s = String(raw || "").toLowerCase().trim();
  // v2-v10: retired boutique layouts. Numeric keys kept recognizable (so old
  // links don't 404-equivalent) but no longer carry their old word aliases —
  // those words now point at the current concept variants below.
  if (s === "v2") return "v2";
  if (s === "v3") return "v3";
  if (s === "v4") return "v4";
  if (s === "v5") return "v5";
  if (s === "v6") return "v6";
  if (s === "v7") return "v7";
  if (s === "v8") return "v8";
  if (s === "v9") return "v9";
  if (s === "v10") return "v10";
  if (s === "v11" || s === "editorial-refresh") return "v11";
  if (s === "v12" || s === "editorial-dark" || s === "modern-dark" || s === "dark") return "v12";
  if (s === "v13" || s === "steakhouse" || s === "fine-dining" || s === "editorial-steakhouse") return "v13";
  if (s === "v14" || s === "qsr" || s === "fast-casual" || s === "quick-service") return "v14";
  if (s === "v15" || s === "casual" || s === "family-diner" || s === "family" || s === "diner") return "v15";
  if (s === "v16" || s === "brand-tint" || s === "brandtint" || s === "tinted") return "v16";
  if (s === "v1" || s === "classic") return "v1";
  return "v1";
}

/**
 * Map retired boutique style IDs (v2–v10) to the current editorial templates so
 * restaurants that still have legacy menu_style values render coherently.
 */
export function resolveTemplateMenuStyle(raw) {
  const style = normalizeMenuStyle(raw);
  if (style === "v4" || style === "v10") return "v13";
  if (style === "v6" || style === "v7") return "v12";
  if (style === "v3") return "v14";
  if (style === "v5") return "v15";
  if (style === "v2" || style === "v8" || style === "v9") return "v1";
  if (style === "v16") return "v1";
  return style;
}

/**
 * Initials shown in the logo placeholder when a restaurant has no logo image.
 * First letters of the first two words; for a single-word name, the first
 * two letters of that word.
 */
const LEADING_ARTICLE_RE = /^(the|a|an)\s+/i;

export function getRestaurantInitials(name) {
  const cleaned = String(name || "").trim().replace(LEADING_ARTICLE_RE, "");
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return "";
}

/** Optional hero visual — populated when backend sends URLs; otherwise templates use gradient fallback. */
export function pickHeroImageUrl(menuPayload) {
  if (!menuPayload || typeof menuPayload !== "object") return null;
  return (
    menuPayload.hero_image_url ||
    menuPayload.cover_image_url ||
    menuPayload.banner_image_url ||
    menuPayload.hero_image ||
    null
  );
}

/** Trailing action column on editorial menu rows — header icons use the same grid. */
export const MENU_ROW_OUTER_GAP = 10;
export const MENU_ROW_ICON_GAP = 10;
export const MENU_ROW_HEADER_ICON_GAP = 10;
/** Keeps like/share from clipping past the right screen edge on narrow viewports. */
export const MENU_ROW_ACTIONS_INSET_RIGHT = 6;
export const MENU_ROW_ICON_SIZE = 28;
export const MENU_ROW_PRICE_MIN_WIDTH = 56;
