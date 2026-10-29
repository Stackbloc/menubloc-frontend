/**
 * Quick Invite "Who's it for?" (Andre 2026-10-29, same as the app): typing checks your Connects.
 * A Connect can get the invite in Menuply or by text; anyone else gets it by text.
 */

/** Accepted Connects from GET /api/consumer/connections as { id, name }, sorted by name. */
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
      return Number.isInteger(id) && id > 0 ? { id, name } : null;
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
