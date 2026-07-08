import { useCallback, useEffect, useState } from "react";
import {
  readCatalogApplyDietaryPreferences,
  writeCatalogApplyDietaryPreferences,
} from "../lib/menuCatalogBrowsePreferences.js";

/**
 * Saved dietary preferences apply by default for each visit.
 * User may opt out while browsing; opt-out is in-memory (not persisted across reloads).
 */
export default function useCatalogDietaryPreferencesSession(dietPreferenceActive = false) {
  const [applySavedPreferences, setApplySavedPreferences] = useState(
    () => readCatalogApplyDietaryPreferences()
  );

  const setApplySavedPreferencesForSession = useCallback((next) => {
    const enabled = next === true;
    setApplySavedPreferences(enabled);
    writeCatalogApplyDietaryPreferences(enabled);
  }, []);

  useEffect(() => {
    if (dietPreferenceActive && readCatalogApplyDietaryPreferences()) {
      setApplySavedPreferences(true);
    }
  }, [dietPreferenceActive]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onReset = () => setApplySavedPreferences(true);
    window.addEventListener("menuply:menu-prefs-reset", onReset);
    return () => window.removeEventListener("menuply:menu-prefs-reset", onReset);
  }, []);

  return [applySavedPreferences, setApplySavedPreferencesForSession];
}
