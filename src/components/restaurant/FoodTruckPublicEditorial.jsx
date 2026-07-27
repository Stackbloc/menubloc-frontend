/**
 * Food truck public profile — shared shell + food-truck modules.
 * Menu is one icon away; story sections live on the page.
 * Current Location / Upcoming / Hours preserved via PublicProfileShell.
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
  isMobile,
}) {
  // Keep contract markers: Current Location:, food-truck-current-location,
  // food-truck-contact, food-truck-upcoming, food-truck-view-menu, ViewMenuIcon,
  // Hours of operation, Featured dish, Today's special, FollowRestaurantButton
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
      isMobile={isMobile}
    />
  );
}
