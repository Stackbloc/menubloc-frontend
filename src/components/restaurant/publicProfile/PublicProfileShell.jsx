/**
 * Unified Menuply public profile shell — restaurant homepage layout.
 * Order: Hero → Billboard → Favorite Menu Items → Updates → Deals → Photos → Info
 * (+ FT upcoming stops when food truck entity/plan). Empty sections collapse.
 */
import { useMemo } from "react";
import ProfileHero from "./ProfileHero.jsx";
import ProfileBillboardBlock from "./ProfileBillboardBlock.jsx";
import ProfileFavoriteMenuItems from "./ProfileFavoriteMenuItems.jsx";
import ProfileUpdates from "./ProfileUpdates.jsx";
import ProfileDealsSection from "./ProfileDealsSection.jsx";
import ProfilePhotoStrip from "./ProfilePhotoStrip.jsx";
import ProfileRestaurantInfo from "./ProfileRestaurantInfo.jsx";
import FoodTruckUpcomingStops from "./FoodTruckUpcomingStops.jsx";
import { clusterTypeLabel } from "../../../lib/clusterUrl.js";
import {
  ProfileSection,
  normalizeScheduleStops,
  buildCurrentLocation,
  firstNonEmpty,
  PROFILE_INK,
  PROFILE_CONTENT_MAX,
  profilePageBgVar,
  isFoodTruckProfile,
} from "./profilePrimitives.jsx";
import {
  buildProfileStyleRootStyle,
  DEFAULT_PROFILE_STYLE_KEY,
} from "../../../lib/restaurantProfileStyles.js";
import { resolveEffectiveProfileStyle } from "../../../lib/restaurantProfileStyleRecommendation.js";

export default function PublicProfileShell({
  profileType = "restaurant",
  profile = null,
  name,
  streetAddr = "",
  cityLine = "",
  directionsUrl = "",
  website = "",
  websiteRaw = "",
  phone = "",
  cuisine = "",
  category = "",
  aboutText = "",
  bioText = "",
  foundedText = "",
  featuredText = "",
  featuredItem = null,
  todaysSpecial = null,
  landmarks = "",
  logoUrl = "",
  bannerPhotoUrl = null,
  statusLightProps = null,
  restaurantId = null,
  menuHref = null,
  shareData = null,
  shareAnalytics = null,
  saveContactControl = null,
  menuPreviewItems = [],
  menuItemCount = 0,
  menuCount = 0,
  billboardPreview = [],
  dealItems = [],
  favoriteMenuItems = null,
  profileUpdates = null,
  displayCluster = null,
  statusBanners = null,
  statusEventPresentations = null,
  operatingHours = [],
  claimHref = null,
  claimState = null,
  showClaimInvites = false,
  isMobile = false,
}) {
  void landmarks;
  void menuItemCount;
  void menuCount;
  void statusEventPresentations;
  void statusBanners;
  void foundedText;
  void featuredText;
  void featuredItem;
  void todaysSpecial;
  void menuPreviewItems;

  const effectiveStyleKey = useMemo(() => {
    const fromApi = profile?.effective_profile_style;
    if (fromApi && String(fromApi).trim()) return String(fromApi).trim();
    return resolveEffectiveProfileStyle({
      profile_style_key: profile?.profile_style_key,
      category: category || profile?.category,
      cuisine: cuisine || profile?.cuisine,
    });
  }, [
    profile?.effective_profile_style,
    profile?.profile_style_key,
    profile?.category,
    profile?.cuisine,
    category,
    cuisine,
  ]);

  const styleRoot = useMemo(
    () => buildProfileStyleRootStyle(effectiveStyleKey || DEFAULT_PROFILE_STYLE_KEY),
    [effectiveStyleKey]
  );

  const isFoodTruck = isFoodTruckProfile(profile, profileType);
  const contentMax = PROFILE_CONTENT_MAX;
  const classification = profile?.classification || null;
  const primaryVenue =
    firstNonEmpty(
      classification?.primary_venue_type?.display_name,
      classification?.primary_venue_type?.name
    ) || "";
  const cuisineFromClass = Array.isArray(classification?.cuisines)
    ? classification.cuisines.map((c) => c?.display_name || c?.name).filter(Boolean)
    : [];
  const cuisineLabel = cuisineFromClass[0] || cuisine;

  const metaBits = isFoodTruck
    ? [cuisineLabel].filter(Boolean)
    : [primaryVenue, cuisineLabel]
        .filter(Boolean)
        .filter((v, i, a) => a.findIndex((x) => String(x).toLowerCase() === String(v).toLowerCase()) === i);

  const stops = useMemo(
    () => (isFoodTruck ? normalizeScheduleStops(profile) : []),
    [isFoodTruck, profile]
  );
  const location = useMemo(
    () => (isFoodTruck ? buildCurrentLocation(profile, streetAddr, cityLine) : null),
    [isFoodTruck, profile, streetAddr, cityLine]
  );

  const shortDescription = firstNonEmpty(bioText, aboutText, profile?.bio, profile?.about_us);
  const openStatus = profile?.open_status || null;

  const favorites = Array.isArray(favoriteMenuItems)
    ? favoriteMenuItems
    : Array.isArray(profile?.favorite_menu_items)
      ? profile.favorite_menu_items
      : [];
  const updates = Array.isArray(profileUpdates)
    ? profileUpdates
    : Array.isArray(profile?.profile_updates)
      ? profile.profile_updates
      : [];
  const deals = Array.isArray(dealItems)
    ? dealItems
    : Array.isArray(profile?.deal_items)
      ? profile.deal_items
      : [];

  const actionDirectionsUrl = isFoodTruck
    ? location?.directionsUrl || directionsUrl || ""
    : directionsUrl;

  const clusterName = !isFoodTruck && displayCluster?.name ? String(displayCluster.name) : "";
  const clusterHref =
    !isFoodTruck && displayCluster?.public_url ? String(displayCluster.public_url) : null;
  const clusterSuffix =
    !isFoodTruck && displayCluster?.cluster_type
      ? ` · ${clusterTypeLabel(displayCluster.cluster_type)}`
      : "";
  const clusterLabel = clusterName ? `${clusterName}${clusterSuffix}` : "";
  const claimAnchor = claimHref || "#claim-profile";
  const sectionGap = isMobile ? 16 : 20;

  return (
    <div
      data-testid={isFoodTruck ? "food-truck-public-editorial" : "restaurant-public-editorial"}
      data-profile-type={isFoodTruck ? "food_truck" : "restaurant"}
      data-profile-style={effectiveStyleKey || DEFAULT_PROFILE_STYLE_KEY}
      style={{
        minHeight: "100vh",
        ...styleRoot,
        backgroundColor: styleRoot.backgroundColor || profilePageBgVar,
        color: PROFILE_INK,
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        paddingBottom: 88,
      }}
    >
      <ProfileHero
        profileType={isFoodTruck ? "food_truck" : "restaurant"}
        name={name}
        businessTypeLabel={isFoodTruck ? "Food Truck" : ""}
        cityLine={isFoodTruck ? "" : cityLine}
        streetAddr={isFoodTruck ? "" : streetAddr}
        directionsUrl={isFoodTruck ? "" : directionsUrl}
        logoUrl={logoUrl}
        bannerPhotoUrl={bannerPhotoUrl}
        statusLightProps={statusLightProps}
        restaurantId={restaurantId}
        menuHref={menuHref}
        shareData={shareData}
        shareAnalytics={shareAnalytics}
        followSource={isFoodTruck ? "food_truck_profile" : "restaurant_profile"}
        metaBits={metaBits}
        venueLabel={isFoodTruck ? "" : primaryVenue}
        clusterName={clusterLabel}
        clusterHref={clusterHref}
        saveContactControl={saveContactControl}
        foodTruckLocation={location}
        phone={phone}
        website={website}
        websiteRaw={websiteRaw}
        shortDescription={shortDescription}
        openStatus={openStatus}
        profile={profile}
        isMobile={isMobile}
        contentMax={contentMax}
      />

      <div
        style={{
          maxWidth: contentMax,
          margin: "0 auto",
          padding: isMobile ? "16px 16px 0" : "24px 28px 0",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <ProfileBillboardBlock billboardPreview={billboardPreview} isMobile={isMobile} />

        <ProfileFavoriteMenuItems
          items={favorites}
          menuHref={menuHref}
          isMobile={isMobile}
        />

        <ProfileUpdates updates={updates} isMobile={isMobile} />

        {isFoodTruck && stops.length ? (
          <ProfileSection title="Upcoming locations">
            <FoodTruckUpcomingStops stops={stops} />
          </ProfileSection>
        ) : null}

        <ProfileDealsSection
          dealItems={deals}
          restaurantId={restaurantId}
          isMobile={isMobile}
        />

        <ProfilePhotoStrip
          name={name}
          bannerPhotoUrl={bannerPhotoUrl}
          billboardPreview={billboardPreview}
          isMobile={isMobile}
        />

        <ProfileRestaurantInfo
          operatingHours={operatingHours}
          phone={phone}
          streetAddr={isFoodTruck ? "" : streetAddr}
          cityLine={isFoodTruck ? "" : cityLine}
          directionsUrl={actionDirectionsUrl}
          website={website}
          websiteRaw={websiteRaw}
          instagram={profile?.instagram || ""}
          claimHref={claimAnchor}
          claimState={claimState}
          showClaimInvites={showClaimInvites}
          isMobile={isMobile}
        />

        <div style={{ height: sectionGap }} aria-hidden="true" />
      </div>
    </div>
  );
}
