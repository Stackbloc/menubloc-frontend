/**
 * Shared overflow-safe styles for dish photos (Phase 1A uploads are cover-cropped).
 * Intrinsic pixel size must never escape the sized parent.
 */

export const DISH_PHOTO_COVER_IMG_STYLE = {
  width: "100%",
  height: "100%",
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "cover",
  display: "block",
};

/** Compact sticky-hero / list thumb sizes (matches MenuItemDetailPage). */
export function dishPhotoThumbBoxStyle({
  isMobile = false,
  sizeMobile = 101,
  sizeDesktop = 129,
  borderRadius = 16,
  border = "1px solid var(--gb-color-border)",
  background = "var(--gb-color-surface)",
} = {}) {
  const size = isMobile ? sizeMobile : sizeDesktop;
  return {
    flexShrink: 0,
    width: size,
    height: size,
    borderRadius,
    overflow: "hidden",
    border,
    background,
    minWidth: 0,
  };
}
