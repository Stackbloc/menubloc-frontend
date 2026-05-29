/**
 * DISPLAY CLEANUP RULES (frontend only — never mutates storage).
 *
 * - ALL CAPS → readable title case (preserve common food acronyms)
 * - Remove leading punctuation and accidental OCR/parser prefixes
 * - Collapse whitespace
 * - Minor presentation cleanup for readability
 *
 * INGESTION REJECTION RULES live in the backend:
 * menubloc-backend/src/services/ingestion/isLikelyModifierOrInstruction.js
 *
 * Do not mix display cleanup with ingestion rejection logic.
 */

const PRESERVED_ACRONYMS = new Map(
  [
    ["BBQ", "BBQ"],
    ["BLT", "BLT"],
    ["USDA", "USDA"],
    ["NY", "NY"],
    ["LA", "LA"],
    ["GF", "GF"],
    ["DF", "DF"],
    ["V", "V"],
    ["IPA", "IPA"],
    ["MVP", "MVP"],
    ["PHO", "PHO"],
    ["EVOO", "EVOO"],
    ["PC", "PC"],
  ].map(([k, v]) => [k, v])
);

const LEADING_PUNCT_RE = /^[\s.,\-–—•·:#@$%&|\\[\]{}<>~`";*]+/;

/** Display-only: strip accidental leading phrases (longest first). */
const LEADING_PHRASE_CONNECTORS = [
  "your choice of",
  "choice of",
  "substitute for",
  "substitute",
  "served with",
  "comes with",
  "extra charge",
  "upgrade to",
  "add on",
  "additionally",
  "includes",
  "pick two",
  "pick one",
  "select",
  "choose",
];

const LEADING_CONNECTORS = ["add", "sub", "plus", "with", "and", "extra"];

function collapseWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function lettersOnly(value) {
  return String(value || "").replace(/[^A-Za-z]/g, "");
}

function isOverwhelminglyUppercase(value) {
  const letters = lettersOnly(value);
  if (letters.length < 3) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  const lower = letters.replace(/[^a-z]/g, "").length;
  if (lower === 0) return true;
  return upper / letters.length >= 0.85;
}

function hasMixedCaseWord(value) {
  return /\b[A-Za-z]*[a-z][A-Z][A-Za-z]*\b/.test(value) || /\bMc[A-Z]/.test(value);
}

function preserveAcronymToken(token) {
  const core = token.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (!core || !PRESERVED_ACRONYMS.has(core)) return null;
  const preserved = PRESERVED_ACRONYMS.get(core);
  const prefix = token.match(/^[^A-Za-z]*/)?.[0] || "";
  const suffix = token.match(/[^A-Za-z]*$/)?.[0] || "";
  return `${prefix}${preserved}${suffix}`;
}

function titleCaseLetters(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function formatToken(token, { forceTitleCase = false } = {}) {
  if (!token) return token;

  const acronym = preserveAcronymToken(token);
  if (acronym) return acronym;

  const alpha = lettersOnly(token);
  if (!forceTitleCase && alpha && alpha !== alpha.toUpperCase() && alpha !== alpha.toLowerCase()) {
    return token;
  }

  const numberPrefix = token.match(/^(\d+(?:[-.]?\d+)?)(.*)$/);
  if (numberPrefix) {
    const [, num, rest] = numberPrefix;
    if (!rest) return token;
    return `${num}${formatToken(rest, { forceTitleCase: true })}`;
  }

  const apostropheParts = token.split(/(['’])/);
  if (apostropheParts.length > 1) {
    return apostropheParts
      .map((part, index) => {
        if (part === "'" || part === "’") return part;
        if (!part) return part;
        if (index > 0 && apostropheParts[index - 1]) {
          return part.toLowerCase();
        }
        return titleCaseLetters(part);
      })
      .join("");
  }

  if (!alpha) return token;
  return titleCaseLetters(token);
}

function toReadableTitleCase(value) {
  const parts = value.split(/(\s+|&)/);
  return parts
    .map((part) => {
      if (!part || part === "&") return part;
      if (/^\s+$/.test(part)) return part;
      return formatToken(part, { forceTitleCase: true });
    })
    .join("");
}

function stripLeadingPunctuation(value) {
  let result = value;
  while (LEADING_PUNCT_RE.test(result)) {
    result = result.replace(LEADING_PUNCT_RE, "");
  }
  return result.trim();
}

function shouldKeepSubPrefix(remainder) {
  const first = String(remainder || "").trim().split(/\s+/)[0] || "";
  const normalized = first.replace(/^-/, "").toLowerCase();
  return ["marine", "way", "zero", "roll", "sauce"].some((prefix) => normalized.startsWith(prefix));
}

function shouldKeepPlusWithAnd(prefix, remainder, original) {
  const parts = String(remainder || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return true;

  const connector = String(original || "").trim().split(/\s+/)[0] || "";
  if (connector && connector !== connector.toLowerCase() && connector !== connector.toUpperCase()) {
    return true;
  }

  if (/^and\s+/i.test(original) && /^ouille/i.test(remainder)) return true;

  return false;
}

function shouldKeepExtraPrefix(remainder, original) {
  const parts = String(remainder || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return true;

  const connector = String(original || "").trim().split(/\s+/)[0] || "";
  if (connector && connector !== connector.toLowerCase() && connector !== connector.toUpperCase()) {
    return true;
  }

  return false;
}

function phraseConnectorPattern(phrase) {
  return new RegExp(`^${phrase.replace(/\s+/g, "\\s+")}\\s+`, "i");
}

function stripLeadingPhraseConnectors(value) {
  let result = value;
  for (const phrase of LEADING_PHRASE_CONNECTORS) {
    const re = phraseConnectorPattern(phrase);
    if (!re.test(result)) continue;
    const remainder = result.replace(re, "").trim();
    if (!remainder) return result;
    result = remainder;
  }
  return result;
}

function stripLeadingWPrefix(value) {
  let result = value;
  if (/^w\/\s*/i.test(result)) {
    const remainder = result.replace(/^w\/\s*/i, "").trim();
    if (remainder) result = remainder;
  } else if (/^w\s+(?=[A-Za-z])/i.test(result)) {
    const remainder = result.replace(/^w\s+/i, "").trim();
    if (remainder) result = remainder;
  }
  return result;
}

function stripLeadingConnectors(value) {
  let result = stripLeadingPhraseConnectors(value);
  result = stripLeadingWPrefix(result);

  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    for (const connector of LEADING_CONNECTORS) {
      const re = new RegExp(`^${connector}\\s+`, "i");
      const match = result.match(re);
      if (!match) continue;

      const remainder = result.slice(match[0].length).trim();
      if (!remainder) continue;

      if (connector === "add" && /^on\b/i.test(remainder)) continue;
      if (connector === "sub" && shouldKeepSubPrefix(remainder)) continue;
      if (connector === "extra" && shouldKeepExtraPrefix(remainder, result)) continue;
      if (["plus", "with", "and"].includes(connector) && shouldKeepPlusWithAnd(connector, remainder, result)) {
        continue;
      }

      result = remainder;
      changed = true;
      break;
    }
    if (!changed) break;
  }
  return result;
}

/**
 * Format a menu item name for user-facing display.
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function formatMenuItemName(name) {
  const original = collapseWhitespace(name);
  if (!original) return "";

  let cleaned = stripLeadingPunctuation(original);
  cleaned = stripLeadingConnectors(cleaned);
  cleaned = collapseWhitespace(cleaned);

  if (!cleaned || cleaned.length < 2) {
    return original;
  }

  if (!isOverwhelminglyUppercase(cleaned) && !LEADING_PUNCT_RE.test(original) && !hasLeadingConnectorArtifact(original)) {
    if (hasMixedCaseWord(cleaned)) return cleaned;
    if (cleaned === original) return cleaned;
  }

  const titled = isOverwhelminglyUppercase(cleaned) ? toReadableTitleCase(cleaned) : cleaned;
  const finalName = collapseWhitespace(titled);

  if (!finalName || finalName.length < 2) {
    return original;
  }

  return finalName;
}

function hasLeadingConnectorArtifact(value) {
  const trimmed = collapseWhitespace(value);
  if (LEADING_PHRASE_CONNECTORS.some((phrase) => phraseConnectorPattern(phrase).test(trimmed))) {
    return true;
  }
  if (/^w\/\s*/i.test(trimmed)) return true;
  if (/^w\s+(?=[A-Za-z])/i.test(trimmed)) return true;
  return LEADING_CONNECTORS.some((connector) => new RegExp(`^${connector}\\s+`, "i").test(trimmed));
}
