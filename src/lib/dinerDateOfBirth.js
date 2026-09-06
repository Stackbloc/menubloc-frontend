/**
 * Date of birth — store DOB, derive age (never a manual age field).
 */

export function parseDateOnly(value) {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

export function ageFromDob(dobYmd, asOf = new Date()) {
  const ymd = parseDateOnly(dobYmd);
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  let age = asOf.getFullYear() - y;
  if (asOf.getMonth() + 1 < m || (asOf.getMonth() + 1 === m && asOf.getDate() < d)) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export function summarizeDob(dobYmd) {
  const ymd = parseDateOnly(dobYmd);
  if (!ymd) return "Not set";
  const age = ageFromDob(ymd);
  return age != null ? `Age ${age}` : "Set";
}

export const DINER_SEX_OPTIONS = Object.freeze([
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
]);

const DINER_SEX_SHORT = Object.freeze({
  female: "F",
  male: "M",
  non_binary: "NB",
});

export function dinerSexLabel(value) {
  const opt = DINER_SEX_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : "";
}

/** Compact F / M / NB for discovery rows — omit prefer_not_to_say. */
export function dinerSexShort(value) {
  const key = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[ -]+/g, "_");
  return DINER_SEX_SHORT[key] || null;
}
