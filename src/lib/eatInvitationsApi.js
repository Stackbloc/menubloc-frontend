/**
 * Invite to Eat API — public create/preview/respond/counter-propose (account optional).
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

export async function createEatInvitationCounterProposal(
  token,
  {
    guestKey,
    displayName,
    restaurantId,
    menuItemId,
    proposedDate,
    proposedTime,
    note,
  } = {}
) {
  const body = {};
  if (guestKey) body.guest_key = guestKey;
  if (displayName) body.display_name = displayName;
  if (restaurantId != null) body.restaurant_id = restaurantId;
  if (menuItemId != null) body.menu_item_id = menuItemId;
  if (proposedDate) body.proposed_date = proposedDate;
  if (proposedTime) body.proposed_time = proposedTime;
  if (note) body.note = note;
  return apiPost(
    `/public/eat-invitations/${encodeURIComponent(String(token))}/proposals`,
    body
  );
}

export async function resolveEatInvitationProposal(
  token,
  proposalId,
  action,
  {
    guestKey,
    displayName,
    restaurantId,
    menuItemId,
    proposedDate,
    proposedTime,
    note,
  } = {}
) {
  const body = { action };
  if (guestKey) body.guest_key = guestKey;
  if (displayName) body.display_name = displayName;
  if (restaurantId != null) body.restaurant_id = restaurantId;
  if (menuItemId != null) body.menu_item_id = menuItemId;
  if (proposedDate) body.proposed_date = proposedDate;
  if (proposedTime) body.proposed_time = proposedTime;
  if (note) body.note = note;
  return apiPost(
    `/public/eat-invitations/${encodeURIComponent(String(token))}/proposals/${encodeURIComponent(String(proposalId))}/resolve`,
    body
  );
}
