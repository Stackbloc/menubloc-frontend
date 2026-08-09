/**
 * Client-side split of glued OCR name cells into name / price / description.
 * Mirrors menubloc-backend gluedPricedMenuLineSplit (bare decimals + $; no bare integers).
 */

const PRICE_SPLIT_RE = /(\$\d{1,3}(?:\.\d{2})?\b|\b\d{1,3}\.\d{2}\b)/g;
const ANY_PRICE_RE = /\$\d{1,3}(?:\.\d{2})?\b|\b\d{1,3}\.\d{2}\b/;

function parsePriceToken(priceToken) {
  const n = Number(String(priceToken || "").replace("$", ""));
  if (!Number.isFinite(n) || n <= 0 || n >= 500) return null;
  return n;
}

function extractTrailingItemName(before) {
  const words = String(before || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (words.length && /^\d+$/.test(words[words.length - 1])) {
    words.pop();
  }
  if (!words.length) return null;

  const nameWords = [];
  for (let i = words.length - 1; i >= 0; i -= 1) {
    const w = words[i];
    if (/^(SIDES|DRINKS|ENTREES|APPETIZERS|DESSERTS|MENU|SCHEDULE|PHOTOS)$/i.test(w)) break;
    if (/^\d+$/.test(w)) break;
    if (
      nameWords.length > 0 &&
      /^[a-z]/.test(w) &&
      w.length > 3 &&
      !/^(and|with|n|of|the|a|an)$/i.test(w)
    ) {
      break;
    }
    if (nameWords.length >= 4 && /^[A-Z]/.test(w)) break;
    nameWords.unshift(w);
    if (nameWords.length >= 8) break;
  }
  while (
    nameWords.length &&
    /^[a-z]/.test(nameWords[0]) &&
    nameWords[0].length > 2 &&
    !/^(mac|n)$/i.test(nameWords[0])
  ) {
    nameWords.shift();
  }
  const name = nameWords.join(" ").trim();
  if (name.length < 2 || name.length > 80) return null;
  return name;
}

function extractLeadingItemName(after) {
  let s = String(after || "").trim().replace(/^\d+\s+/, "");
  const m = s.match(
    /^([A-Z][\w'&().+\-]*(?:\s+[A-Z][\w'&().+\-]*){0,7})(?=\s+\d+\b|\s+[a-z]|,|$)/
  );
  const name = (m?.[1] || s.match(/^([A-Z][\w'&().+\-]*(?:\s+[A-Z][\w'&().+\-]*){0,7})/)?.[1] || "")
    .trim();
  if (name.length < 2 || name.length > 80) return null;
  return name;
}

function extractDescriptionAfterName(after, name) {
  let rest = String(after || "").trim().replace(/^\d+\s+/, "");
  if (!name) return null;
  if (rest.toLowerCase().startsWith(name.toLowerCase())) {
    rest = rest.slice(name.length).trim();
  }
  rest = rest.replace(/^\d+\s+/, "").trim();
  if (!rest || rest.length < 3) return null;
  const nextDish = rest.match(
    /\s+([A-Z][\w'&().+\-]*(?:\s+[A-Z][\w'&().+\-]+){1,6})(?:\s+\d+\b|\s*$)/
  );
  let descPart = rest;
  if (nextDish && nextDish.index != null && nextDish.index > 0) {
    descPart = rest.slice(0, nextDish.index).trim();
  }
  if (
    !descPart ||
    descPart.length < 3 ||
    /^[A-Z][\w'&().+\-]*(?:\s+[A-Z][\w'&().+\-]*){0,5}$/.test(descPart)
  ) {
    return null;
  }
  return descPart.slice(0, 500);
}

export function extractPricedFragmentsFromLine(line) {
  const raw = String(line || "").replace(/\s+/g, " ").trim();
  if (!raw || !ANY_PRICE_RE.test(raw)) return [];
  const tokens = raw.split(PRICE_SPLIT_RE);
  if (tokens.length < 3) return [];

  const fragments = [];
  for (let i = 1; i < tokens.length; i += 2) {
    const priceToken = tokens[i];
    const before = tokens[i - 1] || "";
    const after = tokens[i + 1] || "";
    const priceNum = parsePriceToken(priceToken);
    if (priceNum == null) continue;

    let name = extractTrailingItemName(before);
    let description = null;
    if (!name) {
      name = extractLeadingItemName(after);
      if (name) description = extractDescriptionAfterName(after, name);
    } else {
      const afterTrim = after.trim();
      if (afterTrim) {
        const nextTitle = afterTrim.match(
          /\s+([A-Z][\w'&().+\-]*(?:\s+[A-Z][\w'&().+\-]*){1,6})(?:\s+\d+\b|\s*$)/
        );
        const descPart = nextTitle
          ? afterTrim.slice(0, nextTitle.index).trim()
          : afterTrim;
        if (
          descPart &&
          descPart.length >= 3 &&
          !/^[A-Z][\w'&().+\-]*(?:\s+[A-Z][\w'&().+\-]*){0,5}$/.test(descPart)
        ) {
          description = descPart.slice(0, 500);
        }
      }
    }
    if (!name) continue;
    fragments.push({
      name: name.slice(0, 120),
      price: priceNum,
      description: description || "",
    });
  }
  return fragments;
}

/** True when the name cell looks glued (price + long blob). */
export function looksGluedForSplitFields(name, price) {
  const s = String(name || "");
  if (s.length < 40 && !ANY_PRICE_RE.test(s)) return false;
  if (ANY_PRICE_RE.test(s)) return true;
  const p = Number(price);
  if ((!Number.isFinite(p) || p <= 0) && s.length > 50) return true;
  return false;
}

/**
 * Best single-item fields for Review Queue Split fields.
 * @returns {{ name: string, price: number, description: string, fragment_count: number } | null}
 */
export function splitGluedMenuItemFields(text) {
  const fragments = extractPricedFragmentsFromLine(text);
  if (fragments.length === 0) return null;
  const preferred =
    fragments.find((f) => f.description) || fragments[0];
  return {
    name: preferred.name,
    price: preferred.price,
    description: preferred.description || "",
    fragment_count: fragments.length,
  };
}
