/**
 * Join Me picker: accepted Connections plus people with a pending Invite to Eat.
 * Guests without accounts cannot be selected.
 */

export function buildJoinMeCandidates({ connections = [], pendingInvites = [] } = {}) {
  const seen = new Set();
  const people = [];

  function add(id, displayName, source) {
    const n = Number(id);
    if (!n || seen.has(n)) return;
    seen.add(n);
    people.push({
      id: n,
      display_name: String(displayName || "").trim() || "Diner",
      source,
    });
  }

  for (const row of connections) {
    add(row?.peer?.id || row?.id, row?.peer?.display_name || row?.display_name, "connection");
  }
  for (const row of pendingInvites) {
    add(row?.id, row?.display_name, "invite");
  }
  return people;
}
