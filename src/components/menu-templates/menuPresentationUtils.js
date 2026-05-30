/**
 * Shared helpers for data-driven menu templates (no presentation markup).
 */

export function normalizeMenuStyle(raw) {
  const s = String(raw || "").toLowerCase().trim();
  if (s === "v2" || s === "modern" || s === "cinematic") return "v2";
  if (s === "v3" || s === "takeout" || s === "conversion") return "v3";
  if (s === "v4" || s === "bold-casual" || s === "bold_casual" || s === "casual") return "v4";
  if (s === "v5" || s === "refined-editorial" || s === "editorial" || s === "upscale") return "v5";
  if (s === "v6" || s === "premium-bistro" || s === "premium_bistro" || s === "bistro") return "v6";
  if (s === "v1" || s === "classic") return "v1";
  return "v1";
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
