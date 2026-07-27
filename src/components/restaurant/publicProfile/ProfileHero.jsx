/**
 * Shared public-profile hero: cover/banner + logo + name + status + icon rail.
 */
import RestaurantStatusLight from "../../RestaurantStatusLight.jsx";
import FollowRestaurantButton from "../../FollowRestaurantButton.jsx";
import ShareButton from "../../share/ShareButton.jsx";
import FoodTruckCurrentLocation from "./FoodTruckCurrentLocation.jsx";
import {
  LogoMark,
  ViewMenuLink,
  MENU_ROW_HEADER_ICON_GAP,
  MENU_ROW_ICON_SIZE,
  PROFILE_CONTENT_MAX,
  FOOD_TRUCK_CONTENT_MAX,
  PROFILE_GREEN,
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
  const maxW = contentMax ?? (profileType === "food_truck" ? FOOD_TRUCK_CONTENT_MAX : PROFILE_CONTENT_MAX);
  const onPhoto = Boolean(bannerPhotoUrl);
  const ink = onPhoto ? "#fafaf9" : "#1c1917";
  const muted = onPhoto ? "rgba(250,250,249,0.88)" : "#57534e";
  const linkColor = onPhoto ? "rgba(250,250,249,0.92)" : PROFILE_GREEN;

  const identity = (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
      <LogoMark name={name} logoUrl={logoUrl} onPhoto={onPhoto} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "nowrap",
            minWidth: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
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
              }}
            >
              {name}
            </h1>
          </div>
          {menuHref || restaurantId || shareData || saveContactControl ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: MENU_ROW_HEADER_ICON_GAP,
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
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, letterSpacing: 0.4, color: muted, textTransform: "uppercase" }}>
            {businessTypeLabel}
          </div>
        ) : null}

        {profileType === "restaurant" && (cityLine || streetAddr) ? (
          directionsUrl ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Get directions to ${name}`}
              style={{
                margin: "6px 0 0",
                display: "block",
                fontSize: 14,
                lineHeight: 1.4,
                color: muted,
                textDecoration: "none",
              }}
            >
              {streetAddr ? <span style={{ display: "block" }}>{streetAddr}</span> : null}
              {cityLine ? <span style={{ display: "block" }}>{cityLine}</span> : null}
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
                  border: onPhoto ? "1px solid rgba(250,250,249,0.35)" : "1px solid #d6d3d1",
                  background: onPhoto ? "rgba(28,25,23,0.25)" : "#fff",
                  color: ink,
                }}
              >
                {bit}
              </span>
            ))}
          </div>
        ) : null}

        {profileType === "food_truck" && foodTruckLocation ? (
          <>
            {metaBits[0] ? (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: muted }}>{metaBits[0]}</div>
            ) : null}
            <FoodTruckCurrentLocation
              locationText={foodTruckLocation.text || ""}
              directionsUrl={foodTruckLocation.directionsUrl || ""}
              hasPostedLocation={Boolean(foodTruckLocation.hasPostedLocation)}
              statusLabel={foodTruckLocation.statusLabel || ""}
              name={name}
              onPhoto={onPhoto}
            />
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

  const inner = (
    <div style={{ maxWidth: maxW, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      {identity}
    </div>
  );

  if (bannerPhotoUrl) {
    return (
      <header
        aria-label={`${name} banner`}
        style={{
          position: "relative",
          minHeight: isMobile ? 180 : 240,
          backgroundColor: "#e7e5e4",
          backgroundImage: `linear-gradient(to top, rgba(28,25,23,0.72) 0%, rgba(28,25,23,0.2) 45%, transparent 70%), url(${JSON.stringify(
            String(bannerPhotoUrl)
          )})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: isMobile ? "20px 16px 18px" : "28px 28px 24px",
          }}
        >
          {inner}
        </div>
      </header>
    );
  }

  return (
    <header
      aria-label={name}
      style={{
        maxWidth: maxW,
        margin: "0 auto",
        padding: isMobile ? "24px 16px 8px" : "32px 28px 8px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {identity}
    </header>
  );
}
