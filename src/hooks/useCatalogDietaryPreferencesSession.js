import { useCallback, useState } from "react";
import {
  readCatalogApplyDietaryPreferences,
  writeCatalogApplyDietaryPreferences,
} from "../lib/menuCatalogBrowsePreferences.js";

/**
 * Yellow Browser: once the user enables dietary preferences, keep them on for
 * the whole browse tab session (all subsequent menus until removed).
 */
export default function useCatalogDietaryPreferencesSession() {
  const [applySavedPreferences, setApplySavedPreferences] = useState(
    () => readCatalogApplyDietaryPreferences()
  );

  const setApplySavedPreferencesForSession = useCallback((next) => {
    const enabled = next === true;
    setApplySavedPreferences(enabled);
    writeCatalogApplyDietaryPreferences(enabled);
  }, []);

  return [applySavedPreferences, setApplySavedPreferencesForSession];
}
