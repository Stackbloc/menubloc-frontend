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
    return "Platform clip";
  }

  if (row.is_guest || creatorType === "guest") {
    return "Guest clip";
  }

  const labels = {
    deal: "Deal",
    venue: "Venue",
    restaurant: "Restaurant",
    diner: "Diner",
  };

  // A diner account: their screen name (Andre 2026-11-04), "Diner" when they haven't set one.
  if (creatorType === "diner" && row.creator_display_name) return String(row.creator_display_name);

  return labels[creatorType] || row.creator_type || "—";
}

/** Public profile of the diner who posted the clip, or null (guests, restaurants, platform). */
export function ownerVideoCreatorProfilePath(row) {
  const kind = String(row?.creator_type || "").toLowerCase();
  const id = Number(row?.creator_user_id);
  if (kind !== "diner" || row?.is_guest || !Number.isInteger(id) || id <= 0) return null;
  return `/diners/${id}`;
}
