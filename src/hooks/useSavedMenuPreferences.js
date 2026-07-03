import { useMemo } from "react";
import { useConsumer } from "../context/ConsumerContext.jsx";
import {
  buildDietPrefsFromProfile,
  buildEnabledAllergenKeys,
  hasSavedMenuPreferences,
} from "../lib/menuClientPreferenceFilter.js";

/**
 * Saved account dietary/allergen preferences for local menu toggle (not API params).
 */
export default function useSavedMenuPreferences() {
  const { isAuthenticated, allergenPreferences, dietaryPreferences } = useConsumer();

  const dietPrefs = useMemo(
    () => buildDietPrefsFromProfile(dietaryPreferences, isAuthenticated),
    [dietaryPreferences, isAuthenticated]
  );

  const enabledAllergenKeys = useMemo(
    () => buildEnabledAllergenKeys(allergenPreferences, isAuthenticated),
    [allergenPreferences, isAuthenticated]
  );

  const hasSavedPreferences = useMemo(
    () => isAuthenticated && hasSavedMenuPreferences(dietPrefs, enabledAllergenKeys),
    [dietPrefs, enabledAllergenKeys, isAuthenticated]
  );

  const dietPreferenceActive = Object.values(dietPrefs).some(Boolean);
  const allergenPreferenceActive = enabledAllergenKeys.size > 0;

  return {
    dietPrefs,
    enabledAllergenKeys,
    hasSavedPreferences,
    dietPreferenceActive,
    allergenPreferenceActive,
  };
}
