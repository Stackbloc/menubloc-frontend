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
 * @param {{ scan_url?: string, token?: string, display_name?: string|null }} opts
 */
export function buildDinerQrShareData({ scan_url, token, display_name } = {}) {
  const url = menuplyDinerQrUrl(scan_url || token);
  if (!url) return null;
  const name = String(display_name || "").trim();
  return {
    title: name ? `${name} on Menuply` : "Connect with me on Menuply",
    text: name
      ? `Scan to connect with ${name} on Menuply`
      : "Scan to connect on Menuply",
    url,
  };
}
