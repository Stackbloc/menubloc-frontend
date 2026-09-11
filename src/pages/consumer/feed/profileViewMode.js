/**
 * Own-profile Edit ↔ Connect view.
 *
 * Browser URL can update while React Router's location.search stays stale
 * (navigate replace search-only). UI state is owned by FeedShell; URL is written
 * from window.location.search so toggles do not stick on ?view=connect.
 */

export function readConnectViewFromSearch(search) {
  return new URLSearchParams(String(search || "")).get("view") === "connect";
}

export function readConnectViewFromWindow() {
  if (typeof window === "undefined") return false;
  return readConnectViewFromSearch(window.location.search);
}

/** Build search params for the next view, preserving other query keys from the live URL. */
export function buildProfileViewSearchParams(nextConnect) {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  if (nextConnect) params.set("view", "connect");
  else params.delete("view");
  return params;
}
