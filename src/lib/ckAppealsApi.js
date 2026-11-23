// CK moderation appeals (plan 73 PM1b, 2026-11-23). BE: POST /api/ck/moderation/appeals (diner),
// GET + POST /api/owner/ck/moderation/appeals (Owner → Reports). CK re-decides the text itself; an
// overturned appeal never publishes the text (it feeds the next terms version).
import { apiPost } from "./api.js";
import { OWNER_API_BASE } from "./ownerApi.js";
import { apiErrorFromResponse } from "./apiErrorDisplay.js";

// Blocks a diner may ask CK to look at again. Form errors (empty, too long, size) are not appeals.
const APPEALABLE = new Set(["threat", "hateful", "garbled", "no_contact", "no_links", "repeated"]);

/** "wall_threat" (Wall) or "custom_vibe_threat" (My Vibe) → true. */
export function isAppealableCode(code) {
  const m = /^(?:wall_|custom_vibe_)(.+)$/.exec(String(code || ""));
  return Boolean(m && APPEALABLE.has(m[1]));
}

/** { surface: "wall" | "vibe", text, size?, caption? } → { appeal: { id, already } } */
export function createCkAppeal({ surface, text, size, caption, message }) {
  return apiPost("/api/ck/moderation/appeals", { surface, text, size, caption: Boolean(caption), message: message || null });
}

const OWNER_BASE = `${OWNER_API_BASE}/api/owner/ck/moderation/appeals`;

export async function getOwnerCkAppeals(status = "open") {
  const res = await fetch(`${OWNER_BASE}?status=${encodeURIComponent(status)}`, { credentials: "include" });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}

/** outcome: "upheld" (the block was right) | "overturned" (the dictionary is wrong) */
export async function resolveOwnerCkAppeal(id, outcome, note = null) {
  const res = await fetch(`${OWNER_BASE}/${encodeURIComponent(id)}/resolve`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outcome, note }),
  });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}
