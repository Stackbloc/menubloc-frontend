/**
 * Quick Invite "Who's it for?" (Andre 2026-10-29, same as the app): typing checks your Connects.
 * A Connect can get the invite in Menuply or by text; anyone else gets it by text.
 *
 * Since 2026-11-13 (app quickInvitePick.ts, OTA b2d23b2) step 1 is a checklist: every Connect with a
 * round check and a fav cue ("Favs pancakes, tacos"), "Open Invite · All my Connects" checks them all,
 * Next (n) › goes to step 2. The web has no phone contacts, so anyone else is a typed name who gets the
 * link through the share sheet.
 */

/** Accepted Connects from GET /api/consumer/connections as { id, name, avatarUrl, favoriteFoods }, sorted by name. */
export function connectPeersFromResponse(body) {
  const list = Array.isArray(body?.accepted) ? body.accepted : [];
  return list
    .map((c) => {
      const p = c?.peer || {};
      const id = Number(p.id);
      const name =
        String(p.display_name || "").trim() ||
        [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
        "Menuply diner";
      if (!Number.isInteger(id) || id <= 0) return null;
      const favoriteFoods = (Array.isArray(p.favorite_foods) ? p.favorite_foods : [])
        .map((f) => String((f && typeof f === "object" ? f.label : f) || "").trim())
        .filter(Boolean);
      return { id, name, avatarUrl: p.avatar_url ? String(p.avatar_url) : null, favoriteFoods };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
}

/** Connects with a name word starting with what's typed ("ma" → Maya Lee, Sam Martin). */
export function matchConnectPeers(peers, typed, max = 6) {
  const q = String(typed || "").trim().toLowerCase();
  if (!q) return [];
  return (peers || [])
    .filter((p) => {
      const n = p.name.toLowerCase();
      return n.startsWith(q) || n.split(/\s+/).some((w) => w.startsWith(q));
    })
    .slice(0, max);
}

/** The server sends to at most 20 Connects per request (sendInviteToConnects MAX_RECIPIENTS). */
export const SEND_BATCH = 20;

export function chunk(rows, size = SEND_BATCH) {
  const out = [];
  for (let i = 0; i < (rows || []).length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/** The line under a Connect's name: "Favs pancakes, tacos", or nothing. No vibes here (Andre 2026-11-13). */
export function connectCue(peer) {
  const foods = (peer?.favoriteFoods || []).map((f) => String(f).trim()).filter(Boolean).slice(0, 2);
  return foods.length ? `Favs ${foods.map((f) => f.toLowerCase()).join(", ")}` : "";
}

const first = (name) => String(name || "").trim().split(/\s+/)[0] || name;

/**
 * Who the invite names: "Maya Lee", "Maya and Leo", "Maya, Leo and 3 others", "all your Connects".
 * `group` = { connects: [{ userId, name }], contacts: [{ id, name }], allConnects? }.
 */
export function groupName(group) {
  const connects = group?.connects || [];
  const contacts = group?.contacts || [];
  const names = [...connects.map((c) => c.name), ...contacts.map((c) => c.name)];
  if (group?.allConnects && !contacts.length) return "all your Connects";
  if (group?.allConnects) return `all your Connects and ${contacts.length === 1 ? contacts[0].name : `${contacts.length} others`}`;
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${first(names[0])} and ${first(names[1])}`;
  return `${first(names[0])}, ${first(names[1])} and ${names.length - 2} other${names.length - 2 === 1 ? "" : "s"}`;
}

/**
 * Quick Invite "What for?" (app QuickInviteCard QUICK_INVITES, Andre 2026-11-13): meals first, then
 * coffee, drinks and Meet me here. Each code presets the invite message.
 */
export const QUICK_INVITES = [
  { code: "LDB", phrase: "Let's do breakfast", label: "Breakfast" },
  { code: "LBR", phrase: "Let's do brunch", label: "Brunch" },
  { code: "LDL", phrase: "Let's do lunch", label: "Lunch" },
  { code: "LDD", phrase: "Let's do dinner", label: "Dinner" },
  { code: "LLN", phrase: "Let's do late night", label: "Late night" },
  { code: "LHC", phrase: "Let's have coffee", label: "Coffee" },
  { code: "LGD", phrase: "Let's get drinks", label: "Drinks" },
  { code: "MMH", phrase: "Meet me here", label: "Meet me here" },
];

export function quickInviteFor(code) {
  const c = String(code || "").trim().toUpperCase();
  return QUICK_INVITES.find((q) => q.code === c) || null;
}
