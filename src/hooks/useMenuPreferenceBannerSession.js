import { useCallback, useEffect, useState } from "react";
import {
  readMenuPreferenceDetailedBannerSeen,
  writeMenuPreferenceDetailedBannerSeen,
} from "../lib/menuCatalogBrowsePreferences.js";

/**
 * First menu view in a session shows the expanded preferences/allergens list.
 * Subsequent menu views show the compact dietary toggle message.
 */
export default function useMenuPreferenceBannerSession(visible = false) {
  const [isFirstMenuView, setIsFirstMenuView] = useState(
    () => !readMenuPreferenceDetailedBannerSeen()
  );

  const markFirstMenuViewSeen = useCallback(() => {
    writeMenuPreferenceDetailedBannerSeen();
    setIsFirstMenuView(false);
  }, []);

  useEffect(() => {
    if (!visible || !isFirstMenuView) return;
    markFirstMenuViewSeen();
  }, [visible, isFirstMenuView, markFirstMenuViewSeen]);

  return { isFirstMenuView, markFirstMenuViewSeen };
}
