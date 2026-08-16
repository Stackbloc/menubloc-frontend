/**
 * Dining Crew invite share payload — menuply.com locked.
 * Reuses consumer share normalization; for ShareModal (Copy Link primary).
 */

import { normalizeConsumerShareUrl } from "../components/share/shareUtils.js";

/**
 * Force invite URLs onto https://menuply.com (never preview / share.google origins).
 * @param {string} apiUrl
 * @returns {string}
 */
export function menuplyDiningCrewInviteUrl(apiUrl) {
  const raw = String(apiUrl || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, "https://menuply.com");
    return (
      normalizeConsumerShareUrl(`https://menuply.com${parsed.pathname}${parsed.search}`) || ""
    );
  } catch {
    return normalizeConsumerShareUrl(raw) || "";
  }
}

/**
 * @param {string} inviteUrl - raw API invitation URL
 * @returns {{ title: string, text: string, url: string } | null}
 */
export function buildDiningCrewInviteShareData(inviteUrl) {
  const url = menuplyDiningCrewInviteUrl(inviteUrl);
  if (!url) return null;
  return {
    title: "Join my Dining Crew on Menuply",
    text: "Join my Dining Crew on Menuply — let's decide where and what to eat together.",
    url,
  };
}
