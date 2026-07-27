/**
 * Unified Menuply public profile shell — Phase 2 content hierarchy.
 * Personality first: Hero → actions → photos → billboard → Featured → FT ops
 * → Highlights + Menu → About → Business info → quiet claim.
 * Empty sections collapse. Facts shown once.
 */
import { useMemo } from "react";
import ProfileHero from "./ProfileHero.jsx";
import ProfilePrimaryActions from "./ProfilePrimaryActions.jsx";
import ProfileMenuHighlights from "./ProfileMenuHighlights.jsx";
import ProfileRestaurantHighlights from "./ProfileRestaurantHighlights.jsx";
import ProfileFeaturedContent from "./ProfileFeaturedContent.jsx";
import ProfileBillboardFeature from "./ProfileBillboardFeature.jsx";
import ProfilePhotoStrip from "./ProfilePhotoStrip.jsx";
import FoodTruckUpcomingStops from "./FoodTruckUpcomingStops.jsx";
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
  PROFILE_MUTED,
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
  isMobile = false,
}) {
  const isFoodTruck = profileType === "food_truck";
  const contentMax = PROFILE_CONTENT_MAX;
  const metaBits = [cuisine, category].filter(Boolean);
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
  const founded = firstNonEmpty(foundedText, profile?.founded, profile?.founded_year, profile?.year_founded);

  const actionDirectionsUrl = isFoodTruck
    ? location?.directionsUrl || directionsUrl || ""
    : directionsUrl;

  // Address/Directions live in restaurant hero Maps (or FT location module) — do not repeat.
  // Phone / Website / Hours live once in Business Information.
  const bizPhone = firstNonEmpty(phone);
  const bizWebsite = firstNonEmpty(website);
  const bizHours = hoursRows;
  const hasDetails = Boolean(bizPhone || bizWebsite || bizHours.length);

  const deals = Array.isArray(dealItems) ? dealItems : [];

  const highlightsColumn = (
    <ProfileRestaurantHighlights
      foundedText={founded}
      landmarks={isFoodTruck ? "" : landmarks}
      cuisine={cuisine}
      includeCuisineChip={false}
      statusBanners={isFoodTruck ? null : statusBanners}
      statusEventPresentations={isFoodTruck ? null : statusEventPresentations}
      displayCluster={isFoodTruck ? null : displayCluster}
      title={isFoodTruck ? "Food truck highlights" : "Restaurant highlights"}
      isMobile={isMobile}
    />
  );

  const menuRail = hasMenuPreview ? (
    <ProfileMenuHighlights
      items={menuPreviewItems}
      menuHref={menuHref}
      profile={profile}
      isMobile={isMobile}
      compact
    />
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
        metaBits={isFoodTruck ? (cuisine ? [cuisine] : []) : metaBits}
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

        {isFoodTruck && stops.length ? (
          <ProfileSection title="Upcoming stops">
            <FoodTruckUpcomingStops stops={stops} />
          </ProfileSection>
        ) : null}

        {highlightsColumn || menuRail ? (
          <div
            data-testid="profile-highlights-layout"
            style={{
              display: "grid",
              gridTemplateColumns:
                isMobile || !menuRail || !highlightsColumn ? "1fr" : "minmax(0, 1fr) 260px",
              gap: isMobile ? sectionGap : 20,
              alignItems: "start",
              marginBottom: sectionGap + 8,
            }}
          >
            {highlightsColumn}
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
