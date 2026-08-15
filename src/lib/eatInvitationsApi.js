/**
 * Invite to Eat API — public create/preview/respond (account optional).
 */
import { apiGet, apiPost } from "./api.js";
import { getOrCreateEatInviteGuestKey } from "./eatInviteGuestIdentity.js";

export async function createEatInvitation(body) {
  return apiPost("/public/eat-invitations", body);
}

export async function fetchPublicEatInvitation(token, { guestKey } = {}) {
  const gk = guestKey || getOrCreateEatInviteGuestKey();
  const q = gk ? `?guest_key=${encodeURIComponent(gk)}` : "";
  return apiGet(`/public/eat-invitations/${encodeURIComponent(String(token))}${q}`);
}

export async function respondToEatInvitation(
  token,
  status,
  { guestKey, displayName, proposedDate, proposedTime } = {}
) {
  const body = { status };
  if (guestKey) body.guest_key = guestKey;
  if (displayName) body.display_name = displayName;
  if (proposedDate) body.proposed_date = proposedDate;
  if (proposedTime) body.proposed_time = proposedTime;
  return apiPost(`/public/eat-invitations/${encodeURIComponent(String(token))}/respond`, body);
}
