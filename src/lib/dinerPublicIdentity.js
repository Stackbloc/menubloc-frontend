function trimName(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return trimName(value).toLowerCase().replace(/\s+/g, " ");
}

function formatFirstLastInitial(firstName, lastName) {
  const first = trimName(firstName);
  const last = trimName(lastName);
  if (first && last) return `${first} ${last.charAt(0).toUpperCase()}.`.slice(0, 40);
  if (first) return first.slice(0, 40);
  return "";
}

function formatNamePartsFromDisplay(displayName) {
  const parts = trimName(displayName).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 40);
  return formatFirstLastInitial(parts[0], parts[parts.length - 1]);
}

/**
 * Public diner label — screen name when distinct from legal name, else First L.
 */
export function formatDinerPublicName({
  first_name = "",
  last_name = "",
  display_name = "",
} = {}) {
  const first = trimName(first_name);
  const last = trimName(last_name);
  const screen = trimName(display_name);
  const legalFull = [first, last].filter(Boolean).join(" ");

  if (screen && normalizeKey(screen) !== normalizeKey(legalFull)) {
    return screen.slice(0, 40);
  }
  const fromLegal = formatFirstLastInitial(first, last);
  if (fromLegal) return fromLegal;
  const fromScreen = formatNamePartsFromDisplay(screen);
  if (fromScreen) return fromScreen;
  return "Diner";
}

/** Connection / search peer row — never expose internal member ids as labels. */
export function formatDinerPeerLabel(peer) {
  if (!peer) return "Diner";
  return formatDinerPublicName({
    display_name: peer.display_name,
    first_name: peer.first_name,
    last_name: peer.last_name,
  });
}
