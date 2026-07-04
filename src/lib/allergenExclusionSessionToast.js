const SESSION_TOAST_KEY = "menuply.allergen_exclusion_toast_consumer_id";

function formatAllergenLabel(key) {
  return String(key || "")
    .trim()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function hasActiveAllergenExclusions(allergenFilter, allergenPreferences) {
  if (allergenFilter?.status === "off") return false;
  if (allergenFilter?.should_filter === true) {
    const keys = allergenFilter?.active_allergen_keys;
    if (Array.isArray(keys) && keys.length > 0) return true;
  }
  if (!Array.isArray(allergenPreferences)) return false;
  return allergenPreferences.some((row) => row?.is_enabled === true);
}

function collectActiveAllergenLabels(allergenFilter, allergenPreferences) {
  const fromFilter = Array.isArray(allergenFilter?.active_allergen_labels)
    ? allergenFilter.active_allergen_labels.filter(Boolean)
    : [];
  if (fromFilter.length > 0) return fromFilter;

  if (!Array.isArray(allergenPreferences)) return [];
  return allergenPreferences
    .filter((row) => row?.is_enabled === true)
    .map((row) => formatAllergenLabel(row?.allergen_key))
    .filter(Boolean);
}

function summarizeAllergenLabels(labels) {
  const list = (Array.isArray(labels) ? labels : []).filter(Boolean);
  if (list.length === 0) return "";
  if (list.length <= 3) return list.join(", ");
  return `${list.slice(0, 2).join(", ")} +${list.length - 2} more`;
}

function resolveGreetingName(profile) {
  const first = String(profile?.first_name || "").trim();
  if (first) return first;
  const display = String(profile?.display_name || "").trim();
  if (!display) return "";
  return display.split(/\s+/)[0] || "";
}

export function buildAllergenExclusionSessionToastMessage(profile, allergenFilter, allergenPreferences) {
  if (!hasActiveAllergenExclusions(allergenFilter, allergenPreferences)) return "";

  const name = resolveGreetingName(profile);
  const summary = summarizeAllergenLabels(
    collectActiveAllergenLabels(allergenFilter, allergenPreferences)
  );
  const greeting = name ? `Hi ${name}` : "Hi";

  if (summary) {
    return `${greeting} — allergen exclusions are on (${summary}). Search results are filtered.`;
  }
  return `${greeting} — allergen exclusions are on. Search results are filtered.`;
}

export function maybeBuildAllergenExclusionSessionToast({
  consumerId,
  profile,
  allergenFilter,
  allergenPreferences,
}) {
  if (!consumerId) return "";

  const message = buildAllergenExclusionSessionToastMessage(
    profile,
    allergenFilter,
    allergenPreferences
  );
  if (!message) return "";

  if (typeof window !== "undefined") {
    const shownFor = String(window.sessionStorage.getItem(SESSION_TOAST_KEY) || "");
    if (shownFor === String(consumerId)) return "";
    window.sessionStorage.setItem(SESSION_TOAST_KEY, String(consumerId));
  }

  return message;
}

export function clearAllergenExclusionSessionToastMarker() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(SESSION_TOAST_KEY);
  }
}
