/**
 * Unified Menuply public profile shell.
 * Facts once: contact lives in the hero (restaurants under address; food trucks in hero).
 * No Business Information block. No Highlights chip wall.
 * Food trucks keep current design style + Located today / Upcoming / Add to contacts.
 */
import { useMemo } from "react";
import ProfileHero from "./ProfileHero.jsx";
import ProfilePrimaryActions from "./ProfilePrimaryActions.jsx";
import ProfileMenuHighlights from "./ProfileMenuHighlights.jsx";
import ProfileFeaturedContent from "./ProfileFeaturedContent.jsx";
import ProfilePhotoStrip from "./ProfilePhotoStrip.jsx";
import ProfileAtAGlance from "./ProfileAtAGlance.jsx";
import ProfileNowHiring from "./ProfileNowHiring.jsx";
import FoodTruckUpcomingStops from "./FoodTruckUpcomingStops.jsx";
import { resolveStatusBanners } from "../../../lib/restaurantStatusBanners.js";
import { clusterTypeLabel } from "../../../lib/clusterUrl.js";
import {
  ProfileSection,
  formatHoursRows,
  normalizeScheduleStops,
  buildCurrentLocation,
  firstNonEmpty,
  PROFILE_INK,
  PROFILE_CONTENT_MAX,
  profilePageBgVar,
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

  const isFoodTruck = profileType === "food_truck";
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

  // Food truck: type shown once via businessTypeLabel — meta is cuisine only.
  // Restaurant: venue · cluster as plain text (no oval chips).
  const metaBits = isFoodTruck
    ? [cuisineLabel].filter(Boolean)
    : [primaryVenue, cuisineLabel]
        .filter(Boolean)
        .filter((v, i, a) => a.findIndex((x) => String(x).toLowerCase() === String(v).toLowerCase()) === i);

  const hoursRows = useMemo(() => formatHoursRows(operatingHours), [operatingHours]);
  const stops = useMemo(
    () => (isFoodTruck ? normalizeScheduleStops(profile) : []),
    [isFoodTruck, profile]
  );
  const location = useMemo(
    () => (isFoodTruck ? buildCurrentLocation(profile, streetAddr, cityLine) : null),
    [isFoodTruck, profile, streetAddr, cityLine]
  );

  const hasMenuPreview = Array.isArray(menuPreviewItems) && menuPreviewItems.length > 0;

  const bio = firstNonEmpty(bioText);
  const about = firstNonEmpty(aboutText);
  const aboutDistinct =
    isFoodTruck && about && bio && about.toLowerCase() !== bio.toLowerCase()
      ? about
      : isFoodTruck
        ? about && !bio
          ? about
          : ""
        : about;
  const storyText = isFoodTruck ? bio || aboutDistinct : about;
  const founded = firstNonEmpty(
    foundedText,
    profile?.founded,
    profile?.founded_year != null ? String(profile.founded_year) : "",
    profile?.year_founded
  );
  const teamIntro = firstNonEmpty(profile?.team_intro);
  const signatureText = firstNonEmpty(
    featuredItem?.name,
    featuredText,
    todaysSpecial?.name
  );

  const actionDirectionsUrl = isFoodTruck
    ? location?.directionsUrl || directionsUrl || ""
    : directionsUrl;

  // Contact once — hero only. Glance may invite claim when missing.
  const heroPhone = firstNonEmpty(phone);
  const heroWebsite = firstNonEmpty(website);
  const bannerList = resolveStatusBanners(statusBanners);
  const hiringActive = bannerList.some((b) => b.id === "now_hiring");
  const claimAnchor = claimHref || "#claim-profile";

  const clusterName = !isFoodTruck && displayCluster?.name ? String(displayCluster.name) : "";
  const clusterHref =
    !isFoodTruck && displayCluster?.public_url ? String(displayCluster.public_url) : null;
  const clusterSuffix =
    !isFoodTruck && displayCluster?.cluster_type
      ? ` · ${clusterTypeLabel(displayCluster.cluster_type)}`
      : "";
  const clusterLabel = clusterName ? `${clusterName}${clusterSuffix}` : "";

  const deals = Array.isArray(dealItems) ? dealItems : [];
  const sectionGap = isMobile ? 16 : 20;

  const glance = (
    <ProfileAtAGlance
      aboutText={storyText}
      foundedText={founded}
      signatureText={signatureText}
      teamIntro={teamIntro}
      hoursRows={hoursRows}
      showClaimInvites={showClaimInvites}
      claimHref={claimAnchor}
      showHiringInvite={!hiringActive}
      isMobile={isMobile}
    />
  );

  const menuRail = hasMenuPreview ? (
    <ProfileMenuHighlights items={menuPreviewItems} menuHref={menuHref} isMobile={isMobile} compact />
  ) : null;

  const leftStack = glance ? (
    <div
      data-testid="profile-identity-stack"
      style={{ display: "grid", gap: 16, minWidth: 0 }}
    >
      {glance}
    </div>
  ) : null;

  return (
    <div
      data-testid={isFoodTruck ? "food-truck-public-editorial" : "restaurant-public-editorial"}
      data-profile-type={profileType}
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
        profileType={profileType}
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
        metaBits={metaBits}
        venueLabel={isFoodTruck ? "" : primaryVenue}
        clusterName={clusterLabel}
        clusterHref={clusterHref}
        saveContactControl={saveContactControl}
        foodTruckLocation={location}
        phone={heroPhone}
        website={heroWebsite}
        websiteRaw={websiteRaw}
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
        <ProfilePrimaryActions
          profileType={profileType}
          profile={profile}
          menuHref={menuHref}
          directionsUrl={actionDirectionsUrl}
          phone=""
          website=""
          claimHref={claimHref}
          claimState={claimState}
          isMobile={isMobile}
        />

        <ProfilePhotoStrip
          name={name}
          bannerPhotoUrl={bannerPhotoUrl}
          billboardPreview={billboardPreview}
          isMobile={isMobile}
        />

        <ProfileFeaturedContent
          featuredItem={featuredItem}
          featuredText={featuredText}
          todaysSpecial={todaysSpecial}
          dealItems={deals}
          isMobile={isMobile}
        />

        <ProfileNowHiring isActive={hiringActive} isMobile={isMobile} />

        {isFoodTruck && stops.length ? (
          <ProfileSection title="Upcoming locations / events">
            <FoodTruckUpcomingStops stops={stops} />
          </ProfileSection>
        ) : null}

        {leftStack || menuRail ? (
          <div
            data-testid="profile-highlights-layout"
            style={{
              display: "grid",
              gridTemplateColumns:
                isMobile || !menuRail || !leftStack ? "1fr" : "minmax(0, 1.15fr) minmax(280px, 340px)",
              gap: isMobile ? sectionGap : 20,
              alignItems: "start",
              marginBottom: sectionGap + 8,
            }}
          >
            {leftStack}
            {menuRail}
          </div>
        ) : null}

        {storyText ? (
          <ProfileSection title="About Us" testId="profile-about-us">
            {storyText}
          </ProfileSection>
        ) : null}
      </div>
    </div>
  );
}
