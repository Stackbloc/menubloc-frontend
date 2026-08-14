/**
 * Public-facing US address display helpers.
 *
 * Correct format:
 *   Line 1 — street (no ZIP)
 *   Line 2 — City, ST ZIP
 *
 * Some franchise rows embed ZIP (or city/state/ZIP) in address_line1
 * (e.g. "922 Gayley Ave, 90024"). Peel those into the right fields.
 */

function asStr(value) {
  return String(value ?? "").trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const s = asStr(value);
    if (s) return s;
  }
  return "";
}

const ZIP_RE = /^\d{5}(?:-\d{4})?$/;
/** Only peel ZIP when explicitly comma-separated: "922 Gayley Ave, 90024". */
const TRAILING_ZIP_RE = /,\s*(\d{5}(?:-\d{4})?)\s*$/;
const TRAILING_CITY_STATE_ZIP_RE =
  /,\s*([^,]+?),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/;
const TRAILING_STATE_ZIP_RE = /,\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)\s*$/;

/**
 * @param {{
 *   address_line1?: unknown,
 *   address_line2?: unknown,
 *   address?: unknown,
 *   city?: unknown,
 *   state?: unknown,
 *   postal_code?: unknown,
 *   zip?: unknown,
 *   postcode?: unknown,
 * }} raw
 * @returns {{
 *   streetAddr: string,
 *   cityLine: string,
 *   city: string,
 *   state: string,
 *   postalCode: string,
 *   hasAddress: boolean,
 * }}
 */
export function normalizeDisplayAddress(raw = {}) {
  let street = firstNonEmpty(raw.address_line1, raw.address);
  const line2 = asStr(raw.address_line2);
  let city = asStr(raw.city);
  let state = asStr(raw.state);
  let postalCode = firstNonEmpty(raw.postal_code, raw.zip, raw.postcode);

  // Prefer structured street; only use address_line2 as street when line1 empty.
  if (!street && line2) street = line2;

  // Peel "City, ST ZIP" glued onto street.
  const cityStateZip = street.match(TRAILING_CITY_STATE_ZIP_RE);
  if (cityStateZip) {
    street = street.slice(0, cityStateZip.index).trim().replace(/,\s*$/, "");
    if (!city) city = asStr(cityStateZip[1]);
    if (!state) state = asStr(cityStateZip[2]).toUpperCase();
    if (!postalCode) postalCode = asStr(cityStateZip[3]);
  } else {
    // Peel ", ST ZIP"
    const stateZip = street.match(TRAILING_STATE_ZIP_RE);
    if (stateZip) {
      street = street.slice(0, stateZip.index).trim().replace(/,\s*$/, "");
      if (!state) state = asStr(stateZip[1]).toUpperCase();
      if (!postalCode) postalCode = asStr(stateZip[2]);
    } else {
      // Peel trailing ZIP only: "922 Gayley Ave, 90024" or "922 Gayley Ave 90024"
      const zipOnly = street.match(TRAILING_ZIP_RE);
      if (zipOnly) {
        const maybeZip = asStr(zipOnly[1]);
        if (ZIP_RE.test(maybeZip)) {
          street = street.slice(0, zipOnly.index).trim().replace(/,\s*$/, "");
          if (!postalCode) postalCode = maybeZip;
        }
      }
    }
  }

  // If address_line2 is a unit and street came from line1, append as ", Suite X"
  if (street && line2 && street !== line2 && !street.includes(line2)) {
    street = `${street}, ${line2}`;
  }

  const cityLine = formatCityStateZip(city, state, postalCode);

  return {
    streetAddr: street,
    cityLine,
    city,
    state,
    postalCode,
    hasAddress: Boolean(street || cityLine),
  };
}

/** City, ST ZIP — never put ZIP on the street line. */
export function formatCityStateZip(city, state, postalCode) {
  const c = asStr(city);
  const s = asStr(state).toUpperCase();
  const z = asStr(postalCode);
  const left = [c, s].filter(Boolean).join(", ");
  if (left && z) return `${left} ${z}`;
  return left || z;
}

/**
 * Single-line maps / directions query (street + city line).
 * Not for multi-line UI display.
 */
export function formatAddressQuery(parts) {
  const normalized =
    parts && typeof parts === "object" && "streetAddr" in parts
      ? parts
      : normalizeDisplayAddress(parts || {});
  return [normalized.streetAddr, normalized.cityLine].filter(Boolean).join(", ");
}
