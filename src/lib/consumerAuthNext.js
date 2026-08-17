/**
 * Safe in-app return path after consumer login/signup.
 * Only same-origin relative paths are accepted.
 */
export function resolveConsumerAuthNext(location, fallback = "/") {
  const fromState = location?.state?.redirectTo;
  let fromQuery = "";
  try {
    fromQuery = new URLSearchParams(location?.search || "").get("next") || "";
  } catch {
    fromQuery = "";
  }
  const candidate = String(
    (typeof fromState === "string" && fromState.trim()) || fromQuery || ""
  ).trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }
  if (candidate.includes("://") || candidate.toLowerCase().includes("javascript:")) {
    return fallback;
  }
  return candidate;
}

export function withConsumerAuthNext(pathname, nextPath) {
  const dest = String(pathname || "/account/login");
  const next = String(nextPath || "").trim();
  if (!next.startsWith("/") || next.startsWith("//")) return dest;
  const join = dest.includes("?") ? "&" : "?";
  return `${dest}${join}next=${encodeURIComponent(next)}`;
}
