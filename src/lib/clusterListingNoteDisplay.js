/**
 * Cluster restaurant card listing notes (short consumer chrome only).
 * Internal seed audit text (SOURCE STATUS: …) must never render on cards.
 */

const SOURCE_STATUS_RE = /^source\s*status\s*:/i;
const MAX_LISTING_NOTE_CHARS = 72;

/**
 * @param {unknown} raw
 * @returns {string|null}
 */
export function formatClusterListingNoteForDisplay(raw) {
  const note = String(raw || "").trim();
  if (!note) return null;
  if (SOURCE_STATUS_RE.test(note)) return null;
  if (/not a confirmed 2027/i.test(note) && note.length > 48) return null;
  if (note.length <= MAX_LISTING_NOTE_CHARS) return note;
  return `${note.slice(0, MAX_LISTING_NOTE_CHARS - 1).trimEnd()}…`;
}
