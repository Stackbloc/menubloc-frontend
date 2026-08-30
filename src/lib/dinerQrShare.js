/**
 * Personal Diner QR share payload — menuply.com locked.
 */

import { normalizeConsumerShareUrl } from "../components/share/shareUtils.js";
import {
  appendMenuplyAccountInviteToShareText,
  MENUPLY_ACCOUNT_INVITE_BODY,
} from "./menuplyAccountInvite.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function extractDinerQrToken(scanUrlOrToken) {
  const raw = String(scanUrlOrToken || "").trim();
  if (!raw) return "";
  if (UUID_RE.test(raw)) return raw.toLowerCase();
  try {
    const parsed = new URL(raw, "https://menuply.com");
    const parts = parsed.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "d" || p === "connect");
    const candidate = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
    if (UUID_RE.test(String(candidate || ""))) return String(candidate).toLowerCase();
  } catch {
    // fall through
  }
  return "";
}

/** QR scan encoding — phone cameras open /d/{token}. */
export function menuplyDinerQrUrl(scanUrlOrToken) {
  const token = extractDinerQrToken(scanUrlOrToken);
  if (!token) {
    const raw = String(scanUrlOrToken || "").trim();
    return raw ? normalizeConsumerShareUrl(raw) || "" : "";
  }
  return normalizeConsumerShareUrl(`https://menuply.com/d/${token}`) || "";
}

/** Copy Link share — invite landing with signup + connect. */
export function menuplyDinerConnectUrl(scanUrlOrToken) {
  const token = extractDinerQrToken(scanUrlOrToken);
  if (!token) return "";
  return normalizeConsumerShareUrl(`https://menuply.com/connect/d/${token}`) || "";
}

export function isDinerQrConnectPath(path) {
  const raw = String(path || "").trim();
  if (!raw.startsWith("/connect/d/")) return false;
  const token = raw.slice("/connect/d/".length).split(/[?#]/)[0];
  return UUID_RE.test(token);
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
  const url = menuplyDinerConnectUrl(scan_url || token);
  if (!url) return null;
  const inviteName = formatDinerInviteName(display_name) || String(display_name || "").trim();
  const connectPath = `/connect/d/${extractDinerQrToken(scan_url || token)}`;
  const baseText = inviteName
    ? `${inviteName} invited you to connect on Menuply. ${MENUPLY_ACCOUNT_INVITE_BODY}`
    : `You've been invited to connect on Menuply. ${MENUPLY_ACCOUNT_INVITE_BODY}`;
  return {
    title: inviteName ? `Connect with ${inviteName} on Menuply` : "Connect on Menuply",
    text: appendMenuplyAccountInviteToShareText(`${baseText}\n${url}`.trim(), {
      nextPath: connectPath,
    }),
    url,
  };
}
