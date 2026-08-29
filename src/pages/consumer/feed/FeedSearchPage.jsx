/**
 * Feed shell Shop tab — original Menuply search discovery (HomeNext) + in-shell results.
 */

import { useSearchParams } from "react-router-dom";
import HomeNext from "../../HomeNext.jsx";
import GrubbidSearchResults from "../../GrubbidSearchResults.jsx";
import { isFeedShellSearchResultsView } from "../../../lib/feedShellNavigation.js";

export default function FeedSearchPage() {
  const [searchParams] = useSearchParams();
  const showResults = isFeedShellSearchResultsView(searchParams);

  return (
    <div
      style={{ minHeight: "100dvh", background: "var(--gb-color-page)" }}
      data-testid={showResults ? "feed-shop-results-page" : "feed-shop-page"}
    >
      {showResults ? (
        <GrubbidSearchResults embedInFeedShell />
      ) : (
        <HomeNext embedInFeedShell />
      )}
    </div>
  );
}
