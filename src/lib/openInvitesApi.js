/**
 * Open Invite API (Andre 2026-11-09). The server enforces who can see and join.
 * join_capacity is how many people can accept, not restaurant seating.
 */
import { apiGet, apiPatch, apiPost } from "./api.js";

const base = (token) => `/api/consumer/open-invites/${encodeURIComponent(String(token))}`;

export const getHostOptions = () => apiGet("/api/consumer/open-invites/options").then((d) => d.options);
export const getOpenInvite = (token) => apiGet(base(token)).then((d) => d.open_invite);
export const createOpenInvite = (body) => apiPost("/api/consumer/open-invites", body).then((d) => d.open_invite);
export const updateOpenInvite = (token, body) => apiPatch(base(token), body).then((d) => d.open_invite);
export const joinOpenInvite = (token) => apiPost(`${base(token)}/join`, {}).then((d) => d.open_invite);
export const leaveOpenInvite = (token) => apiPost(`${base(token)}/leave`, {});
export const cancelOpenInvite = (token) => apiPost(`${base(token)}/cancel`, {});
export const answerWent = (token, went) => apiPost(`${base(token)}/went`, { went });
export const removeJoiner = (token, userId) => apiPost(`${base(token)}/joiners/${Number(userId)}/remove`, {});

/** "2026-11-09" + "12:30" in the browser's own time zone, as one instant. */
export function startsAtIso(date, time) {
  const [y, mo, d] = String(date).split("-").map(Number);
  const [h, m] = String(time).split(":").map(Number);
  return new Date(y, mo - 1, d, h, m).toISOString();
}

export function spotsText(n) {
  return n === 1 ? "1 spot left" : `${n} spots left`;
}

/** The picker's chips, in order. A chip this host can't use isn't offered. */
export function audienceChips(options) {
  const chips = [{ value: "connects_only", label: "Connects only", helper: "Only your Connects can see and join" }];
  if (options?.connects_of_connects) {
    chips.push({ value: "connects_of_connects", label: "Connects’ Connects", helper: "Your Connects and their Connects can see and join" });
  }
  if (options?.student_label) {
    chips.push({
      value: "confirmed_students",
      label: options.student_label,
      helper: `Your Connects, their Connects and verified ${options.student_label} can see and join`,
    });
  }
  if (options?.anyone) chips.push({ value: "anyone", label: "Anyone", helper: "Anyone on Menuply can see and join" });
  return chips;
}

export function filterOpenInvites(list, meal, place) {
  return list.filter((i) => (!meal || i.meal_period === meal) && (!place || i.restaurant_name === place));
}
