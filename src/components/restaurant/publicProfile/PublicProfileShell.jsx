/**
 * Unified Menuply public profile shell — Phase 1.5 destination experience.
 * Hero → actions → photos → billboard → highlights + menu → FT ops → business (de-duped).
 * Empty sections collapse. No fake content. Facts shown once.
 */
import { useMemo } from "react";
import ProfileHero from "./ProfileHero.jsx";
import ProfilePrimaryActions from "./ProfilePrimaryActions.jsx";
import ProfileMenuHighlights from "./ProfileMenuHighlights.jsx";
import ProfileRestaurantHighlights from "./ProfileRestaurantHighlights.jsx";
import ProfileBillboardFeature from "./ProfileBillboardFeature.jsx";
import ProfilePhotoStrip from "./ProfilePhotoStrip.jsx";
import FoodTruckUpcomingStops from "./FoodTruckUpcomingStops.jsx";
import {
  ProfileSection,
  DetailLine,
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

  // Hero (FT) or primary action chips (restaurant) already expose phone/website — never repeat.
  const bizCategory = isFoodTruck ? "" : category && category !== cuisine ? category : "";
  const bizHours = !isFoodTruck && hoursRows.length ? hoursRows : [];
  const hasDetails = Boolean(bizCategory || bizHours.length);

  const promoDeals = useMemo(() => {
    const base = Array.isArray(dealItems) ? [...dealItems] : [];
    if (todaysSpecial?.name) {
      const already = base.some(
        (d) => String(d?.name || "").toLowerCase() === String(todaysSpecial.name).toLowerCase()
      );
      if (!already) {
        base.unshift({
          id: "todays-special",
          name: todaysSpecial.name,
          description: todaysSpecial.description || "Today's special",
          price: todaysSpecial.price,
        });
      }
    }
    return base;
  }, [dealItems, todaysSpecial]);

  const highlightsColumn = (
    <ProfileRestaurantHighlights
      aboutText={isFoodTruck ? storyText : aboutText}
      featuredItem={featuredItem}
      featuredText={featuredText}
      foundedText={founded}
      landmarks={isFoodTruck ? "" : landmarks}
      cuisine={cuisine}
      includeCuisineChip={false}
      dealItems={promoDeals}
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
        phone={phone}
        website={website}
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
        {claimPanel}

        <ProfilePrimaryActions
          profile={profile}
          menuHref={menuHref}
          directionsUrl={actionDirectionsUrl}
          phone={isFoodTruck ? "" : phone}
          website={isFoodTruck ? "" : website}
          claimHref={claimHref}
          claimState={claimState}
          isMobile={isMobile}
        />

        {/* Photos elevated — before billboard */}
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

        {/* FT energetic ops — only real data */}
        {isFoodTruck && stops.length ? (
          <ProfileSection title="Upcoming stops">
            <FoodTruckUpcomingStops stops={stops} />
          </ProfileSection>
        ) : null}

        {isFoodTruck && hoursRows.length ? (
          <ProfileSection title="Hours">
            <HoursBlock hoursRows={hoursRows} testId="food-truck-hours" />
          </ProfileSection>
        ) : null}

        {/* Highlights + menu teaser */}
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

        {hasDetails ? (
          <ProfileSection title="Business information">
            <div
              style={{
                borderTop: "1px solid #e7e5e4",
                fontSize: 13,
                color: PROFILE_MUTED,
              }}
            >
              <DetailLine label="Category">{bizCategory || null}</DetailLine>
              {bizHours.length ? (
                <DetailLine label="Hours">
                  <HoursBlock hoursRows={bizHours} testId="restaurant-hours" />
                </DetailLine>
              ) : null}
            </div>
          </ProfileSection>
        ) : null}
      </div>
    </div>
  );
}
