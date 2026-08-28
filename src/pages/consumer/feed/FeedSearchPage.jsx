/**
 * Feed shell Search tab — discovery (no menu windows) + in-shell results.
 */

import { useSearchParams } from "react-router-dom";
import HomeNext from "../../HomeNext.jsx";
import GrubbidSearchResults from "../../GrubbidSearchResults.jsx";
import { isFeedShellSearchResultsView } from "../../../lib/feedShellNavigation.js";

export default function FeedSearchPage() {
  const [searchParams] = useSearchParams();
  const showResults = isFeedShellSearchResultsView(searchParams);

  return (
    <div data-testid={showResults ? "feed-search-results-page" : "feed-search-page"}>
      {showResults ? (
        <GrubbidSearchResults embedInFeedShell />
      ) : (
        <HomeNext embedInFeedShell />
      )}
    </div>
  );
}
