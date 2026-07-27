/**
 * Unified Menuply public profile shell — experience-first.
 * Restaurant layout: Restaurant Highlights (story fields) + compact menu preview rail.
 * Food trucks keep location/stops modules. Empty sections collapse.
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

function DishCard({ title, name, description, price }) {
  if (!name) return null;
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        background: "#fff",
        border: "1px solid #e7e5e4",
      }}
    >
      {title ? (
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: "#166534",
            marginBottom: 6,
          }}
        >
          {title}
        </div>
      ) : null}
      <div style={{ fontSize: 16, fontWeight: 800, color: PROFILE_INK, lineHeight: 1.3 }}>
        {name}
        {price != null && String(price).trim() ? (
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: PROFILE_MUTED }}>
            {String(price).trim()}
          </span>
        ) : null}
      </div>
      {description ? (
        <div style={{ marginTop: 6, fontSize: 14, color: "#57534e", lineHeight: 1.5 }}>
          {description}
        </div>
      ) : null}
    </div>
  );
}

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
            fontSize: 14,
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
  // Address lives in the hero (Maps link) — do not repeat it in Business information.
  const hasDetails = Boolean(website || phone || cuisine || category || hoursRows.length);

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

  const highlightsColumn = !isFoodTruck ? (
    <ProfileRestaurantHighlights
      aboutText={aboutText}
      featuredItem={featuredItem}
      featuredText={featuredText}
      foundedText={founded}
      landmarks={landmarks}
      dealItems={dealItems}
      statusBanners={statusBanners}
      statusEventPresentations={statusEventPresentations}
      displayCluster={displayCluster}
      isMobile={isMobile}
    />
  ) : null;

  const menuRail = hasMenuPreview ? (
    <ProfileMenuHighlights
      items={menuPreviewItems}
      menuHref={menuHref}
      profile={profile}
      isMobile={isMobile}
      compact
    />
  ) : null;

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
          padding: isMobile ? "20px 16px 0" : "28px 28px 0",
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

        <ProfileBillboardFeature
          billboardPreview={billboardPreview}
          billboardHref={billboardHref}
          isMobile={isMobile}
        />

        <ProfilePhotoStrip
          name={name}
          bannerPhotoUrl={bannerPhotoUrl}
          billboardPreview={billboardPreview}
          isMobile={isMobile}
        />

        {/* Food-truck energy modules — only when real data exists */}
        {isFoodTruck && featuredItem?.name ? (
          <ProfileSection title="Featured dish">
            <DishCard
              name={featuredItem.name}
              description={featuredItem.description}
              price={featuredItem.price}
            />
          </ProfileSection>
        ) : null}

        {isFoodTruck && todaysSpecial?.name ? (
          <ProfileSection title="Today's special">
            <DishCard
              name={todaysSpecial.name}
              description={todaysSpecial.description}
              price={todaysSpecial.price}
            />
          </ProfileSection>
        ) : null}

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

        {isFoodTruck && storyText ? (
          <ProfileSection title="About">{storyText}</ProfileSection>
        ) : null}

        {isFoodTruck && founded ? <ProfileSection title="Founded">{founded}</ProfileSection> : null}

        {/* Restaurant: highlights + compact menu preview; FT: compact preview only when present */}
        {!isFoodTruck && (highlightsColumn || menuRail) ? (
          <div
            data-testid="profile-highlights-layout"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile || !menuRail || !highlightsColumn ? "1fr" : "minmax(0, 1fr) 260px",
              gap: isMobile ? 0 : 20,
              alignItems: "start",
              marginBottom: 28,
            }}
          >
            {highlightsColumn}
            {menuRail}
          </div>
        ) : null}

        {isFoodTruck && menuRail ? <div style={{ marginBottom: 28 }}>{menuRail}</div> : null}

        {hasDetails ? (
          <ProfileSection title="Business information">
            <div style={{ borderTop: "1px solid #e7e5e4" }}>
              <DetailLine label="Website">
                {website ? <QuietLink href={website}>{websiteRaw || website} ↗</QuietLink> : null}
              </DetailLine>
              <DetailLine label="Phone">
                {phone ? (
                  <a
                    href={`tel:${String(phone).replace(/\s+/g, "")}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {phone}
                  </a>
                ) : null}
              </DetailLine>
              <DetailLine label="Cuisine">{cuisine || null}</DetailLine>
              <DetailLine label="Category">{category || null}</DetailLine>
              {hoursRows.length && !isFoodTruck ? (
                <DetailLine label="Hours">
                  <HoursBlock hoursRows={hoursRows} testId="restaurant-hours" />
                </DetailLine>
              ) : null}
            </div>
          </ProfileSection>
        ) : null}
      </div>
    </div>
  );
}
