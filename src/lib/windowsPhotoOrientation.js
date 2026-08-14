/**
 * Page-level Windows / Photos strip orientation for public restaurant profiles.
 * Defaults to portrait. Landscape is opt-in via restaurant_brand_settings.
 */

export const WINDOWS_PHOTO_ORIENTATIONS = Object.freeze(["portrait", "landscape"]);

export function normalizeWindowsPhotoOrientation(value) {
  const raw = String(value || "").trim().toLowerCase();
  return raw === "landscape" ? "landscape" : "portrait";
}

/** Aspect-ratio CSS for the Windows carousel frame. */
export function windowsFrameAspectRatio(orientation) {
  return normalizeWindowsPhotoOrientation(orientation) === "landscape" ? "16 / 9" : "3 / 4";
}

/**
 * Photos strip tile size. Landscape keeps the historical wide tiles;
 * portrait tiles are taller than wide.
 */
export function windowsPhotoStripTileSize({ orientation, isMobile = false, embedded = false }) {
  const isLandscape = normalizeWindowsPhotoOrientation(orientation) === "landscape";
  if (isLandscape) {
    const tileW = embedded ? (isMobile ? 132 : 168) : isMobile ? 168 : 260;
    const tileH = embedded ? (isMobile ? 99 : 126) : isMobile ? 126 : 180;
    return { tileW, tileH };
  }
  const tileW = embedded ? (isMobile ? 110 : 140) : isMobile ? 132 : 168;
  const tileH = Math.round((tileW * 4) / 3);
  return { tileW, tileH };
}
