/**
 * Feed shell Search tab — the app's Search home (AppSearchHome, Andre 2026-10-29) + in-shell results,
 * with a [ Search | Menu Browser ] toggle over the search box. Menu Browser mode embeds the
 * /browse-menus experience. Both modes share the typed query; Search is the default.
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppSearchHome from "../../../components/consumer/feed/AppSearchHome.jsx";
import GrubbidSearchResults from "../../GrubbidSearchResults.jsx";
import BrowseMenus from "../../BrowseMenus.jsx";
import SearchShopModeToggle from "../../../components/consumer/feed/SearchShopModeToggle.jsx";
import { isFeedShellSearchResultsView } from "../../../lib/feedShellNavigation.js";
import {
  SEARCH_SHOP_MODE_MENU_BROWSER,
  buildSearchShopModeSearch,
  resolveSearchShopMode,
} from "../../../lib/searchShopMode.js";

export default function FeedSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = resolveSearchShopMode(searchParams);
  const isMenuBrowser = mode === SEARCH_SHOP_MODE_MENU_BROWSER;
  const showResults = !isMenuBrowser && isFeedShellSearchResultsView(searchParams);
  // Typed (not yet submitted) query survives the mode switch.
  const [draftQuery, setDraftQuery] = useState(() => String(searchParams.get("q") || ""));

  function changeMode(nextMode) {
    setSearchParams(buildSearchShopModeSearch(searchParams, nextMode), { replace: true });
  }

  const toggle = <SearchShopModeToggle mode={mode} onChange={changeMode} />;

  return (
    <div
      style={{ minHeight: "100dvh", background: "var(--gb-color-page)" }}
      data-testid={
        isMenuBrowser ? "feed-shop-menu-browser-page" : showResults ? "feed-shop-results-page" : "feed-shop-page"
      }
      data-search-shop-mode={mode}
    >
      {isMenuBrowser ? (
        <BrowseMenus
          embedInFeedShell
          modeToggleSlot={toggle}
          initialQuery={draftQuery}
          onQueryChange={setDraftQuery}
        />
      ) : showResults ? (
        <GrubbidSearchResults embedInFeedShell modeToggleSlot={toggle} />
      ) : (
        <AppSearchHome
          modeToggleSlot={toggle}
          initialQuery={draftQuery}
          onDraftQueryChange={setDraftQuery}
        />
      )}
    </div>
  );
}
