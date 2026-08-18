const STORAGE_KEY = "grubbid.analytics.recorded_paths_by_day";

let recorded = Object.create(null);
let loadedFromStorage = false;

export function localCalendarDay(now = Date.now()) {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function resetPageVisitDedupeForTests() {
  recorded = Object.create(null);
  loadedFromStorage = false;
}

function loadFromStorage() {
  if (loadedFromStorage) return;
  loadedFromStorage = true;
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") recorded = parsed;
  } catch {
    recorded = Object.create(null);
  }
}

function persist() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recorded));
  } catch {
    // ignore quota / private mode
  }
}

function pruneOldDays(today) {
  for (const key of Object.keys(recorded)) {
    const day = String(key).split("::")[1];
    if (day && day !== today) delete recorded[key];
  }
}

/**
 * Record a path at most once per visitor per local calendar day.
 */
export function shouldRecordPageVisit(visitorId, path, now = Date.now()) {
  loadFromStorage();
  const visitor = String(visitorId || "");
  const page = String(path || "");
  if (!page) return false;
  const day = localCalendarDay(now);
  pruneOldDays(day);
  const key = `${visitor}::${day}::${page}`;
  if (recorded[key]) return false;
  recorded[key] = true;
  persist();
  return true;
}
