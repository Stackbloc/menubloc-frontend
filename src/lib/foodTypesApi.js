/**
 * Food suggestions for Post's "What are you eating?" (Andre 2026-10-29): GET /public/food-types?q=…
 * returns food names only — how foods are organized stays on the server. A picked name is posted as
 * the food name and the server finds its type.
 */
import { apiGet } from "./api.js";

export async function searchFoodTypes(q) {
  const data = await apiGet(`/public/food-types?${new URLSearchParams({ q: String(q || ""), limit: "6" }).toString()}`);
  return Array.isArray(data?.results) ? data.results.filter((r) => typeof r?.name === "string" && r.name.trim()) : [];
}
