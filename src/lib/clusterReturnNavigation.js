import { clusterPath } from "./clusterUrl.js";
import { clusterCityPath } from "./clusterUrl.js";
import { resolveClusterSlug } from "./clusterSlugAliases.js";
import { resolveClusterDisplayName } from "./clusterSeoContent.js";

export const CLUSTER_FROM = "cluster";
export const CLUSTER_CITY_FROM = "cluster_city";
export const RETURN_TO_QUERY_KEY = "returnTo";
export const RETURN_LABEL_QUERY_KEY = "returnLabel";

export function buildClusterReturnPath(cluster = {}, { view = "menu" } = {}) {
  const path = clusterPath({
    state: cluster.state,
    city: cluster.city,
    slug: resolveClusterSlug(cluster.slug),
  });
  if (!path) return "/clusters";
  const normalizedView = String(view || "").trim().toLowerCase();
  if (normalizedView === "restaurants" || normalizedView === "menu" || normalizedView === "menu-items") {
    const viewParam = normalizedView === "menu-items" ? "menu" : normalizedView;
    return `${path}?view=${viewParam}`;
  }
  return path;
}

export function buildClusterFoodReturnPath(cluster = {}) {
  return buildClusterReturnPath(cluster, { view: "menu" });
}

export function buildClusterRestaurantsReturnPath(cluster = {}) {
  return buildClusterReturnPath(cluster, { view: "restaurants" });
}

export function isPlaceScopedReturn(returnNavigation) {
  const from = String(returnNavigation?.from || "").trim();
  return from === CLUSTER_FROM || from === CLUSTER_CITY_FROM;
}

export function isSinglePlaceReturn(returnNavigation) {
  return String(returnNavigation?.from || "").trim() === CLUSTER_FROM;
}

export function clusterReturnLabel(cluster = {}) {
  return resolveClusterDisplayName(cluster) || "destination";
}

export function appendClusterReturnQuery(path, returnTo, label, { from = CLUSTER_FROM } = {}) {
  if (!path || !returnTo) return path;
  const [pathname, existingQuery = ""] = String(path).split("?");
  const params = new URLSearchParams(existingQuery);
  params.set("from", from);
  params.set(RETURN_TO_QUERY_KEY, returnTo);
  if (label) params.set(RETURN_LABEL_QUERY_KEY, label);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function resolveReturnTarget(searchParams, { fallback = "/clusters" } = {}) {
  const from = String(searchParams?.get("from") || "").trim();
  if (from !== CLUSTER_FROM && from !== CLUSTER_CITY_FROM && from !== "search") return null;
  const returnTo = String(searchParams?.get(RETURN_TO_QUERY_KEY) || "").trim();
  if (returnTo.startsWith("/")) return returnTo;
  if (from === CLUSTER_FROM || from === CLUSTER_CITY_FROM) return fallback;
  return null;
}

export function resolveReturnLabel(searchParams, fallback = "destination") {
  const label = String(searchParams?.get(RETURN_LABEL_QUERY_KEY) || "").trim();
  return label || fallback;
}

export function hasClusterReturnContext(searchParams) {
  const from = String(searchParams?.get("from") || "").trim();
  return from === CLUSTER_FROM || from === CLUSTER_CITY_FROM;
}

export function buildClusterCityReturnPath({ state, city }) {
  return clusterCityPath({ state, city }) || "/clusters";
}

export function returnContextExtraParams(searchParams) {
  const from = String(searchParams?.get("from") || "").trim();
  if (from !== CLUSTER_FROM && from !== CLUSTER_CITY_FROM) return {};
  const returnTo = resolveReturnTarget(searchParams);
  if (!returnTo) return {};
  const extras = { from, returnTo };
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
