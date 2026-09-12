/**
 * Local staging for My Highlights before POST /api/consumer/profile/media.
 * Picking a file must not upload or leave the camera overlay mounted.
 */

export function isHighlightVideoFile(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type.startsWith("video/")) return true;
  if (type.startsWith("image/")) return false;
  return /\.(mp4|mov|webm|m4v|qt)$/i.test(String(file?.name || ""));
}

export function createPendingHighlight(file) {
  const previewUrl = URL.createObjectURL(file);
  return {
    key: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    file,
    previewUrl,
    isVideo: isHighlightVideoFile(file),
  };
}

export function revokePendingHighlight(item) {
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
}

export function revokePendingHighlights(list = []) {
  for (const item of list) revokePendingHighlight(item);
}

export function pendingHighlightsToCards(pending = []) {
  return pending.map((row) => ({
    key: row.key,
    pending: true,
    kind: "pending_highlight",
    deleteKind: "pending_highlight",
    media_kind: row.isVideo ? "video" : "photo",
    label: "Not saved yet",
    image: row.isVideo ? null : row.previewUrl,
    videoUrl: row.isVideo ? row.previewUrl : undefined,
  }));
}

export function restoreDocumentScroll() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  document.body.style.pointerEvents = "";
  document.documentElement.style.pointerEvents = "";
  // Feed reel (and DealVideoSwipe) set touchAction=none on body; if cleanup races
  // with route change, NavLinks look dead while <button> Share My QR still works.
  document.body.style.touchAction = "";
  document.documentElement.style.touchAction = "";
}

/** Sheets listen and force-close when Edit·Connect / nav need the UI back. */
export const CLEAR_STUCK_MEDIA_CHROME_EVENT = "menuply:clear-stuck-media-chrome";

/**
 * Clear leftover media-sheet scroll locks and force-close camera/compose overlays
 * that freeze nav / Edit·Connect (z-index 13000 leftovers).
 */
export function clearStuckMediaChrome() {
  restoreDocumentScroll();
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(CLEAR_STUCK_MEDIA_CHROME_EVENT));
  } catch {
    /* ignore */
  }
}
