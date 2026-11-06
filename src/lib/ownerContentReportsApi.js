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

// Cluster Wall review (mig 0393): clips waiting, copy-paste holds, posts hidden by 3 reports.
export async function getOwnerWallQueue() {
  const res = await fetch(`${BASE}/wall`, { credentials: "include" });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}

/** action: "approve" | "remove" */
export async function actOnOwnerWallBlock(id, action) {
  const res = await fetch(`${BASE}/wall/${encodeURIComponent(id)}/${action === "approve" ? "approve" : "remove"}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action === "remove" ? { reason: "rejected" } : {}),
  });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}

// The official Menuply brick on a Wall (mig 0395). GET works before the migration (default copy).
export async function getOwnerWallHouse(slug = "usc") {
  const res = await fetch(`${BASE}/wall/house/${encodeURIComponent(slug)}`, { credentials: "include" });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}

/** settings: { body, size, style, link_path, active } */
export async function saveOwnerWallHouse(slug = "usc", settings = {}) {
  const res = await fetch(`${BASE}/wall/house/${encodeURIComponent(slug)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw await apiErrorFromResponse(res);
  return res.json();
}
