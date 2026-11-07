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
  restore: (system, { target, keys, expectedCurrent, note }) =>
    call("POST", `/${system}/restore`, {
      target_revision_id: target,
      keys: keys && keys.length ? keys : null,
      expected_current_revision_id: expectedCurrent,
      confirm: "RESTORE",
      note,
    }),
};

export const SYSTEM_LABELS = { food_ontology: "Food Ontology", mks: "MKS" };
export const SYSTEMS = ["food_ontology", "mks"];
