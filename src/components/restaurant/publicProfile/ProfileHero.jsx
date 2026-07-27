/**
 * Shared public-profile hero: cover/banner + logo + name + status + icon rail.
 * Missing cover → tasteful Menuply gradient placeholder (not fake food photography).
 */
import RestaurantStatusLight from "../../RestaurantStatusLight.jsx";
import FollowRestaurantButton from "../../FollowRestaurantButton.jsx";
import ShareButton from "../../share/ShareButton.jsx";
import FoodTruckCurrentLocation from "./FoodTruckCurrentLocation.jsx";
import {
  LogoMark,
  ViewMenuLink,
  MENU_ROW_ICON_SIZE,
  PROFILE_CONTENT_MAX,
} from "./profilePrimitives.jsx";

export default function ProfileHero({
  profileType = "restaurant",
  name,
  businessTypeLabel = "",
  cityLine,
  streetAddr,
  directionsUrl,
  logoUrl,
  bannerPhotoUrl,
  statusLightProps,
  restaurantId,
  menuHref,
  shareData,
  shareAnalytics,
  followSource = "restaurant_profile",
  viewMenuTestId = "restaurant-profile-view-menu",
  metaBits = [],
  saveContactControl = null,
  foodTruckLocation = null,
  phone = "",
  website = "",
  websiteRaw = "",
  isMobile = false,
  contentMax,
}) {
  const maxW = contentMax ?? PROFILE_CONTENT_MAX;
  const hasPhoto = Boolean(bannerPhotoUrl);
  // Always use light-on-dark identity over photo or gradient placeholder.
  const onPhoto = true;
  const ink = "#fafaf9";
  const muted = "rgba(250,250,249,0.88)";
  const linkColor = "rgba(250,250,249,0.92)";

  const identity = (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
      <LogoMark name={name} logoUrl={logoUrl} onPhoto={onPhoto} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          {statusLightProps ? <RestaurantStatusLight {...statusLightProps} size={7} /> : null}
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 24 : 32,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: ink,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: "0 1 auto",
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            {name}
          </h1>
          {menuHref || restaurantId || shareData || saveContactControl ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <ViewMenuLink href={menuHref} dark={onPhoto} testId={viewMenuTestId} />
              {restaurantId ? (
                <FollowRestaurantButton
                  restaurantId={restaurantId}
                  restaurantName={name}
                  source={followSource}
                  size={MENU_ROW_ICON_SIZE}
                  dark={onPhoto}
                />
              ) : null}
              {shareData ? (
                <ShareButton
                  variant="menu"
                  iconOnly
                  tone="ghost"
                  shareData={shareData}
                  analyticsContext={shareAnalytics || undefined}
                />
              ) : null}
              {saveContactControl || null}
            </div>
          ) : null}
        </div>

        {businessTypeLabel ? (
          <div
            style={{
              marginTop: 6,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              color: muted,
              textTransform: "uppercase",
            }}
          >
            {businessTypeLabel}
          </div>
        ) : null}

        {profileType === "restaurant" && (cityLine || streetAddr) ? (
          directionsUrl ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${name} in Google Maps`}
              title="Open in Google Maps"
              data-testid="profile-hero-maps-address"
              style={{
                margin: "6px 0 0",
                display: "inline-flex",
                alignItems: "flex-start",
                gap: 8,
                fontSize: 14,
                lineHeight: 1.4,
                color: muted,
                textDecoration: "none",
                maxWidth: "100%",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  marginTop: 1,
                  width: 16,
                  height: 16,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="rgba(250,250,249,0.12)"
                  />
                  <circle cx="12" cy="10" r="2.4" fill="currentColor" />
                </svg>
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                {streetAddr ? <span>{streetAddr}</span> : null}
                {cityLine ? <span>{cityLine}</span> : null}
              </span>
            </a>
          ) : (
            <div style={{ margin: "6px 0 0", fontSize: 14, lineHeight: 1.4, color: muted }}>
              {streetAddr ? <div>{streetAddr}</div> : null}
              {cityLine ? <div>{cityLine}</div> : null}
            </div>
          )
        ) : null}

        {profileType === "restaurant" && metaBits.length ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {metaBits.map((bit) => (
              <span
                key={bit}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 999,
                  border: "1px solid rgba(250,250,249,0.35)",
                  background: "rgba(28,25,23,0.25)",
                  color: ink,
                }}
              >
                {bit}
              </span>
            ))}
          </div>
        ) : null}

        {profileType === "food_truck" ? (
          <>
            {metaBits[0] ? (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: muted }}>
                {metaBits[0]}
              </div>
            ) : null}
            {foodTruckLocation?.hasPostedLocation ? (
              <FoodTruckCurrentLocation
                locationText={foodTruckLocation.text || ""}
                directionsUrl={foodTruckLocation.directionsUrl || ""}
                hasPostedLocation
                statusLabel={foodTruckLocation.statusLabel || ""}
                name={name}
                onPhoto={onPhoto}
              />
            ) : null}
            {(phone || website) ? (
              <div
                data-testid="food-truck-contact"
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px 16px",
                  fontSize: 14,
                  lineHeight: 1.45,
                  color: muted,
                }}
              >
                {phone ? (
                  <a
                    href={`tel:${String(phone).replace(/\s+/g, "")}`}
                    style={{ color: linkColor, textDecoration: "none", fontWeight: 600 }}
                  >
                    {phone}
                  </a>
                ) : null}
                {website ? (
                  <a
                    href={website}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: linkColor, textDecoration: "none", fontWeight: 600 }}
                  >
                    {websiteRaw || website} ↗
                  </a>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );

  const overlayPad = {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: isMobile ? "20px 16px 18px" : "28px 28px 24px",
  };

  const headerStyle = hasPhoto
    ? {
        position: "relative",
        minHeight: isMobile ? 220 : 320,
        backgroundColor: "#e7e5e4",
        backgroundImage: `linear-gradient(to top, rgba(28,25,23,0.72) 0%, rgba(28,25,23,0.2) 45%, transparent 70%), url(${JSON.stringify(
          String(bannerPhotoUrl)
        )})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        position: "relative",
        minHeight: isMobile ? 188 : 240,
        background:
          "linear-gradient(160deg, #052e16 0%, #14532d 38%, #292524 100%)",
      };

  return (
    <header
      aria-label={hasPhoto ? `${name} banner` : name}
      data-testid={hasPhoto ? "profile-hero-photo" : "profile-hero-placeholder"}
      style={headerStyle}
    >
      {!hasPhoto ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 20% 30%, rgba(250,250,249,0.18), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(28,25,23,0.2), transparent 50%)",
          }}
        />
      ) : null}
      <div style={overlayPad}>
        <div style={{ maxWidth: maxW, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          {identity}
        </div>
      </div>
    </header>
  );
}
