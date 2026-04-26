const STORAGE_KEY = "grubbid.onboarding.state";
const BACKUP_STORAGE_KEY = "grubbid.onboarding.state.backup";
const BYPASS_MODE = import.meta.env.VITE_ALLOW_OWNER_TOKEN_BYPASS === "true";

export const RESTAURANT_SIGNUP_RESTART_ROUTE = "/restaurant/signup";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function normalizeRestaurantId(value) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : null;
}

export function normalizeRestaurantOnboardingState(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    restaurant_id: normalizeRestaurantId(raw.restaurant_id),
    restaurant_name: normalizeString(raw.restaurant_name),
    email: normalizeString(raw.email),
    owner_token: normalizeString(raw.owner_token),
    city: normalizeString(raw.city),
    state: normalizeString(raw.state).toUpperCase(),
    phone: normalizeString(raw.phone),
    ingestion_method: normalizeString(raw.ingestion_method),
    menu_choice: normalizeString(raw.menu_choice),
    selected_plan: normalizeString(raw.selected_plan || raw.plan),
    plan: normalizeString(raw.plan || raw.selected_plan),
    design_style: raw.design_style ?? null,
    restored_from: normalizeString(raw.restored_from),
  };
}

function hasWindow() {
  return typeof window !== "undefined";
}

function readJson(storage, key) {
  if (!storage) return null;
  try {
    return JSON.parse(storage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function writeJson(storage, key, value) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage failures and fall back to in-memory navigation state.
  }
}

export function hasRestaurantOnboardingContext(state) {
  const normalized = normalizeRestaurantOnboardingState(state);
  return Boolean(
    normalized &&
      (
        normalized.restaurant_id ||
        normalized.restaurant_name ||
        normalized.email ||
        normalized.owner_token ||
        normalized.ingestion_method ||
        normalized.menu_choice ||
        normalized.plan ||
        normalized.selected_plan
      )
  );
}

export function canResumeRestaurantOnboarding(state) {
  const normalized = normalizeRestaurantOnboardingState(state);
  if (!normalized?.restaurant_id || !normalized.email) return false;
  if (BYPASS_MODE) return true;
  return Boolean(normalized.owner_token);
}

function readStoredOnboardingState() {
  if (!hasWindow()) return null;

  const sessionValue = normalizeRestaurantOnboardingState(
    readJson(window.sessionStorage, STORAGE_KEY)
  );
  if (sessionValue) return sessionValue;

  return normalizeRestaurantOnboardingState(
    readJson(window.localStorage, BACKUP_STORAGE_KEY)
  );
}

function readQueryOnboardingState(search) {
  const params = new URLSearchParams(search || "");
  return normalizeRestaurantOnboardingState({
    restaurant_id: params.get("restaurant_id"),
    restaurant_name: params.get("restaurant_name"),
    ingestion_method: params.get("ingestion_method"),
    menu_choice: params.get("menu_choice"),
    plan: params.get("plan"),
    selected_plan: params.get("selected_plan"),
  });
}

function mergeStates(...parts) {
  const merged = {};
  for (const part of parts) {
    const normalized = normalizeRestaurantOnboardingState(part);
    if (!normalized) continue;
    for (const [key, value] of Object.entries(normalized)) {
      if (value === null || value === "") continue;
      merged[key] = value;
    }
  }
  return normalizeRestaurantOnboardingState(merged);
}

export function persistRestaurantOnboardingState(raw) {
  const normalized = normalizeRestaurantOnboardingState(raw);
  if (!normalized || !hasWindow()) return normalized;

  writeJson(window.sessionStorage, STORAGE_KEY, normalized);
  writeJson(window.localStorage, BACKUP_STORAGE_KEY, {
    ...normalized,
    persisted_at: new Date().toISOString(),
  });

  return normalized;
}

export function clearRestaurantOnboardingState() {
  if (!hasWindow()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
  try {
    window.localStorage.removeItem(BACKUP_STORAGE_KEY);
  } catch {}
}

export function resolveRestaurantOnboardingState({ routeState, search }) {
  const route = normalizeRestaurantOnboardingState(routeState);
  const stored = readStoredOnboardingState();
  const query = readQueryOnboardingState(search);
  const merged = mergeStates(query, stored, route);

  if (canResumeRestaurantOnboarding(route)) {
    return {
      state: merged,
      source: "route",
      missing: false,
      hasAnyData: hasRestaurantOnboardingContext(merged),
    };
  }

  if (canResumeRestaurantOnboarding(stored)) {
    return {
      state: merged,
      source: "storage",
      missing: false,
      hasAnyData: hasRestaurantOnboardingContext(merged),
    };
  }

  if (canResumeRestaurantOnboarding(query)) {
    return {
      state: merged,
      source: "query",
      missing: false,
      hasAnyData: hasRestaurantOnboardingContext(merged),
    };
  }

  return {
    state: merged,
    source: null,
    missing: true,
    hasAnyData: hasRestaurantOnboardingContext(merged),
  };
}

export function buildRestaurantOnboardingSearch(raw) {
  const state = normalizeRestaurantOnboardingState(raw);
  const params = new URLSearchParams();

  if (state?.restaurant_id) params.set("restaurant_id", String(state.restaurant_id));
  if (state?.restaurant_name) params.set("restaurant_name", state.restaurant_name);
  if (state?.ingestion_method) params.set("ingestion_method", state.ingestion_method);
  if (state?.menu_choice) params.set("menu_choice", state.menu_choice);
  if (state?.plan) params.set("plan", state.plan);
  if (state?.selected_plan) params.set("selected_plan", state.selected_plan);

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function navigateWithRestaurantOnboardingState(navigate, pathname, rawState) {
  const state = persistRestaurantOnboardingState(rawState);
  navigate(
    {
      pathname,
      search: buildRestaurantOnboardingSearch(state),
    },
    {
      state,
    }
  );
}
