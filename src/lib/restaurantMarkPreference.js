/**
 * Prefer restaurant logo/billboard only when recognition is faster than text.
 * Known national chains / any row with chain_id → mark image.
 * Independent / unknown places → plain name text.
 */

const KNOWN_CHAIN_NAME_RE =
  /\b(in-?n-?out|starbucks|mcdonald'?s|chick-?fil-?a|chipotle|panda express|taco bell|wendy'?s|burger king|subway|dunkin|kfc|popeyes|five guys|shake shack|wingstop|domino'?s|pizza hut|papa john'?s|little caesars|raising cane'?s|whataburger|sonic|arbys|jack in the box|carl'?s jr|hardee'?s|del taco|el pollo loco|yogurtland|baskin|cold stone|jamba|panera|sweetgreen|cava|habiti|olive garden|applebee'?s|chili'?s|outback|ihop|denny'?s|waffle house|dutch bros|peet'?s|tim hortons)\b/i;

export function shouldPreferRestaurantMark(row = {}) {
  const chainId = row.chain_id ?? row.restaurant_chain_id ?? null;
  if (chainId != null && String(chainId).trim() !== "" && Number(chainId) > 0) {
    return true;
  }
  const name = String(
    row.restaurant_name || row.name || row.place_label || ""
  ).trim();
  if (!name) return false;
  return KNOWN_CHAIN_NAME_RE.test(name);
}
