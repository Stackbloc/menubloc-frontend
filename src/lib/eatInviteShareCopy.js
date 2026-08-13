/**
 * Invite to Eat share copy — private (1:1) vs group outing.
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

function whenParts(dateLabel, timeLabel) {
  const date = String(dateLabel || "").trim();
  const time = String(timeLabel || "").trim();
  if (date && time) return { date, time, joined: `${date} at ${time}` };
  if (date) return { date, time: "", joined: date };
  if (time) return { date: "", time, joined: time };
  return { date: "", time: "", joined: "" };
}

/**
 * Default editable ShareModal body.
 * private: "Want to grab dinner at X with me DATE at TIME?"
 * group: "I'm getting dinner at X DATE at TIME. Who wants to join me?"
 */
export function buildEatInviteShareText({
  inviteKind = "group",
  restaurantName,
  dateLabel,
  timeLabel,
  url,
}) {
  const place = restaurantName || "a restaurant";
  const when = whenParts(dateLabel, timeLabel);
  const link = url || "";
  const kind = String(inviteKind || "group").toLowerCase() === "private" ? "private" : "group";

  if (kind === "private") {
    const whenClause = when.joined ? ` ${when.joined}` : "";
    return `Want to grab dinner at ${place} with me${whenClause}? ${link}`.trim();
  }

  const whenClause = when.joined ? ` ${when.joined}` : "";
  return `I'm getting dinner at ${place}${whenClause}. Who wants to join me? ${link}`.trim();
}
