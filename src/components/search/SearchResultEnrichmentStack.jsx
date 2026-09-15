/**
 * Unified search-result enrichment stack.
 * Fixed display order (not ranking order): Video → Connect → Deal.
 * Omits absent modules; does not reserve empty space.
 */
import SearchResultVideoStrip from "./SearchResultVideoCard.jsx";
import SearchResultSocialActivity from "./SearchResultSocialActivity.jsx";
import SearchResultDealModule, { isTemporallyValid } from "./SearchResultDealModule.jsx";

/**
 * @param {object} props
 * @param {Array|null} props.videos
 * @param {Array|null} props.socialActivity
 * @param {object|null} props.deal
 * @param {string|null} props.seeAllHref
 * @param {boolean} props.omitRestaurantContext
 * @param {string|number|null} props.restaurantId
 * @param {string|null} props.restaurantName
 */
export default function SearchResultEnrichmentStack({
  videos = null,
  socialActivity = null,
  deal = null,
  seeAllHref = null,
  omitRestaurantContext = false,
  restaurantId = null,
  restaurantName = null,
}) {
  const hasVideos = Array.isArray(videos) && videos.some((v) => v?.video_url);
  const hasSocial =
    Array.isArray(socialActivity) &&
    socialActivity.some((row) => row && String(row.line || "").trim());
  const hasDeal =
    Boolean(deal) &&
    isTemporallyValid(deal) &&
    Boolean(String(deal.headline || deal.title || "").trim());

  if (!hasVideos && !hasSocial && !hasDeal) return null;

  return (
    <div data-testid="search-result-enrichment" style={{ minWidth: 0 }}>
      {/* Module order §5: Video → Connect → Deal */}
      <SearchResultVideoStrip
        videos={videos}
        seeAllHref={seeAllHref}
        omitRestaurantContext={omitRestaurantContext}
      />
      <SearchResultSocialActivity items={socialActivity} />
      <SearchResultDealModule
        deal={deal}
        restaurantId={restaurantId}
        restaurantName={restaurantName}
      />
    </div>
  );
}
