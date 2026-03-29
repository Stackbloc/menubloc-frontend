import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getLabelValue } from "../i18n/labels.js";

export const LANGUAGE_STORAGE_KEY = "grubbid_language";
export const SUPPORTED_LANGUAGES = ["en", "es", "zh"];

const LanguageContext = createContext(null);

function normalizeLanguage(value) {
  const next = String(value || "").trim().toLowerCase();
  return SUPPORTED_LANGUAGES.includes(next) ? next : "en";
}

function readStoredLanguage() {
  if (typeof window === "undefined") return "en";
  try {
    return normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return "en";
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => readStoredLanguage());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // ignore storage errors
    }
  }, [language]);

  const value = useMemo(() => {
    const setLanguage = (next) => setLanguageState(normalizeLanguage(next));
    const t = (key, fallback = "", values = undefined) => getLabelValue(language, key, fallback, values);
    return { language, setLanguage, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return value;
}
