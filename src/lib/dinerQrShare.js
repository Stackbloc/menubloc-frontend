/**
 * Personal Diner QR share payload — menuply.com locked.
 */

import { normalizeConsumerShareUrl } from "../components/share/shareUtils.js";

export function menuplyDinerQrUrl(scanUrlOrToken) {
  const raw = String(scanUrlOrToken || "").trim();
  if (!raw) return "";
  try {
    if (/^[0-9a-f-]{36}$/i.test(raw)) {
      return normalizeConsumerShareUrl(`https://menuply.com/d/${raw}`) || "";
    }
    const parsed = new URL(raw, "https://menuply.com");
    return (
      normalizeConsumerShareUrl(`https://menuply.com${parsed.pathname}${parsed.search}`) || ""
    );
  } catch {
    return normalizeConsumerShareUrl(raw) || "";
  }
}

/**
 * First name + last initial for invitation chrome (e.g. "Andre B.").
 * Matches backend formatDinerQrStripLabel.
 */
export function formatDinerInviteName(displayName) {
  const parts = String(displayName || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 28);
  const first = parts[0];
  const lastInitial = String(parts[parts.length - 1][0] || "").toUpperCase();
  if (!lastInitial) return first.slice(0, 28);
  return `${first} ${lastInitial}.`.slice(0, 28);
}

/**
 * @param {{ scan_url?: string, token?: string, display_name?: string|null }} opts
 */
export function buildDinerQrShareData({ scan_url, token, display_name } = {}) {
  const url = menuplyDinerQrUrl(scan_url || token);
  if (!url) return null;
  const inviteName = formatDinerInviteName(display_name) || String(display_name || "").trim();
  return {
    title: inviteName ? `${inviteName} on Menuply` : "Connect with me on Menuply",
    text: inviteName
      ? `${inviteName} has invited you to connect on Menuply`
      : "You've been invited to connect on Menuply",
    url,
  };
}
