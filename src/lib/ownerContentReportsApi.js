import { OWNER_API_BASE } from "./ownerApi.js";
import { apiErrorFromResponse } from "./apiErrorDisplay.js";

// Owner → Reports (Play Store safety, 2026-11-02): diner reports on clips and dish video comments.
const BASE = `${OWNER_API_BASE}/api/owner/reports`;

export async function getOwnerContentReports(status = "open") {
  const res = await fetch(`${BASE}?status=${encodeURIComponent(status)}`, { credentials: "include" });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}

/** action: "remove" | "disable" | "dismiss" */
export async function resolveOwnerContentReport(id, action) {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}/resolve`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}
