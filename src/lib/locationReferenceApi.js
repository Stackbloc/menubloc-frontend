/**
 * Canonical U.S. location reference API (public read-only).
 */

import { API_BASE } from "./api.js";
import { appendLanguageParam, readStoredLanguage, withLanguageHeaders } from "./languageApi.js";

async function publicGet(path) {
  const language = readStoredLanguage();
  const localizedPath = appendLanguageParam(path, language);
  const res = await fetch(`${API_BASE}${localizedPath}`, {
    credentials: "omit",
    headers: withLanguageHeaders({ Accept: "application/json" }, language),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }
  return json;
}

export async function fetchUsStates() {
  const data = await publicGet("/public/locations/states");
  return data.states || [];
}

export async function fetchUsCitiesByState(stateCode) {
  const data = await publicGet(
    `/public/locations/cities?state=${encodeURIComponent(String(stateCode || ""))}`
  );
  return data.cities || [];
}

export async function searchUsCities(query, stateCode = null, limit = 20) {
  const q = new URLSearchParams({ q: String(query || "").trim() });
  if (stateCode) q.set("state", String(stateCode));
  if (limit) q.set("limit", String(limit));
  const data = await publicGet(`/public/locations/cities/search?${q}`);
  return data.cities || [];
}
