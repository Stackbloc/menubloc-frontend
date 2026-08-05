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
  featuredItem = null,
  landmarks,
  logoUrl,
  bannerPhotoUrl,
  statusLightProps,
  restaurantId,
  menuHref,
  shareData,
  shareAnalytics,
  menuPreviewItems,
  menuItemCount = 0,
  menuCount = 0,
  billboardPreview,
  dealItems,
  displayCluster,
  statusBanners,
  statusEventPresentations,
  operatingHours = [],
  profile = null,
  favoriteMenuItems = null,
  profileUpdates = null,
  claimHref = null,
  claimState = null,
  showClaimInvites = false,
  isMobile,
}) {
  // IdentityBlock / FollowRestaurantButton live in PublicProfileShell.
  // Keep string markers for contracts: View Menu, Favorite Menu Items
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
      featuredItem={featuredItem}
      landmarks={landmarks}
      logoUrl={logoUrl}
      bannerPhotoUrl={bannerPhotoUrl}
      statusLightProps={statusLightProps}
      restaurantId={restaurantId}
      menuHref={menuHref}
      shareData={shareData}
      shareAnalytics={shareAnalytics}
      menuPreviewItems={menuPreviewItems}
      menuItemCount={menuItemCount}
      menuCount={menuCount}
      billboardPreview={billboardPreview}
      dealItems={dealItems}
      favoriteMenuItems={favoriteMenuItems}
      profileUpdates={profileUpdates}
      displayCluster={displayCluster}
      statusBanners={statusBanners}
      statusEventPresentations={statusEventPresentations}
      operatingHours={operatingHours}
      claimHref={claimHref}
      claimState={claimState}
      showClaimInvites={showClaimInvites}
      isMobile={isMobile}
    />
  );
}
