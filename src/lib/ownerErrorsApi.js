import { OWNER_API_BASE } from "./ownerApi.js";
import { apiErrorFromResponse } from "./apiErrorDisplay.js";

async function ownerGet(path) {
  const res = await fetch(`${OWNER_API_BASE}/api/owner/errors${path}`, { credentials: "include" });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}

/** Owner → Errors list. params: since_hours, code, q, request_id, limit */
export function getOwnerErrors(params = {}) {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  ).toString();
  return ownerGet(search ? `?${search}` : "");
}

export function getOwnerError(id) {
  return ownerGet(`/${encodeURIComponent(id)}`);
}
