import React from "react";
import { Navigate, useParams, useSearchParams } from "react-router-dom";
import { CLUSTER_CATEGORY_QUERY_KEY } from "../lib/clusterShareFilters.js";

/**
 * Old "Food by type" screen (2026-10-28). Andre 2026-11-05: the cluster page follows the app, so the
 * nutrition chips now sit right above the Food boxes on the cluster page itself. Old links land there,
 * with the picked food type (?category=) kept.
 */
export default function ClusterFoodByTypePage() {
  const { stateSlug, citySlug, clusterSlug } = useParams();
  const [searchParams] = useSearchParams();
  const category = String(searchParams.get(CLUSTER_CATEGORY_QUERY_KEY) || "").trim().toUpperCase();
  const qs = category ? `?${new URLSearchParams({ [CLUSTER_CATEGORY_QUERY_KEY]: category }).toString()}` : "";
  return <Navigate to={`/clusters/${stateSlug}/${citySlug}/${clusterSlug}${qs}`} replace />;
}
