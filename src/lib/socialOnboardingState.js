/**
 * Social onboarding — guided introduction step ids + local/server state helpers.
 * Educational screens with optional actions. Orchestration only — reuses existing APIs.
 */

export const SOCIAL_ONBOARDING_STEPS = [
  "welcome",
  "dining_crew",
  "expand_crew",
  "food_camera",
  "student_edu",
  "people_eating",
  "im_eating",
  "waiter",
];

export const SOCIAL_ONBOARDING_ROUTE = "/account/social-onboarding";

const STORAGE_PREFIX = "menuply.socialOnboarding.v1.";

export function emptySocialOnboardingState() {
  const steps = {};
  for (const id of SOCIAL_ONBOARDING_STEPS) steps[id] = "pending";
  return {
    status: "not_started",
    steps,
    completed_at: null,
    updated_at: null,
  };
}

/**
 * Soft-migrate pre-welcome progress so completed users are not forced back to Screen 1.
 */
function applyWelcomeSoftMigrate(steps, rawStatus) {
  if (steps.welcome !== "pending") return steps;
  const later = SOCIAL_ONBOARDING_STEPS.filter((id) => id !== "welcome");
  const laterSettled = later.every((id) => steps[id] === "done" || steps[id] === "skipped");
  if (laterSettled || String(rawStatus || "").toLowerCase() === "completed") {
    return { ...steps, welcome: "done" };
  }
  return steps;
}

export function normalizeSocialOnboardingState(raw) {
  const base = emptySocialOnboardingState();
  if (!raw || typeof raw !== "object") return base;
  let steps = { ...base.steps };
  const incoming = raw.steps && typeof raw.steps === "object" ? raw.steps : {};
  for (const id of SOCIAL_ONBOARDING_STEPS) {
    const v = String(incoming[id] || "pending").toLowerCase();
    steps[id] = v === "done" || v === "skipped" ? v : "pending";
  }
  steps = applyWelcomeSoftMigrate(steps, raw.status);
  let status = String(raw.status || "not_started").toLowerCase();
  const allSettled = SOCIAL_ONBOARDING_STEPS.every(
    (id) => steps[id] === "done" || steps[id] === "skipped"
  );
  if (allSettled) status = "completed";
  else if (SOCIAL_ONBOARDING_STEPS.some((id) => steps[id] !== "pending")) status = "in_progress";
  else status = "not_started";
  return {
    status,
    steps,
    completed_at: status === "completed" ? raw.completed_at || null : null,
    updated_at: raw.updated_at || null,
  };
}

export function isSocialOnboardingComplete(state) {
  return normalizeSocialOnboardingState(state).status === "completed";
}

export function nextPendingStep(state) {
  const normalized = normalizeSocialOnboardingState(state);
  return SOCIAL_ONBOARDING_STEPS.find((id) => normalized.steps[id] === "pending") || null;
}

export function markSocialOnboardingStep(state, stepId, value) {
  const next = normalizeSocialOnboardingState(state);
  if (!SOCIAL_ONBOARDING_STEPS.includes(stepId)) return next;
  const v = value === "done" || value === "skipped" ? value : "pending";
  next.steps[stepId] = v;
  return normalizeSocialOnboardingState(next);
}

export function loadLocalSocialOnboarding(userId) {
  if (!userId || typeof localStorage === "undefined") return emptySocialOnboardingState();
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return emptySocialOnboardingState();
    return normalizeSocialOnboardingState(JSON.parse(raw));
  } catch {
    return emptySocialOnboardingState();
  }
}

export function saveLocalSocialOnboarding(userId, state) {
  if (!userId || typeof localStorage === "undefined") return;
  try {
    const normalized = normalizeSocialOnboardingState(state);
    normalized.updated_at = new Date().toISOString();
    if (normalized.status === "completed" && !normalized.completed_at) {
      normalized.completed_at = normalized.updated_at;
    }
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(normalized));
  } catch {
    // ignore quota / private mode
  }
}

/** Default campus cluster for discovery demos (USC) when no other context. */
export const DEFAULT_ONBOARDING_CLUSTER = {
  id: 2,
  name: "USC",
  slug: "usc",
  city: "Los Angeles",
  state: "CA",
};

/** Possessive Dining Crew name from consumer profile identity. */
export function defaultDiningCrewNameFromProfile(profile) {
  const first = String(profile?.first_name || "").trim();
  const display = String(profile?.display_name || "").trim();
  const base = first || display.split(/\s+/)[0] || "";
  if (!base) return "My Dining Crew";
  const possessive = /s$/i.test(base) ? `${base}'` : `${base}'s`;
  return `${possessive} Dining Crew`;
}
