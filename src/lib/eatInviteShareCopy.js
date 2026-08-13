/**
 * Shared outing share copy for Invite to Eat (ShareModal text).
 * Group-oriented by default — not 1:1 “X invited you…”.
 */

export function formatInviteDateLabel(isoDate) {
  if (!isoDate) return "";
  const raw = String(isoDate).trim();
  const ymd = raw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || null;
  try {
    const d = ymd ? new Date(`${ymd}T12:00:00`) : new Date(raw);
    if (Number.isNaN(d.getTime())) return ymd || raw;
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return ymd || raw;
  }
}

export function formatInviteTimeLabel(time) {
  if (!time) return "";
  const parts = String(time).split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] || 0);
  if (!Number.isFinite(h)) return time;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * Default editable ShareModal body for a shared outing link.
 */
export function buildEatInviteShareText({
  restaurantName,
  dateLabel,
  timeLabel,
  menuItemName,
  url,
}) {
  const place = restaurantName || "a restaurant";
  const when = [dateLabel, timeLabel].filter(Boolean).join(" at ");
  const whenPart = when ? ` ${when}` : "";
  const dish = menuItemName ? ` Trying the ${menuItemName}.` : "";
  return `Let's grab dinner at ${place}${whenPart}.${dish} Join us: ${url || ""}`;
}
