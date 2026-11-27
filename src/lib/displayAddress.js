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

function asFiniteCoord(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Brand page = a franchise canonical (HQ) record. Its address is corporate, never a store. */
export function isBrandPageRecord(data) {
  return data?.is_canonical_parent === true;
}

/**
 * Public menu header address for restaurants and food trucks.
 * Food trucks prefer live current_pickup_location; fall back to home base.
 * Returns street/city lines only — no "Current Location" label (menu chrome).
 */
export function resolvePublicMenuAddressDisplay(data, { isFoodTruck = false } = {}) {
  // Brand page (franchise canonical/HQ record): the corporate address is not a place to
  // eat — never show the street or a maps link. Andre 2026-11-27: show "Franchise HQ: City, ST"
  // only. The franchise banner shows the chosen store.
  if (isBrandPageRecord(data)) {
    const area = [asStr(data?.city), asStr(data?.state).toUpperCase()].filter(Boolean).join(", ");
    const hq = area ? `Franchise HQ: ${area}` : "";
    return { addressLine1: hq, addressLine2: "", addressLine: hq, directionsHref: "", usedCurrentPickup: false, isBrandHq: true };
  }
  const pickup = data?.current_pickup_location || null;
  const pickupStreet = firstNonEmpty(
    pickup?.current_pickup_address,
    pickup?.current_pickup_label
  );
  const pickupLat = asFiniteCoord(pickup?.current_pickup_lat);
  const pickupLng = asFiniteCoord(pickup?.current_pickup_lng);
  const usePickup =
    isFoodTruck === true &&
    Boolean(pickupStreet || (pickupLat != null && pickupLng != null));

  const normalized = normalizeDisplayAddress(
    usePickup
      ? {
          address_line1: pickupStreet || data?.address_line1 || data?.address,
          city: data?.city,
          state: data?.state,
          postal_code: data?.postal_code || data?.zip,
          zip: data?.zip,
        }
      : {
          address_line1: data?.address_line1 || data?.address,
          city: data?.city,
          state: data?.state,
          postal_code: data?.postal_code || data?.zip,
          zip: data?.zip,
        }
  );

  let addressLine1 = normalized.streetAddr;
  let addressLine2 = normalized.cityLine;
  if (!addressLine1 && usePickup && pickupStreet) {
    addressLine1 = pickupStreet;
  }
  if (!addressLine1 && !addressLine2 && asStr(data?.address_line)) {
    const fromLine = normalizeDisplayAddress({ address_line1: data.address_line });
    addressLine1 = fromLine.streetAddr;
    addressLine2 = fromLine.cityLine || addressLine2;
  }

  const addressLine = [addressLine1, addressLine2].filter(Boolean).join(", ");
  let directionsHref = "";
  if (usePickup && pickupLat != null && pickupLng != null) {
    directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
      `${pickupLat},${pickupLng}`
    )}`;
  } else if (addressLine) {
    directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressLine)}`;
  }

  // One format on every menu (Andre 2026-11-27): street on line 1, "City, ST" alone on the
  // last line. ZIP stays in the maps link only (many stores have none, so showing it varied).
  const displayStreet = formatMenuStreet(addressLine1);
  const displayCityState = formatCityState(normalized.city, normalized.state) || stripZip(addressLine2);
  return {
    addressLine1: displayStreet,
    addressLine2: displayCityState,
    addressLine: [displayStreet, displayCityState].filter(Boolean).join(", "),
    directionsHref,
    usedCurrentPickup: usePickup,
  };
}

/** "City, ST" — never a ZIP. */
export function formatCityState(city, state) {
  return [asStr(city), asStr(state).toUpperCase()].filter(Boolean).join(", ");
}

function stripZip(line) {
  return asStr(line).replace(/\s+\d{5}(?:-\d{4})?\s*$/, "").trim();
}

const STREET_KEEP_UPPER = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW", "US", "FM", "SR", "CR", "PO"]);

/**
 * Same street style on every menu: ALL-CAPS rows become normal capitals ("644 VETERANS PKWY" →
 * "644 Veterans Pkwy"), abbreviation periods drop ("110 N. Carpenter St." → "110 N Carpenter St"),
 * extra spaces collapse. Mixed-case streets keep their own capitals.
 */
export function formatMenuStreet(street) {
  let s = asStr(street).replace(/\s+/g, " ");
  if (!s) return "";
  const letters = s.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 3 && letters === letters.toUpperCase()) {
    s = s
      .split(" ")
      .map((word) => {
        const bare = word.replace(/[^A-Za-z]/g, "");
        if (STREET_KEEP_UPPER.has(bare)) return word;
        // 1ST → 1st, 22ND → 22nd
        if (/^\d+(ST|ND|RD|TH)[.,]?$/i.test(word)) return word.toLowerCase();
        // Unit numbers stay as written: 4B, 12A
        if (/^\d+[A-Za-z][.,]?$/.test(word)) return word;
        return word.toLowerCase().replace(/(^|[-(/])([a-z])/g, (_, pre, ch) => pre + ch.toUpperCase());
      })
      .join(" ");
  }
  // "N." → "N", "St." → "St" (abbreviations only: a letter run followed by a period).
  s = s.replace(/\b([A-Za-z]{1,4})\.(?=\s|,|$)/g, "$1");
  return s.replace(/\s+,/g, ",").trim();
}
