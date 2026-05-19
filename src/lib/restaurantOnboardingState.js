const STORAGE_KEY = "grubbid.onboarding.state";
const BACKUP_STORAGE_KEY = "grubbid.onboarding.state.backup";
const BYPASS_MODE = import.meta.env.VITE_ALLOW_OWNER_TOKEN_BYPASS === "true";
const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

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
    onboarding_progress_id: normalizeRestaurantId(raw.onboarding_progress_id ?? raw.progress_id ?? raw.id),
    onboarding_version: normalizeString(raw.onboarding_version) || "v1",
    current_step_key: normalizeString(raw.current_step_key),
    completed_step_keys: Array.isArray(raw.completed_step_keys) ? raw.completed_step_keys : [],
    intake_path: normalizeString(raw.intake_path),
    requested_location_count: (() => {
      const numeric = Number(raw.requested_location_count);
      return Number.isInteger(numeric) && numeric > 0 ? numeric : 1;
    })(),
    selected_plan_code: normalizeString(raw.selected_plan_code),
    manual_review_required: Boolean(raw.manual_review_required),
    manual_review_reason: normalizeString(raw.manual_review_reason),
    draft_payload:
      raw.draft_payload && typeof raw.draft_payload === "object" && !Array.isArray(raw.draft_payload)
        ? raw.draft_payload
        : {},
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

function applyProgress(rawState, progress) {
  if (!progress || typeof progress !== "object") {
    return normalizeRestaurantOnboardingState(rawState);
  }

  return normalizeRestaurantOnboardingState({
    ...rawState,
    onboarding_progress_id: progress.id,
    onboarding_version: progress.onboarding_version,
    current_step_key: progress.current_step_key,
    completed_step_keys: progress.completed_step_keys,
    intake_path: progress.intake_path,
    requested_location_count: progress.requested_location_count,
    selected_plan_code: progress.selected_plan_code,
    selected_plan: progress.selected_plan_code || rawState?.selected_plan || rawState?.plan,
    plan: rawState?.plan || progress.selected_plan_code || rawState?.selected_plan,
    manual_review_required: progress.manual_review_required,
    manual_review_reason: progress.manual_review_reason,
    draft_payload: progress.draft_payload || {},
  });
}

export async function fetchRestaurantOnboardingProgress(rawState) {
  const state = normalizeRestaurantOnboardingState(rawState);
  if (!canResumeRestaurantOnboarding(state)) return state;

  const params = new URLSearchParams({
    restaurant_id: String(state.restaurant_id),
    email: state.email,
  });

  const res = await fetch(`${API}/owner/onboarding/progress?${params.toString()}`, {
    credentials: "include",
    headers: { "x-owner-token": state.owner_token },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok || !json?.progress) return state;

  return persistRestaurantOnboardingState(applyProgress(state, json.progress));
}

export async function syncRestaurantOnboardingProgress(rawState, patch) {
  const state = normalizeRestaurantOnboardingState(rawState);
  if (!canResumeRestaurantOnboarding(state)) return state;

  const res = await fetch(`${API}/owner/onboarding/progress`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-owner-token": state.owner_token,
    },
    body: JSON.stringify({
      restaurant_id: state.restaurant_id,
      email: state.email,
      owner_token: state.owner_token,
      ...patch,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `Onboarding progress sync failed (${res.status})`);
  }

  return persistRestaurantOnboardingState(applyProgress(state, json.progress));
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
