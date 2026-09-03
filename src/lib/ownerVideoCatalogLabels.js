/**
 * Owner Video Manager — human-readable creator labels.
 * Platform video = owner upload via Video Manager (managed kind).
 * Guest video = anonymous guest Feed upload only — not owner uploads.
 */

export function formatOwnerVideoCreatorLabel(row) {
  if (!row) return "—";

  const kind = String(row.video_kind || "").toLowerCase();
  const creatorType = String(row.creator_type || "").toLowerCase();

  if (kind === "managed" || creatorType === "platform") {
    return "Platform video";
  }

  if (row.is_guest || creatorType === "guest") {
    return "Guest video";
  }

  const labels = {
    deal: "Deal",
    venue: "Venue",
    restaurant: "Restaurant",
    diner: "Diner",
  };

  return labels[creatorType] || row.creator_type || "—";
}
