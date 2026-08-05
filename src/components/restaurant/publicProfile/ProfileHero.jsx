/**
 * Shared public-profile hero: cover/banner + logo + name + cuisine + description
 * + open/closed + action rail (Like / Share / Call / Directions / Order).
 * View Menu lives under Favorite Menu Items (not in hero).
 */
import { Link } from "react-router-dom";
import RestaurantStatusLight from "../../RestaurantStatusLight.jsx";
import FollowRestaurantButton from "../../FollowRestaurantButton.jsx";
import ShareButton from "../../share/ShareButton.jsx";
import FoodTruckCurrentLocation from "./FoodTruckCurrentLocation.jsx";
import {
  LogoMark,
  MENU_ROW_ICON_SIZE,
  PROFILE_CONTENT_MAX,
  ghostIconStyle,
  canShowOrderAction,
} from "./profilePrimitives.jsx";
import IconHoverLabel from "../../IconHoverLabel.jsx";

function HeroIconButton({ href, onClick, label, testId, children, as: As = "a" }) {
  const style = ghostIconStyle(true);
  if (As === "button" || onClick) {
    return (
      <IconHoverLabel label={label}>
        <button
          type="button"
          data-testid={testId}
          aria-label={label}
          title={label}
          onClick={onClick}
          style={{ ...style, appearance: "none" }}
        >
          {children}
        </button>
      </IconHoverLabel>
    );
  }
  if (!href) return null;
  const isInternal = href.startsWith("/");
  if (isInternal) {
    return (
      <IconHoverLabel label={label}>
        <Link to={href} data-testid={testId} aria-label={label} title={label} style={style}>
          {children}
        </Link>
      </IconHoverLabel>
    );
  }
  return (
    <IconHoverLabel label={label}>
      <a
        href={href}
        data-testid={testId}
        aria-label={label}
        title={label}
        target={href.startsWith("tel:") ? undefined : "_blank"}
        rel={href.startsWith("tel:") ? undefined : "noreferrer"}
        style={style}
      >
        {children}
      </a>
    </IconHoverLabel>
  );
}

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
  metaBits = [],
  venueLabel = "",
  clusterName = "",
  clusterHref = null,
  saveContactControl = null,
  foodTruckLocation = null,
  phone = "",
  website = "",
  websiteRaw = "",
  shortDescription = "",
  openStatus = null,
  profile = null,
  isMobile = false,
  contentMax,
}) {
  void website;
  void websiteRaw;
  void streetAddr;
  void cityLine;

  const maxW = contentMax ?? PROFILE_CONTENT_MAX;
  const hasPhoto = Boolean(bannerPhotoUrl);
  const onPhoto = true;
  const ink = "#fafaf9";
  const muted = "rgba(250,250,249,0.88)";
  const linkColor = "rgba(250,250,249,0.92)";

  const venue = String(venueLabel || "").trim();
  const cluster = String(clusterName || "").trim();
  const showIdentityMeta = profileType === "restaurant" && (venue || cluster || metaBits.length);
  const cuisineLabel = metaBits[0] || "";
  const desc = String(shortDescription || "").trim();
  const openLabel = openStatus?.label || (openStatus?.is_open === true ? "Open" : openStatus?.is_open === false ? "Closed" : "");
  const showOrder =
    profileType !== "food_truck" && canShowOrderAction(profile, menuHref);
  const callHref = phone ? `tel:${String(phone).replace(/\s+/g, "")}` : "";
  const mapsHref =
    profileType === "food_truck"
      ? foodTruckLocation?.directionsUrl || directionsUrl || ""
      : directionsUrl || "";

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
          <div
            data-testid="profile-hero-actions"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
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
            {callHref ? (
              <HeroIconButton href={callHref} label="Call" testId="profile-hero-call">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </HeroIconButton>
            ) : null}
            {mapsHref ? (
              <HeroIconButton href={mapsHref} label="Directions" testId="profile-hero-directions">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle cx="12" cy="10" r="2.4" fill="currentColor" />
                </svg>
              </HeroIconButton>
            ) : null}
            {showOrder ? (
              <HeroIconButton href={menuHref} label="Order" testId="profile-action-order">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 6h16M4 12h16M4 18h10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </HeroIconButton>
            ) : null}
            {saveContactControl || null}
          </div>
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

        {cuisineLabel && profileType === "food_truck" ? (
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: muted }}>
            {cuisineLabel}
          </div>
        ) : null}

        {showIdentityMeta ? (
          <div
            data-testid="profile-hero-identity-meta"
            style={{
              marginTop: 6,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              gap: "4px 0",
              fontSize: 13,
              fontWeight: 600,
              lineHeight: 1.35,
              color: muted,
            }}
          >
            {venue ? (
              <span data-testid="profile-hero-venue">{venue}</span>
            ) : metaBits[0] ? (
              <span data-testid="profile-hero-venue">{metaBits[0]}</span>
            ) : null}
            {(venue || metaBits[0]) && cluster ? (
              <span aria-hidden="true" style={{ margin: "0 8px", opacity: 0.55 }}>
                ·
              </span>
            ) : null}
            {cluster ? (
              clusterHref ? (
                <Link
                  to={clusterHref}
                  data-testid="profile-hero-cluster"
                  style={{ color: linkColor, textDecoration: "none", fontWeight: 700 }}
                >
                  {cluster}
                </Link>
              ) : (
                <span data-testid="profile-hero-cluster">{cluster}</span>
              )
            ) : null}
          </div>
        ) : null}

        {desc ? (
          <p
            data-testid="profile-hero-description"
            style={{
              margin: "8px 0 0",
              fontSize: 14,
              lineHeight: 1.45,
              color: muted,
              maxWidth: 520,
            }}
          >
            {desc}
          </p>
        ) : null}

        {openLabel ? (
          <div
            data-testid="profile-hero-open-status"
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 700,
              color: openStatus?.is_open ? "#bbf7d0" : muted,
            }}
          >
            {openLabel}
          </div>
        ) : null}

        {profileType === "food_truck" && foodTruckLocation?.hasPostedLocation ? (
          <FoodTruckCurrentLocation
            locationText={foodTruckLocation.text || ""}
            directionsUrl={foodTruckLocation.directionsUrl || ""}
            hasPostedLocation
            statusLabel={foodTruckLocation.statusLabel || ""}
            name={name}
            onPhoto={onPhoto}
          />
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
          "linear-gradient(160deg, var(--profile-hero-from, #052e16) 0%, var(--profile-hero-via, #14532d) 38%, var(--profile-hero-to, #292524) 100%)",
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
