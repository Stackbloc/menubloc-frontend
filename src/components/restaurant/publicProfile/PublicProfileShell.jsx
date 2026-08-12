/**
 * Unified Menuply public profile shell — restaurant homepage layout.
 * Claimed: Hero → Billboard → About Us + Founded + Photos → Favorites → Deals → Updates
 * Unclaimed: Hero → About Us + Founded + Photos → Favorites → Deals → Updates
 * (+ FT upcoming stops when food truck entity/plan).
 * Contact + hours live in the hero. No bottom Information box.
 */
import { useMemo } from "react";
import ProfileHero from "./ProfileHero.jsx";
import ProfileBillboardBlock from "./ProfileBillboardBlock.jsx";
import ProfileAboutFounded from "./ProfileAboutFounded.jsx";
import ProfileFavoriteMenuItems from "./ProfileFavoriteMenuItems.jsx";
import ProfileUpdates from "./ProfileUpdates.jsx";
import ProfileDealsSection from "./ProfileDealsSection.jsx";
import FoodTruckUpcomingStops from "./FoodTruckUpcomingStops.jsx";
import FoodComments from "../../comments/FoodComments.jsx";
import {
  ProfileSection,
  normalizeScheduleStops,
  buildCurrentLocation,
  firstNonEmpty,
  PROFILE_INK,
  PROFILE_CONTENT_MAX,
  profilePageBgVar,
  isFoodTruckProfile,
  ProfileSectionBlank,
  ProfileClaimBanner,
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
  const founded = firstNonEmpty(
    foundedText,
    profile?.founded,
    profile?.founded_year != null ? String(profile.founded_year) : "",
    profile?.year_founded
  );
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

  const clusterName = !isFoodTruck && displayCluster?.name ? String(displayCluster.name) : "";
  const clusterHref =
    !isFoodTruck && displayCluster?.public_url ? String(displayCluster.public_url) : null;
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
        viewMenuTestId={isFoodTruck ? "food-truck-view-menu" : "restaurant-profile-view-menu"}
        showClaimInvites={showClaimInvites}
        metaBits={metaBits}
        venueLabel={isFoodTruck ? "" : primaryVenue}
        clusterName={clusterName}
        clusterHref={clusterHref}
        saveContactControl={saveContactControl}
        foodTruckLocation={location}
        phone={phone}
        website={website}
        websiteRaw={websiteRaw}
        instagram={profile?.instagram || ""}
        shortDescription={shortDescription}
        openStatus={openStatus}
        operatingHours={operatingHours}
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
        {showClaimInvites ? (
          <ProfileClaimBanner claimHref={claimHref} claimState={claimState} />
        ) : null}

        {!showClaimInvites ? (
          <ProfileBillboardBlock billboardPreview={billboardPreview} isMobile={isMobile} />
        ) : null}

        <ProfileAboutFounded
          aboutText={shortDescription}
          foundedText={founded}
          name={name}
          bannerPhotoUrl={bannerPhotoUrl}
          billboardPreview={billboardPreview}
          claimHref={claimHref}
          claimState={claimState}
          isMobile={isMobile}
          showClaimInvites={showClaimInvites}
        />

        <ProfileFavoriteMenuItems
          items={favorites}
          isMobile={isMobile}
          showClaimInvites={showClaimInvites}
        />

        <ProfileDealsSection
          dealItems={deals}
          restaurantId={restaurantId}
          isMobile={isMobile}
          showClaimInvites={showClaimInvites}
        />

        <ProfileUpdates updates={updates} isMobile={isMobile} showClaimInvites={showClaimInvites} />

        {restaurantId ? (
          <FoodComments
            restaurantId={restaurantId}
            showFeaturedFirst
            title="What diners are saying"
            compact={isMobile}
          />
        ) : null}

        {isFoodTruck && (stops.length || showClaimInvites) ? (
          <ProfileSection title="Upcoming locations">
            {stops.length ? (
              <FoodTruckUpcomingStops stops={stops} />
            ) : (
              <ProfileSectionBlank
                testId="profile-upcoming-blank"
                message="No upcoming locations yet."
              />
            )}
          </ProfileSection>
        ) : null}

        <div style={{ height: sectionGap }} aria-hidden="true" />
      </div>
    </div>
  );
}
