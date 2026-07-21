/**
 * Provider area API — consumer session cookies.
 */
import { appendLanguageParam, readStoredLanguage, withLanguageHeaders } from "./languageApi.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

async function req(path, opts = {}) {
  const language = opts.language || readStoredLanguage();
  const localizedPath = appendLanguageParam(path, language);
  const res = await fetch(`${API}${localizedPath}`, {
    credentials: "include",
    headers: withLanguageHeaders(
      { "Content-Type": "application/json", ...(opts.headers || {}) },
      language
    ),
    ...opts,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.payload = json;
    throw error;
  }
  return json;
}

const get = (path) => req(path);
const post = (path, body) => req(path, { method: "POST", body: JSON.stringify(body || {}) });
const patch = (path, body) => req(path, { method: "PATCH", body: JSON.stringify(body || {}) });

export const getProviderMe = () => get("/api/provider/me");
export const applyAsProvider = (body) => post("/api/provider/apply", body);
export const updateProviderProfile = (body) => patch("/api/provider/profile", body);
export const getProviderListings = () => get("/api/provider/listings");
export const createProviderListing = (body) => post("/api/provider/listings", body);
export const updateProviderListing = (id, body) =>
  patch(`/api/provider/listings/${encodeURIComponent(id)}`, body);
export const getProviderProjects = () => get("/api/provider/projects");
export const getProviderProject = (id) => get(`/api/provider/projects/${encodeURIComponent(id)}`);
export const deliverProviderProject = (id, delivery_file_url) =>
  post(`/api/provider/projects/${encodeURIComponent(id)}/deliver`, { delivery_file_url });
