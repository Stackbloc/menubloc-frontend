/**
 * Shared timezone helpers. A single source of truth for "what hour is it
 * right now in a given IANA timezone" and "what US state maps to which
 * timezone" — used anywhere a feature needs to bucket by local time of day
 * for a specific market rather than the viewing device's own clock.
 */

// One dominant IANA zone per US state/territory. A few states technically
// span two zones (FL panhandle, western TX, western KS/NE/SD, northern ID,
// eastern TN, western KY/MI); each is mapped to whichever zone covers its
// more populous region. Good enough for meal-period bucketing — not meant
// for precise legal/scheduling use.
const STATE_TIMEZONES = {
  AL: "America/Chicago",
  AK: "America/Anchorage",
  AZ: "America/Phoenix",
  AR: "America/Chicago",
  CA: "America/Los_Angeles",
  CO: "America/Denver",
  CT: "America/New_York",
  DE: "America/New_York",
  DC: "America/New_York",
  FL: "America/New_York",
  GA: "America/New_York",
  HI: "Pacific/Honolulu",
  ID: "America/Boise",
  IL: "America/Chicago",
  IN: "America/Indiana/Indianapolis",
  IA: "America/Chicago",
  KS: "America/Chicago",
  KY: "America/New_York",
  LA: "America/Chicago",
  ME: "America/New_York",
  MD: "America/New_York",
  MA: "America/New_York",
  MI: "America/Detroit",
  MN: "America/Chicago",
  MS: "America/Chicago",
  MO: "America/Chicago",
  MT: "America/Denver",
  NE: "America/Chicago",
  NV: "America/Los_Angeles",
  NH: "America/New_York",
  NJ: "America/New_York",
  NM: "America/Denver",
  NY: "America/New_York",
  NC: "America/New_York",
  ND: "America/Chicago",
  OH: "America/New_York",
  OK: "America/Chicago",
  OR: "America/Los_Angeles",
  PA: "America/New_York",
  RI: "America/New_York",
  SC: "America/New_York",
  SD: "America/Chicago",
  TN: "America/Chicago",
  TX: "America/Chicago",
  UT: "America/Denver",
  VT: "America/New_York",
  VA: "America/New_York",
  WA: "America/Los_Angeles",
  WV: "America/New_York",
  WI: "America/Chicago",
  WY: "America/Denver",
  PR: "America/Puerto_Rico",
  GU: "Pacific/Guam",
  VI: "America/St_Thomas",
};

/** Accepts a 2-letter code or full state name; returns an IANA zone or null. */
export function getTimezoneForUsState(state) {
  const raw = String(state || "").trim();
  if (!raw) return null;
  if (raw.length === 2) {
    return STATE_TIMEZONES[raw.toUpperCase()] || null;
  }
  const normalized = raw.toLowerCase();
  const match = Object.keys(STATE_NAME_TO_ABBR).find((name) => name === normalized);
  return match ? STATE_TIMEZONES[STATE_NAME_TO_ABBR[match]] || null : null;
}

const STATE_NAME_TO_ABBR = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI",
  minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC",
  "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY", "puerto rico": "PR", guam: "GU",
};

/**
 * Resolve { hour, minute, totalMinutes, isWeekend } for `date` as observed
 * in `timezone`. Falls back to the runtime's own detected timezone (device
 * local time) when `timezone` is not provided.
 */
export function getZonedParts(date, timezone) {
  const tz = String(timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  // Intl reports midnight as hour "24" with hourCycle h23 in some engines — normalize.
  const hour = Number.parseInt(lookup.hour, 10) % 24;
  const minute = Number.parseInt(lookup.minute, 10);
  const weekday = String(lookup.weekday || "").toLowerCase();
  const isWeekend = weekday === "sat" || weekday === "sun";
  const totalMinutes = hour * 60 + minute;
  return { hour, minute, totalMinutes, isWeekend };
}
