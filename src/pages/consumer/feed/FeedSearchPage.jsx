/**
 * Feed shell Search tab — authoritative HomeNext discovery (embed; no HomeNext edits).
 */

import HomeNext from "../../HomeNext.jsx";

export default function FeedSearchPage() {
  return (
    <div data-testid="feed-search-page">
      <HomeNext embedInFeedShell />
    </div>
  );
}
