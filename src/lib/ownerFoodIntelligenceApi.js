import { OWNER_API_BASE } from "./ownerApi.js";

/** Owner → Food Intelligence API (Phase 1). Errors carry .code and .details from the server. */
async function call(method, path, body) {
  const res = await fetch(`${OWNER_API_BASE}/api/owner/food-intelligence${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok || !json || json.ok === false) {
    const err = new Error(json?.error || `Request failed (${res.status})`);
    err.code = json?.code || null;
    err.details = json?.details || null;
    err.status = res.status;
    throw err;
  }
  return json;
}

const q = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString();
  return s ? `?${s}` : "";
};

export const fiApi = {
  overview: () => call("GET", "/overview"),
  checks: () => call("GET", "/checks"),
  // Food Ontology context (read-only): live Search/Similar/Compare use + mapped dishes.
  ontologyKeyStats: () => call("GET", "/food_ontology/key-stats"),
  ontologyKeyContext: (key) => call("GET", `/food_ontology/keys/${encodeURIComponent(key)}/context`),
  // 2026-11-28 (plan 72): proposals CK holds for Andre; every action goes through CK.
  ontologyReviewHolds: (params = {}) => call("GET", `/food_ontology/review/holds${q(params)}`),
  ontologyReviewApprove: (id, note) => call("POST", `/food_ontology/review/holds/${encodeURIComponent(id)}/approve`, { note: note || null }),
  ontologyReviewReject: (id, note) => call("POST", `/food_ontology/review/holds/${encodeURIComponent(id)}/reject`, { note: note || null }),
  ontologyReviewRevise: (id, fields, note) => call("POST", `/food_ontology/review/holds/${encodeURIComponent(id)}/revise`, { fields, note: note || null }),
  ontologyReviewFile: (apply) => call("POST", "/food_ontology/review/file", { apply: apply === true }),
  ontologyReviewFindings: () => call("GET", "/food_ontology/review/findings"),
  audit: (params = {}) => call("GET", `/audit${q(params)}`),
  saveBaseline: (system) => call("POST", `/${system}/baseline`),
  revisions: (system) => call("GET", `/${system}/revisions`),
  revision: (system, id) => call("GET", `/${system}/revisions/${id}`),
  compare: (system, from, to) => call("GET", `/${system}/compare${q({ from, to })}`),
  createDraft: (system, title) => call("POST", `/${system}/drafts`, { title }),
  editDraft: (system, id, changes, { confirmBulk = false, title } = {}) =>
    call("PATCH", `/${system}/drafts/${id}`, { changes, confirm_bulk: confirmBulk, title }),
  validate: (system, id) => call("POST", `/${system}/drafts/${id}/validate`),
  publish: (system, id, note) => call("POST", `/${system}/drafts/${id}/publish`, { confirm: "PUBLISH", note }),
  abandon: (system, id) => call("POST", `/${system}/drafts/${id}/abandon`),
  restorePreview: (system, target, keys) => call("GET", `/${system}/restore-preview${q({ target, keys: keys && keys.length ? keys.join(",") : "" })}`),
  // Phase 2 — mealtimes (Stage A: nothing here changes live results)
  mealtimeView: (revision) => call("GET", `/mealtime/view${q({ revision })}`),
  mealtimeSuggestions: (draftId, categories) => call("GET", `/mealtime/drafts/${draftId}/suggestions${q({ categories: categories && categories.length ? categories.join(",") : "" })}`),
  mealtimeAddSuggestions: (draftId, { confirmBulk = false, categories } = {}) =>
    call("POST", `/mealtime/drafts/${draftId}/suggestions`, { confirm_bulk: confirmBulk, categories: categories && categories.length ? categories : null }),
  mealtimeRankingPreview: (params) => call("GET", `/mealtime/ranking-preview${q(params)}`),
  // Filters (plan 48 Phase 2, read-only): filter rows, which version Filters read, Check a dish.
  filtersRegistry: () => call("GET", "/filters/registry"),
  filtersCheck: (body) => call("POST", "/filters/check", body),
  mealtimeLive: () => call("GET", "/mealtime/live"),
  mealtimeSetLive: (settings) => call("POST", "/mealtime/live", { settings }),
  restore: (system, { target, keys, expectedCurrent, note }) =>
    call("POST", `/${system}/restore`, {
      target_revision_id: target,
      keys: keys && keys.length ? keys : null,
      expected_current_revision_id: expectedCurrent,
      confirm: "RESTORE",
      note,
    }),
};

/** Food Ontology "Contains" tags (backend filterRegistry.js CONTAINS_TAGS; the server validates). */
export const CONTAINS_TAGS = [
  { tag: "meat", label: "Meat" },
  { tag: "pork", label: "Pork" },
  { tag: "poultry", label: "Poultry" },
  { tag: "fish", label: "Fish" },
  { tag: "shellfish", label: "Shellfish" },
  { tag: "meat_broth", label: "Meat broth" },
  { tag: "gelatin", label: "Gelatin" },
  { tag: "egg", label: "Egg" },
  { tag: "dairy", label: "Dairy" },
  { tag: "gluten", label: "Gluten" },
  { tag: "wheat", label: "Wheat" },
  { tag: "peanuts", label: "Peanuts" },
  { tag: "tree_nuts", label: "Tree nuts" },
  { tag: "soy", label: "Soy" },
  { tag: "sesame", label: "Sesame" },
  { tag: "alcohol", label: "Alcohol" },
  { tag: "honey", label: "Honey" },
];
export const CONTAINS_LEVELS = ["always", "usually", "never"];

export const SYSTEM_LABELS ={ food_ontology: "Food Ontology", mks: "MKS", mealtime: "Mealtimes" };
export const SYSTEMS = ["food_ontology", "mks", "mealtime"];
export const MEALTIME_CODES = [
  { code: "B", label: "Breakfast" },
  { code: "BR", label: "Brunch" },
  { code: "L", label: "Lunch" },
  { code: "D", label: "Dinner" },
  { code: "S", label: "Snack" },
  { code: "DS", label: "Dessert" },
  { code: "LN", label: "Late Night" },
  { code: "A", label: "Anytime" },
];
export const MEALTIME_LABEL = Object.fromEntries(MEALTIME_CODES.map((c) => [c.code, c.label]));
