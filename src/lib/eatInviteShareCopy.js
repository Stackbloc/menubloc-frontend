/**
 * Invite to Eat share / compose copy helpers.
 * Draft options (LDL/LDD/LHC/MMH + light emoji) are selectable copy, not a glossary feature.
 */

export const INVITE_MESSAGE_SEED_CODES = ["LDL", "LDD", "LHC", "MMH"];

export const INVITE_COPY_SEEDS = {
  LHC: { code: "LHC", emoji: "☕", verbPhrase: "Let's have coffee", meal: "coffee" },
  LDL: { code: "LDL", emoji: "🥗", verbPhrase: "Let's do lunch", meal: "lunch" },
  LDD: { code: "LDD", emoji: "🍽️", verbPhrase: "Let's do dinner", meal: "dinner" },
  MMH: { code: "MMH", emoji: "📍", verbPhrase: "Meet me here", meal: "meet" },
};

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

function hourFromTimeLabelOrRaw(timeLabel, scheduledTime) {
  const fromRaw = String(scheduledTime || "").trim().match(/^(\d{1,2})/);
  if (fromRaw) {
    const h = Number(fromRaw[1]);
    if (Number.isFinite(h) && h >= 0 && h <= 23) return h;
  }
  const label = String(timeLabel || "").trim().toLowerCase();
  if (!label) return null;
  const m = label.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (!Number.isFinite(h) || h < 0 || h > 23) return null;
  return h;
}

/**
 * Default seed from scheduled hour (used when opening compose).
 */
export function pickInviteCopySeed({ scheduledTime = null, timeLabel = null } = {}) {
  const hour = hourFromTimeLabelOrRaw(timeLabel, scheduledTime);
  if (hour != null && hour >= 7 && hour <= 10) return INVITE_COPY_SEEDS.LHC;
  if (hour != null && hour >= 11 && hour <= 15) return INVITE_COPY_SEEDS.LDL;
  if (hour != null && hour >= 16 && hour <= 22) return INVITE_COPY_SEEDS.LDD;
  return INVITE_COPY_SEEDS.MMH;
}

function resolveSeed(seedCode, scheduledTime, timeLabel) {
  const code = String(seedCode || "").trim().toUpperCase();
  if (INVITE_COPY_SEEDS[code]) return INVITE_COPY_SEEDS[code];
  return pickInviteCopySeed({ scheduledTime, timeLabel });
}

/**
 * Draft message body for a given seed code (no URL).
 */
export function buildEatInviteMessageDraft({
  inviteKind = "group",
  restaurantName,
  dateLabel,
  timeLabel,
  scheduledTime = null,
  seedCode = null,
} = {}) {
  const place = restaurantName || "a restaurant";
  const when = whenParts(dateLabel, timeLabel);
  const seed = resolveSeed(seedCode, scheduledTime, timeLabel);
  const kind = String(inviteKind || "group").toLowerCase() === "private" ? "private" : "group";

  if (seed.code === "MMH") {
    const whenLine = [when.date, when.time].filter(Boolean).join(" · ");
    return [`${seed.code} ${seed.emoji} — Meet me here.`, place, whenLine].filter(Boolean).join("\n");
  }

  const whenClause = when.joined ? ` ${when.joined}` : "";
  if (kind === "private") {
    return `${seed.code} ${seed.emoji} — ${seed.verbPhrase} at ${place}${whenClause}.`;
  }
  return `${seed.code} ${seed.emoji} — ${seed.verbPhrase} at ${place}${whenClause}. Who wants to join me?`;
}

/**
 * Radio options for compose: each seed draft + write-your-own sentinel.
 */
export function listInviteMessageOptions({
  inviteKind = "group",
  restaurantName,
  dateLabel,
  timeLabel,
  scheduledTime = null,
} = {}) {
  return INVITE_MESSAGE_SEED_CODES.map((code) => ({
    code,
    text: buildEatInviteMessageDraft({
      inviteKind,
      restaurantName,
      dateLabel,
      timeLabel,
      scheduledTime,
      seedCode: code,
    }),
  }));
}

/**
 * ShareModal body. Prefer an explicit message (selected radio / write-your-own).
 */
export function buildEatInviteShareText({
  inviteKind = "group",
  restaurantName,
  dateLabel,
  timeLabel,
  scheduledTime = null,
  seedCode = null,
  message = null,
  url,
}) {
  const custom = String(message || "").trim();
  const draft =
    custom ||
    buildEatInviteMessageDraft({
      inviteKind,
      restaurantName,
      dateLabel,
      timeLabel,
      scheduledTime,
      seedCode,
    });
  const link = String(url || "").trim();
  if (!link) return draft;
  return `${draft}\n${link}`.trim();
}
