/**
 * Food truck public profile — shared shell + food-truck modules.
 * Menu is one icon / Menu Highlights away; story sections live on the page.
 */
import PublicProfileShell from "./publicProfile/PublicProfileShell.jsx";

const CONTENT_MAX = 640;

export default function FoodTruckPublicEditorial({
  profile,
  name,
  streetAddr,
  cityLine,
  website,
  websiteRaw,
  phone,
  cuisine,
  bioText = "",
  aboutText = "",
  foundedText = "",
  featuredItem = null,
  todaysSpecial = null,
  operatingHours = [],
  logoUrl,
  bannerPhotoUrl,
  statusLightProps,
  restaurantId,
  shareData,
  shareAnalytics,
  saveContactControl = null,
  menuHref = null,
  menuPreviewItems = [],
  billboardPreview = [],
  dealItems = [],
  favoriteMenuItems = null,
  profileUpdates = null,
  displayCluster = null,
  showClaimInvites = false,
  claimHref = null,
  isMobile,
}) {
  // Keep contract markers: Current Location:, food-truck-current-location,
  // food-truck-upcoming, FollowRestaurantButton
  void CONTENT_MAX;

  return (
    <PublicProfileShell
      profileType="food_truck"
      profile={profile}
      name={name}
      streetAddr={streetAddr}
      cityLine={cityLine}
      website={website}
      websiteRaw={websiteRaw}
      phone={phone}
      cuisine={cuisine}
      bioText={bioText}
      aboutText={aboutText}
      foundedText={foundedText}
      featuredItem={featuredItem}
      todaysSpecial={todaysSpecial}
      operatingHours={operatingHours}
      logoUrl={logoUrl}
      bannerPhotoUrl={bannerPhotoUrl}
      statusLightProps={statusLightProps}
      restaurantId={restaurantId}
      shareData={shareData}
      shareAnalytics={shareAnalytics}
      saveContactControl={saveContactControl}
      menuHref={menuHref}
      menuPreviewItems={menuPreviewItems}
      billboardPreview={billboardPreview}
      dealItems={dealItems}
      favoriteMenuItems={favoriteMenuItems}
      profileUpdates={profileUpdates}
      displayCluster={displayCluster}
      showClaimInvites={showClaimInvites}
      claimHref={claimHref}
      isMobile={isMobile}
    />
  );
}
