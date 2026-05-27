import { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from "../context/LanguageContext.jsx";

export { LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES };

export function normalizeLanguage(value) {
  const next = String(value || "").trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(next) ? next : "en";
}

export function readStoredLanguage() {
  if (typeof window === "undefined") return "en";
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return "en";
  }
}

export function appendLanguageParam(pathOrUrl, language = readStoredLanguage()) {
  const lang = normalizeLanguage(language);
  if (!lang || lang === "en") return pathOrUrl;

  const raw = String(pathOrUrl || "");
  const hashIndex = raw.indexOf("#");
  const hash = hashIndex >= 0 ? raw.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
  const [pathname, query = ""] = withoutHash.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", lang);
  const qs = params.toString();
  return `${pathname}${qs ? `?${qs}` : ""}${hash}`;
}

export function buildLocalizedApiUrl(path, language = readStoredLanguage()) {
  const base = String(import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");
  const normalizedPath = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${appendLanguageParam(normalizedPath, language)}`;
}

export function withLanguageHeaders(headers = {}, language = readStoredLanguage()) {
  const lang = normalizeLanguage(language);
  if (!lang || lang === "en") return headers;
  return {
    ...headers,
    "X-Menuply-Language": lang,
  };
}
