/**
 * Unified Menuply public profile shell — restaurant homepage layout.
 * Claimed: Hero → Windows (if any) → Today at [Name] → About [Name] → Favorites (each only when filled)
 * Unclaimed: Hero → claim banner → the same sections, only when filled
 * Photos strip temporarily hidden (showPhotos=false) — Windows remains the photo row.
 * Windows shows only manually added window/deal offers (not brand splash art); In-N-Out exception.
 * Food truck: Hero (address / current location) → Upcoming locations → then shared sections.
 * Contact + hours live in the hero. No bottom Information box.
 * Diners never see empty owner prompts: empty About / Favorites / Deals / Updates / Upcoming
 * locations hide; unclaimed profiles keep only the page-level claim banner (2026-10-21).
 * Founded shows inline in the hero as "Est. YYYY".
 * Today at [Name] = active owner updates + active deals in one card (Deals/Updates sections retired).
 * Your Connects (ConnectionSocialProof) is signed-in, Connects-only, and renders nothing when empty.
 * No public diner-signal sections on restaurants/food trucks (status chips, What Diners Are
 * Saying, People Who Want To Go) — owners won't keep them up. Connect-only social proof stays.
 * Dining halls keep WhatDinersAreSaying ("what's good today") — no owner to moderate it.
 */
import { useMemo } from "react";
import ProfileHero from "./ProfileHero.jsx";
import ProfileBillboardBlock from "./ProfileBillboardBlock.jsx";
import ProfileAboutFounded from "./ProfileAboutFounded.jsx";
import ProfileFavoriteMenuItems from "./ProfileFavoriteMenuItems.jsx";
import ProfileToday from "./ProfileToday.jsx";
import ProfileVideosSection from "./ProfileVideosSection.jsx";
import FoodTruckUpcomingStops from "./FoodTruckUpcomingStops.jsx";
import ProfileUpcomingEvents from "./ProfileUpcomingEvents.jsx";
import WhatDinersAreSaying from "../WhatDinersAreSaying.jsx";
import ConnectionSocialProof from "../../social/ConnectionSocialProof.jsx";
import { pickWindowsPosts } from "../../../lib/profileWindows.js";
import { restaurantFromAddMenuContext } from "../../../lib/addMenuContribution.js";
import { formatAddressQuery } from "../../../lib/displayAddress.js";
import { buildGoogleMapsDirectionsUrl } from "../../../lib/catalogMenuUtils.js";
import {
  ProfileSection,
  normalizeScheduleStops,
  buildCurrentLocation,
  firstNonEmpty,
  PROFILE_INK,
  PROFILE_CONTENT_MAX,
  profilePageBgVar,
  isFoodTruckProfile,
  isDiningHallProfile,
  ProfileClaimBanner,
  formatEstablishedLabel,
} from "./profilePrimitives.jsx";
import {
  buildProfileStyleRootStyle,
  buildProfileStyleRootStyleFromTokens,
  DEFAULT_PROFILE_STYLE_KEY,
} from "../../../lib/restaurantProfileStyles.js";
import { resolveBrandProfileTheme } from "../../../lib/brandProfileThemes.js";
import { resolveEffectiveProfileStyle } from "../../../lib/restaurantProfileStyleRecommendation.js";
import { normalizeWindowsPhotoOrientation } from "../../../lib/windowsPhotoOrientation.js";

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
  bannerImageFit = "cover",
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
  windowsPhotoOrientation = null,
}) {
  void landmarks;
  void menuCount;
  void statusEventPresentations;
  void statusBanners;
  void featuredText;
  void featuredItem;
  void todaysSpecial;

  const restaurantSlug =
    profile?.slug ||
    profile?.restaurant_slug ||
    null;
  const restaurantCity = profile?.city || null;
  const restaurantState = profile?.state || null;
  const resolvedWindowsOrientation = normalizeWindowsPhotoOrientation(
    windowsPhotoOrientation ?? profile?.windows_photo_orientation
  );

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

  const brandTheme = useMemo(
    () =>
      resolveBrandProfileTheme({
        name: profile?.name || name,
        brand_profile: profile?.brand_profile,
        profile_style_key: profile?.profile_style_key,
      }),
    [profile?.name, name, profile?.brand_profile, profile?.profile_style_key]
  );

  const styleRoot = useMemo(
    () =>
      brandTheme
        ? buildProfileStyleRootStyleFromTokens(brandTheme)
        : buildProfileStyleRootStyle(effectiveStyleKey || DEFAULT_PROFILE_STYLE_KEY),
    [brandTheme, effectiveStyleKey]
  );

  const isFoodTruck = isFoodTruckProfile(profile, profileType);
  const isDiningHall = isDiningHallProfile(profile, profileType);
  const resolvedProfileType = isDiningHall
    ? "dining_hall"
    : isFoodTruck
      ? "food_truck"
      : profileType || "restaurant";
  const allowClaimInvites = showClaimInvites && !isDiningHall;
  const windowsPosts = pickWindowsPosts(billboardPreview, profile);
  const contentMax = PROFILE_CONTENT_MAX;
  const classification = profile?.classification || null;
  const primaryVenue =
    firstNonEmpty(
      classification?.primary_venue_type?.display_name,
      classification?.primary_venue_type?.name,
      isDiningHall ? "Dining Hall" : "",
      profile?.entity_label
    ) || "";
  const cuisineFromClass = Array.isArray(classification?.cuisines)
    ? classification.cuisines.map((c) => c?.display_name || c?.name).filter(Boolean)
    : [];
  const cuisineLabel = cuisineFromClass[0] || cuisine;

  const metaBits = isFoodTruck
    ? [cuisineLabel].filter(Boolean)
    : [primaryVenue, isDiningHall ? null : cuisineLabel]
        .filter(Boolean)
        .filter((v, i, a) => a.findIndex((x) => String(x).toLowerCase() === String(v).toLowerCase()) === i);

  const stops = useMemo(
    () => (isFoodTruck ? normalizeScheduleStops(profile) : []),
    [isFoodTruck, profile]
  );
  const venueCapabilityEnabled =
    profile?.venue_capability_enabled === true ||
    profile?.capabilities?.venue === true;
  const upcomingEvents = Array.isArray(profile?.upcoming_events)
    ? profile.upcoming_events
    : [];
  const location = useMemo(
    () => (isFoodTruck ? buildCurrentLocation(profile, streetAddr, cityLine) : null),
    [isFoodTruck, profile, streetAddr, cityLine]
  );
  const homeDirectionsUrl = useMemo(() => {
    if (directionsUrl) return directionsUrl;
    const query = formatAddressQuery({ streetAddr, cityLine });
    return query ? buildGoogleMapsDirectionsUrl(query) : "";
  }, [directionsUrl, streetAddr, cityLine]);

  const shortDescription = firstNonEmpty(bioText, aboutText, profile?.bio, profile?.about_us);
  const founded = firstNonEmpty(
    foundedText,
    profile?.founded,
    profile?.founded_year != null ? String(profile.founded_year) : "",
    profile?.year_founded
  );
  const establishedLabel = formatEstablishedLabel(founded);
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

  const clusterName = displayCluster?.name ? String(displayCluster.name) : "";
  const clusterHref = displayCluster?.public_url ? String(displayCluster.public_url) : null;
  const sectionGap = isMobile ? 16 : 20;
  const addMenuRestaurant = restaurantFromAddMenuContext({
    profile,
    restaurantId,
    name,
    city: restaurantCity,
    state: restaurantState,
    address: streetAddr,
    menuPreviewItems,
    menuItemCount,
  });

  return (
    <div
      data-testid={
        isDiningHall
          ? "dining-hall-public-editorial"
          : isFoodTruck
            ? "food-truck-public-editorial"
            : "restaurant-public-editorial"
      }
      data-profile-type={resolvedProfileType}
      data-profile-style={effectiveStyleKey || DEFAULT_PROFILE_STYLE_KEY}
      data-brand-theme={brandTheme ? brandTheme.name : undefined}
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
        profileType={resolvedProfileType}
        name={name}
        businessTypeLabel={
          isDiningHall ? "Dining Hall" : isFoodTruck ? "Food Truck" : ""
        }
        cityLine={cityLine}
        streetAddr={streetAddr}
        directionsUrl={isFoodTruck ? homeDirectionsUrl : directionsUrl}
        logoUrl={logoUrl}
        bannerPhotoUrl={bannerPhotoUrl}
        bannerImageFit={bannerImageFit}
        statusLightProps={statusLightProps}
        restaurantId={restaurantId}
        menuHref={isDiningHall ? null : menuHref}
        addMenuRestaurant={isDiningHall ? null : addMenuRestaurant}
        shareData={shareData}
        shareAnalytics={shareAnalytics}
        followSource={
          isDiningHall
            ? "dining_hall_profile"
            : isFoodTruck
              ? "food_truck_profile"
              : "restaurant_profile"
        }
        viewMenuTestId={
          isDiningHall
            ? "dining-hall-no-view-menu"
            : isFoodTruck
              ? "food-truck-view-menu"
              : "restaurant-profile-view-menu"
        }
        showClaimInvites={allowClaimInvites}
        metaBits={metaBits}
        establishedLabel={establishedLabel}
        venueLabel={isFoodTruck ? "" : primaryVenue}
        clusterName={clusterName}
        clusterHref={clusterHref}
        saveContactControl={saveContactControl}
        foodTruckLocation={location}
        phone={phone}
        website={website}
        websiteRaw={websiteRaw}
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
        {isFoodTruck && stops.length ? (
          <ProfileSection title="Upcoming locations">
            <FoodTruckUpcomingStops stops={stops} />
          </ProfileSection>
        ) : null}

        {venueCapabilityEnabled ? (
          <ProfileSection title="Upcoming Events" testId="profile-upcoming-events-section">
            <ProfileUpcomingEvents events={upcomingEvents} />
          </ProfileSection>
        ) : null}

        {allowClaimInvites ? (
          <ProfileClaimBanner claimHref={claimHref} claimState={claimState} />
        ) : null}

        {windowsPosts.length > 0 ? (
          <ProfileBillboardBlock
            billboardPreview={billboardPreview}
            profile={profile}
            isMobile={isMobile}
            windowsPhotoOrientation={resolvedWindowsOrientation}
          />
        ) : null}

        {isDiningHall ? null : (
          <ProfileToday
            name={name || ""}
            updates={updates}
            dealItems={deals}
            restaurantId={restaurantId}
            isMobile={isMobile}
          />
        )}

        <ProfileAboutFounded
          aboutText={shortDescription}
          name={name}
          bannerPhotoUrl={bannerPhotoUrl}
          billboardPreview={billboardPreview}
          isMobile={isMobile}
          omitEmptyFounded
          showPhotos={false}
          windowsPhotoOrientation={resolvedWindowsOrientation}
        />

        {isDiningHall ? null : (
          <ProfileFavoriteMenuItems
            items={favorites}
            isMobile={isMobile}
          />
        )}

        {isDiningHall || !restaurantId ? null : (
          <ProfileVideosSection
            restaurantId={restaurantId}
            restaurantName={name || ""}
            isMobile={isMobile}
          />
        )}

        {restaurantId ? <ConnectionSocialProof restaurantId={restaurantId} /> : null}

        {restaurantId && isDiningHall ? (
          <WhatDinersAreSaying
            restaurantId={restaurantId}
            restaurantSlug={restaurantSlug}
            restaurantCity={restaurantCity}
            restaurantState={restaurantState}
            restaurantName={name || ""}
            menuPreviewItems={null}
            compact={isMobile}
            experienceMode={isDiningHall}
          />
        ) : null}

        <div style={{ height: sectionGap }} aria-hidden="true" />
      </div>
    </div>
  );
}
