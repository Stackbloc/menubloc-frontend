/**
 * Visible website label for public profiles: hostname only (e.g. tomswatchbar.com).
 * Strip protocol, path, trailing slash, and leading www. Keep href as absolute URL separately.
 */
export function formatWebsiteHostLabel(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const host = new URL(withProto).hostname.replace(/^www\./i, "");
    return host || s;
  } catch {
    return (
      s
        .replace(/^https?:\/\//i, "")
        .split("/")[0]
        .replace(/^www\./i, "")
        .replace(/\/$/, "") || s
    );
  }
}
