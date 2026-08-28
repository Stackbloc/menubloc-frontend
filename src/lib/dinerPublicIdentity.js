function trimName(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return trimName(value).toLowerCase().replace(/\s+/g, " ");
}

export function isGenericPublicLabel(value) {
  const label = trimName(value);
  if (!label) return true;
  if (/^diner$/i.test(label)) return true;
  if (/^guest$/i.test(label)) return true;
  if (/^user$/i.test(label)) return true;
  if (/^member\s*#\s*\d+$/i.test(label)) return true;
  return false;
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

export function coalesceNameParts({ first_name = "", last_name = "", display_name = "" } = {}) {
  let first = trimName(first_name);
  let last = trimName(last_name);
  let screen = trimName(display_name);

  if (isGenericPublicLabel(screen)) {
    screen = "";
  }

  if (!first && !last && screen) {
    const parts = screen.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      first = parts[0];
      last = parts[parts.length - 1];
      screen = "";
    }
  }

  return { first_name: first, last_name: last, display_name: screen };
}

export function formatDinerPublicName(input = {}) {
  const { first_name, last_name, display_name } = coalesceNameParts(input);
  const first = trimName(first_name);
  const last = trimName(last_name);
  const screen = trimName(display_name);
  const legalFull = [first, last].filter(Boolean).join(" ");

  if (screen && !isGenericPublicLabel(screen) && normalizeKey(screen) !== normalizeKey(legalFull)) {
    return screen.slice(0, 40);
  }

  const fromLegal = formatFirstLastInitial(first, last);
  if (fromLegal) return fromLegal;

  const fromScreen = formatNamePartsFromDisplay(screen);
  if (fromScreen && !isGenericPublicLabel(fromScreen)) return fromScreen;

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
