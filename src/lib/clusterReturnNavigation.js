import { clusterPath } from "./clusterUrl.js";

export const CLUSTER_FROM = "cluster";
export const RETURN_TO_QUERY_KEY = "returnTo";
export const RETURN_LABEL_QUERY_KEY = "returnLabel";

export function buildClusterFoodReturnPath(cluster = {}) {
  const path = clusterPath({
    state: cluster.state,
    city: cluster.city,
    slug: cluster.slug,
  });
  return path ? `${path}?view=menu` : "/clusters";
}

export function clusterReturnLabel(cluster = {}) {
  return cluster.area_name || cluster.name || "destination";
}

export function appendClusterReturnQuery(path, returnTo, label) {
  if (!path || !returnTo) return path;
  const [pathname, existingQuery = ""] = String(path).split("?");
  const params = new URLSearchParams(existingQuery);
  params.set("from", CLUSTER_FROM);
  params.set(RETURN_TO_QUERY_KEY, returnTo);
  if (label) params.set(RETURN_LABEL_QUERY_KEY, label);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function resolveReturnTarget(searchParams, { fallback = "/clusters" } = {}) {
  const from = String(searchParams?.get("from") || "").trim();
  if (from !== CLUSTER_FROM && from !== "search") return null;
  const returnTo = String(searchParams?.get(RETURN_TO_QUERY_KEY) || "").trim();
  if (returnTo.startsWith("/")) return returnTo;
  if (from === CLUSTER_FROM) return fallback;
  return null;
}

export function resolveReturnLabel(searchParams, fallback = "destination") {
  const label = String(searchParams?.get(RETURN_LABEL_QUERY_KEY) || "").trim();
  return label || fallback;
}

export function hasClusterReturnContext(searchParams) {
  return String(searchParams?.get("from") || "").trim() === CLUSTER_FROM;
}

export function returnContextExtraParams(searchParams) {
  if (!hasClusterReturnContext(searchParams)) return {};
  const returnTo = resolveReturnTarget(searchParams);
  if (!returnTo) return {};
  const extras = { from: CLUSTER_FROM, returnTo };
  const label = resolveReturnLabel(searchParams, "");
  if (label) extras[RETURN_LABEL_QUERY_KEY] = label;
  return extras;
}

export function buildMenuItemDetailQuery({ geo = {}, returnNavigation = null } = {}) {
  const params = new URLSearchParams();
  if (returnNavigation?.returnTo) {
    params.set("from", returnNavigation.from || CLUSTER_FROM);
    params.set(RETURN_TO_QUERY_KEY, returnNavigation.returnTo);
    if (returnNavigation.label) params.set(RETURN_LABEL_QUERY_KEY, returnNavigation.label);
  } else {
    params.set("from", "search");
  }
  if (geo.city) params.set("city", geo.city);
  if (geo.state) params.set("state", geo.state);
  if (geo.near) params.set("near", geo.near);
  if (geo.zip) params.set("zip", geo.zip);
  if (geo.lat != null && geo.lng != null) {
    params.set("lat", String(geo.lat));
    params.set("lng", String(geo.lng));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function buildItemRowDetailHref(hrefBase, { geo = {}, returnNavigation = null } = {}) {
  if (!hrefBase) return null;
  const query = buildMenuItemDetailQuery({ geo, returnNavigation });
  return `${hrefBase}${query || "?from=search"}`;
}

export function returnNavigationExtraParams(returnNavigation) {
  if (!returnNavigation?.returnTo) return {};
  const extras = {
    from: returnNavigation.from || CLUSTER_FROM,
    returnTo: returnNavigation.returnTo,
  };
  if (returnNavigation.label) extras[RETURN_LABEL_QUERY_KEY] = returnNavigation.label;
  return extras;
}
