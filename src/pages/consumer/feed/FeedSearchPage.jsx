/**
 * Feed shell Shop tab — full dish/restaurant search (GrubbidSearchResults) inside the shell.
 */

import GrubbidSearchResults from "../../GrubbidSearchResults.jsx";

export default function FeedSearchPage() {
  return (
    <div data-testid="feed-shop-page">
      <GrubbidSearchResults embedInFeedShell />
    </div>
  );
}
