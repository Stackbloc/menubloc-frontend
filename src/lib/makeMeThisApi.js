/**
 * Make Me This API — private I Wanna Eat requests (not public Feed).
 */

import { apiGet, apiPost } from "./api.js";

export async function listMakeMeThisInbox() {
  const data = await apiGet("/api/consumer/make-me-this/inbox");
  return { items: Array.isArray(data?.items) ? data.items : [] };
}

export async function listMakeMeThisSent() {
  const data = await apiGet("/api/consumer/make-me-this/sent");
  return { items: Array.isArray(data?.items) ? data.items : [] };
}

export async function getMakeMeThisRequest(id) {
  return apiGet(`/api/consumer/make-me-this/${encodeURIComponent(String(id))}`);
}

export async function createMakeMeThisRequest({
  wantToEatId,
  audience = "connections",
  allowedUserIds = [],
}) {
  return apiPost("/api/consumer/make-me-this", {
    want_to_eat_id: wantToEatId,
    audience,
    allowed_user_ids: allowedUserIds,
  });
}

export async function respondToMakeMeThisRequest(id, body) {
  return apiPost(`/api/consumer/make-me-this/${encodeURIComponent(String(id))}/respond`, {
    body,
  });
}

export async function closeMakeMeThisRequest(id) {
  return apiPost(`/api/consumer/make-me-this/${encodeURIComponent(String(id))}/close`, {});
}
