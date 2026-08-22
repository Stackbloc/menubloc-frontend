/**
 * Dining Crew invite share payload — menuply.com locked.
 * Path shares delegate to shareUtils; invite URLs rewrite any host to pathname on menuply.com.
 */

import { toConsumerShareAbsolute } from "../components/share/shareUtils.js";

/**
 * Force invite URLs onto https://menuply.com (never preview / share.google / API origins).
 * @param {string} apiUrl
 * @returns {string}
 */
export function menuplyDiningCrewInviteUrl(apiUrl) {
  const raw = String(apiUrl || "").trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw, "https://menuply.com");
    return toConsumerShareAbsolute(`${parsed.pathname}${parsed.search}`) || "";
  } catch {
    return toConsumerShareAbsolute(raw) || "";
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

/** Path / invite share for My Menuply events — rewrites foreign hosts like invite URLs. */
export function buildMenuplyPathShareData(path, { title, text } = {}) {
  const url = menuplyDiningCrewInviteUrl(path);
  if (!url) return null;
  return {
    title: title || "Menuply",
    text: text || "",
    url,
  };
}

/** Join Me link for diner social events (My Events). */
export function buildSocialEventJoinShareData({ title, joinPath }) {
  const url = menuplyDiningCrewInviteUrl(joinPath);
  if (!url) return null;
  const name = String(title || "my event").trim();
  return {
    title: `Join me: ${name}`,
    text: `Join me at ${name} on Menuply.`,
    url,
  };
}
