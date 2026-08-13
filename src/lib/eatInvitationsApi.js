/**
 * Invite to Eat API — create + public preview + respond.
 */
import { apiGet, apiPost } from "./api.js";

export async function createEatInvitation(body) {
  return apiPost("/api/consumer/eat-invitations", body);
}

export async function fetchPublicEatInvitation(token) {
  return apiGet(`/public/eat-invitations/${encodeURIComponent(String(token))}`);
}

export async function respondToEatInvitation(token, status) {
  return apiPost(`/api/consumer/eat-invitations/${encodeURIComponent(String(token))}/respond`, {
    status,
  });
}
