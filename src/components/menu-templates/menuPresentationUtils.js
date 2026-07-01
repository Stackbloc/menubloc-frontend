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
  if (s === "v2" || s === "modern" || s === "cinematic") return "v2";
  if (s === "v3" || s === "takeout" || s === "conversion") return "v3";
  if (s === "v4" || s === "bold-casual" || s === "bold_casual" || s === "casual") return "v4";
  if (s === "v5" || s === "refined-editorial" || s === "editorial" || s === "upscale") return "v5";
  if (s === "v6" || s === "premium-bistro" || s === "premium_bistro" || s === "bistro") return "v6";
  if (s === "v7" || s === "chalkboard" || s === "street" || s === "food-truck") return "v7";
  if (s === "v8" || s === "italian" || s === "pizza" || s === "rustic-italian") return "v8";
  if (s === "v9" || s === "asian" || s === "sushi" || s === "modern-asian") return "v9";
  if (s === "v10" || s === "refined-dark") return "v10";
  if (s === "v11" || s === "editorial-refresh") return "v11";
  if (s === "v12" || s === "editorial-dark") return "v12";
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
