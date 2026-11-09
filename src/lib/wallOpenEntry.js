const STATE_ENTRIES = new Set(["direct", "menuply", "shared_post"]);

/**
 * How someone reached the full Wall → wall_open subtype. A Menuply screen's navigation state wins;
 * otherwise a printed QR (?ref=qr) is "qr" and anything else (typed URL, social link) is "direct".
 */
export function wallOpenEntry({ wallEntry, fromMenuply = false, search = "" } = {}) {
  if (STATE_ENTRIES.has(wallEntry)) return wallEntry;
  if (fromMenuply) return "menuply";
  return new URLSearchParams(search).get("ref") === "qr" ? "qr" : "direct";
}
