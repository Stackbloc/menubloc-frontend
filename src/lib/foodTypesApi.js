/**
 * Common Knowledge food types for Post's "What are you eating?" (Andre 2026-10-29):
 * GET /public/food-types?q=… suggests them while typing, like restaurant names.
 */
import { apiGet } from "./api.js";

export async function searchFoodTypes(q) {
  const data = await apiGet(`/public/food-types?${new URLSearchParams({ q: String(q || ""), limit: "6" }).toString()}`);
  return Array.isArray(data?.results) ? data.results.filter((r) => r?.code && r?.name) : [];
}
