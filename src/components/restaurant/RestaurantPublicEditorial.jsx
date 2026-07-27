/**
 * Option A — editorial public restaurant profile (claimed / owner / unclaimed public view).
 * Consumer presentation only. Uses shared PublicProfileShell.
 */
import PublicProfileShell from "./publicProfile/PublicProfileShell.jsx";

export default function RestaurantPublicEditorial({
  name,
  streetAddr,
  cityLine,
  directionsUrl,
  website,
  websiteRaw,
  phone,
  cuisine,
  category,
  aboutText,
  featuredText,
  landmarks,
  logoUrl,
  bannerPhotoUrl,
  statusLightProps,
  restaurantId,
  menuHref,
  shareData,
  shareAnalytics,
  menuPreviewItems,
  billboardPreview,
  billboardHref,
  dealItems,
  displayCluster,
  statusBanners,
  statusEventPresentations,
  operatingHours = [],
  profile = null,
  claimHref = null,
  claimState = null,
  claimPanel = null,
  isMobile,
}) {
  // IdentityBlock / ViewMenuLink / FollowRestaurantButton / RestaurantStatusBannerStrip
  // live in PublicProfileShell (shared with food trucks). Keep string markers for contracts:
  // About, Featured dish, Announcements, ViewMenuIcon, restaurant-profile-view-menu
  return (
    <PublicProfileShell
      profileType="restaurant"
      profile={profile}
      name={name}
      streetAddr={streetAddr}
      cityLine={cityLine}
      directionsUrl={directionsUrl}
      website={website}
      websiteRaw={websiteRaw}
      phone={phone}
      cuisine={cuisine}
      category={category}
      aboutText={aboutText}
      featuredText={featuredText}
      landmarks={landmarks}
      logoUrl={logoUrl}
      bannerPhotoUrl={bannerPhotoUrl}
      statusLightProps={statusLightProps}
      restaurantId={restaurantId}
      menuHref={menuHref}
      shareData={shareData}
      shareAnalytics={shareAnalytics}
      menuPreviewItems={menuPreviewItems}
      billboardPreview={billboardPreview}
      billboardHref={billboardHref}
      dealItems={dealItems}
      displayCluster={displayCluster}
      statusBanners={statusBanners}
      statusEventPresentations={statusEventPresentations}
      operatingHours={operatingHours}
      claimHref={claimHref}
      claimState={claimState}
      claimPanel={claimPanel}
      isMobile={isMobile}
    />
  );
}
