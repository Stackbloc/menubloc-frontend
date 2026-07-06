import { useCallback, useState } from "react";
import {
  readCatalogApplyDietaryPreferences,
  writeCatalogApplyDietaryPreferences,
} from "../lib/menuCatalogBrowsePreferences.js";

/**
 * Saved dietary preferences apply by default for the browse tab session.
 * User may opt out per session; allergens always follow profile settings.
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
