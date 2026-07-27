/**
 * Unified Menuply public profile shell — Phase 2 hierarchy + existing-data populate.
 * Personality first: Hero → actions → photos → billboard → Featured → FT ops
 * → At a Glance + Highlights + Menu → About → Business info → quiet claim.
 * Empty sections collapse. Facts shown once. Real data only.
 */
import { useMemo } from "react";
import ProfileHero from "./ProfileHero.jsx";
import ProfilePrimaryActions from "./ProfilePrimaryActions.jsx";
import ProfileMenuHighlights from "./ProfileMenuHighlights.jsx";
import ProfileRestaurantHighlights from "./ProfileRestaurantHighlights.jsx";
import ProfileFeaturedContent from "./ProfileFeaturedContent.jsx";
import ProfileBillboardFeature from "./ProfileBillboardFeature.jsx";
import ProfilePhotoStrip from "./ProfilePhotoStrip.jsx";
import ProfileAtAGlance from "./ProfileAtAGlance.jsx";
import ProfileNowHiring from "./ProfileNowHiring.jsx";
import FoodTruckUpcomingStops from "./FoodTruckUpcomingStops.jsx";
import { resolveStatusBanners } from "../../../lib/restaurantStatusBanners.js";
import {
  ProfileSection,
  DetailLine,
  QuietLink,
  formatHoursRows,
  normalizeScheduleStops,
  buildCurrentLocation,
  firstNonEmpty,
  PROFILE_PAGE_BG,
  PROFILE_INK,
  PROFILE_CONTENT_MAX,
} from "./profilePrimitives.jsx";

function HoursBlock({ hoursRows, testId }) {
  if (!hoursRows.length) return null;
  return (
    <div data-testid={testId} style={{ display: "grid", gap: 6 }}>
      {hoursRows.map((row) => (
        <div
          key={row.day}
          style={{
            display: "grid",
            gridTemplateColumns: "48px 1fr",
            gap: 12,
            fontSize: 13,
          }}
        >
          <span style={{ fontWeight: 700, color: "#57534e" }}>{row.day}</span>
          <span style={{ color: PROFILE_INK }}>{row.text}</span>
        </div>
      ))}
    </div>
  );
}

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
  billboardHref = null,
  dealItems = [],
  displayCluster = null,
  statusBanners = null,
  statusEventPresentations = null,
  operatingHours = [],
  claimHref = null,
  claimState = null,
  claimPanel = null,
  showClaimInvites = false,
  isMobile = false,
}) {
  const isFoodTruck = profileType === "food_truck";
  const contentMax = PROFILE_CONTENT_MAX;
  const classification = profile?.classification || null;
  const primaryVenue =
    firstNonEmpty(classification?.primary_venue_type?.display_name, classification?.primary_venue_type?.name) ||
    "";
  const cuisineFromClass = Array.isArray(classification?.cuisines)
    ? classification.cuisines.map((c) => c?.display_name || c?.name).filter(Boolean)
    : [];
  const cuisineLabel = cuisineFromClass[0] || cuisine;
  const featureLabels = Array.isArray(classification?.features)
    ? classification.features.map((f) => f?.display_name || f?.name).filter(Boolean)
    : [];
  // Prefer Sports Bar · American over generic full_service_restaurant.
  const metaBits = [primaryVenue || (isFoodTruck ? "Food Truck" : ""), cuisineLabel || category]
    .filter(Boolean)
    .filter((v, i, a) => a.findIndex((x) => String(x).toLowerCase() === String(v).toLowerCase()) === i);
  const hoursRows = useMemo(() => formatHoursRows(operatingHours), [operatingHours]);
  const stops = useMemo(() => (isFoodTruck ? normalizeScheduleStops(profile) : []), [isFoodTruck, profile]);
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

  // Address/Directions live in restaurant hero Maps (or FT location module) — do not repeat.
  // Phone / Website / Hours live once in Business Information when present (glance may also show).
  const bizPhone = firstNonEmpty(phone);
  const bizWebsite = firstNonEmpty(website);
  const bizHours = hoursRows;
  const hasDetails = Boolean(bizPhone || bizWebsite || bizHours.length);

  const deals = Array.isArray(dealItems) ? dealItems : [];
  const pickup = profile?.pickup === true;
  const delivery = profile?.delivery === true;
  const dineIn = profile?.dine_in === true;
  const restaurantType = primaryVenue ? "" : firstNonEmpty(profile?.restaurant_type);
  const bannerList = resolveStatusBanners(statusBanners);
  const hiringActive = bannerList.some((b) => b.id === "now_hiring");
  const claimAnchor = claimHref || "#claim-profile";

  const glance = (
    <ProfileAtAGlance
      aboutText={storyText}
      foundedText={founded}
      signatureText={signatureText}
      teamIntro={teamIntro}
      hoursRows={hoursRows}
      phone={bizPhone}
      website={bizWebsite}
      websiteRaw={websiteRaw}
      showClaimInvites={showClaimInvites}
      claimHref={claimAnchor}
      showHiringInvite={!hiringActive}
      isMobile={isMobile}
    />
  );

  const highlightsColumn = (
    <ProfileRestaurantHighlights
      foundedText={founded}
      landmarks={isFoodTruck ? "" : landmarks}
      cuisine={cuisineLabel}
      category=""
      restaurantType=""
      venueType={primaryVenue}
      featureLabels={featureLabels}
      pickup={pickup}
      delivery={delivery}
      dineIn={dineIn}
      statusBanners={isFoodTruck ? null : statusBanners}
      statusEventPresentations={isFoodTruck ? null : statusEventPresentations}
      displayCluster={isFoodTruck ? null : displayCluster}
      title={isFoodTruck ? "Food truck highlights" : "Restaurant highlights"}
      isMobile={isMobile}
    />
  );

  const leftStack =
    glance || highlightsColumn ? (
      <div
        data-testid="profile-identity-stack"
        style={{ display: "grid", gap: isMobile ? 16 : 16, minWidth: 0 }}
      >
        {glance}
        {highlightsColumn}
      </div>
    ) : null;

  const menuRail = hasMenuPreview ? (
    <ProfileMenuHighlights items={menuPreviewItems} menuHref={menuHref} isMobile={isMobile} compact />
  ) : null;

  const sectionGap = isMobile ? 16 : 20;

  return (
    <div
      data-testid={isFoodTruck ? "food-truck-public-editorial" : "restaurant-public-editorial"}
      data-profile-type={profileType}
      style={{
        minHeight: "100vh",
        background: PROFILE_PAGE_BG,
        color: PROFILE_INK,
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        paddingBottom: 88,
      }}
    >
      <ProfileHero
        profileType={profileType}
        name={name}
        businessTypeLabel={isFoodTruck ? "Food Truck" : ""}
        cityLine={cityLine}
        streetAddr={streetAddr}
        directionsUrl={directionsUrl}
        logoUrl={logoUrl}
        bannerPhotoUrl={bannerPhotoUrl}
        statusLightProps={statusLightProps}
        restaurantId={restaurantId}
        menuHref={menuHref}
        shareData={shareData}
        shareAnalytics={shareAnalytics}
        followSource={isFoodTruck ? "food_truck_profile" : "restaurant_profile"}
        viewMenuTestId={isFoodTruck ? "food-truck-view-menu" : "restaurant-profile-view-menu"}
        metaBits={isFoodTruck ? (metaBits.length ? metaBits : cuisineLabel ? [cuisineLabel] : []) : metaBits}
        saveContactControl={saveContactControl}
        foodTruckLocation={location}
        phone=""
        website=""
        websiteRaw=""
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

        <ProfileBillboardFeature
          billboardPreview={billboardPreview}
          billboardHref={billboardHref}
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
          <ProfileSection title="Upcoming stops">
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

        {hasDetails ? (
          <ProfileSection title="Business information">
            <div
              style={{
                borderTop: "1px solid #e7e5e4",
                fontSize: 14,
                color: PROFILE_INK,
              }}
            >
              <DetailLine label="Phone">
                {bizPhone ? (
                  <a
                    href={`tel:${String(bizPhone).replace(/\s+/g, "")}`}
                    style={{ color: "inherit", textDecoration: "none", fontWeight: 600 }}
                  >
                    {bizPhone}
                  </a>
                ) : null}
              </DetailLine>
              <DetailLine label="Website">
                {bizWebsite ? <QuietLink href={bizWebsite}>{websiteRaw || bizWebsite} ↗</QuietLink> : null}
              </DetailLine>
              {bizHours.length ? (
                <DetailLine label="Hours">
                  <HoursBlock
                    hoursRows={bizHours}
                    testId={isFoodTruck ? "food-truck-hours" : "restaurant-hours"}
                  />
                </DetailLine>
              ) : null}
            </div>
          </ProfileSection>
        ) : null}

        {/* Quiet claim after restaurant story — Menuply admin steps back */}
        {claimPanel}
      </div>
    </div>
  );
}
