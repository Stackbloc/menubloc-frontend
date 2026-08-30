/**
 * Shared Menuply account invitation copy for consumer share + landing surfaces.
 */

import { normalizeConsumerShareUrl } from "../components/share/shareUtils.js";

export const MENUPLY_ACCOUNT_INVITE_HEADLINE = "Open a free Menuply account";

export const MENUPLY_ACCOUNT_INVITE_BODY =
  "Create a free Menuply account to connect with friends, post food videos, and plan where to eat.";

export function menuplySignupPath(nextPath = "/feed") {
  const next = String(nextPath || "/feed").trim() || "/feed";
  return `/diner/signup?next=${encodeURIComponent(next)}`;
}

export function menuplyLoginPath(nextPath = "/feed") {
  const next = String(nextPath || "/feed").trim() || "/feed";
  return `/account/login?next=${encodeURIComponent(next)}`;
}

export function menuplySignupUrl(nextPath = "/feed") {
  return normalizeConsumerShareUrl(menuplySignupPath(nextPath)) || "";
}

/**
 * Append account invitation to outbound share text (SMS, Copy Link body).
 * @param {string} text
 * @param {{ nextPath?: string, includeSignupUrl?: boolean }} [opts]
 */
export function appendMenuplyAccountInviteToShareText(text, { nextPath = "/feed", includeSignupUrl = true } = {}) {
  const base = String(text || "").trim();
  const inviteLine = `${MENUPLY_ACCOUNT_INVITE_HEADLINE} — ${MENUPLY_ACCOUNT_INVITE_BODY}`;
  const signup = includeSignupUrl ? menuplySignupUrl(nextPath) : "";
  const parts = [base, inviteLine];
  if (signup && !base.includes(signup)) parts.push(signup);
  return parts.filter(Boolean).join("\n\n").trim();
}

export function invitePathFromShareUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "/feed";
  try {
    const parsed = new URL(raw, "https://menuply.com");
    return `${parsed.pathname}${parsed.search}` || "/feed";
  } catch {
    return "/feed";
  }
}
