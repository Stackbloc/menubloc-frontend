/**
 * Shared public-profile hero: cover/banner + logo + name + contact under the name
 * + hours on the right of the green box (stacked on mobile).
 * Action rail: View Menu icon next to name, then Like / Share / Call / Order.
 */
import { Link } from "react-router-dom";
import RestaurantStatusLight from "../../RestaurantStatusLight.jsx";
import FollowRestaurantButton from "../../FollowRestaurantButton.jsx";
import ShareButton from "../../share/ShareButton.jsx";
import FoodTruckCurrentLocation from "./FoodTruckCurrentLocation.jsx";
import {
  LogoMark,
  ViewMenuLink,
  MENU_ROW_ICON_SIZE,
  PROFILE_CONTENT_MAX,
  ghostIconStyle,
  canShowOrderAction,
  formatHoursRows,
  firstNonEmpty,
} from "./profilePrimitives.jsx";
import IconHoverLabel from "../../IconHoverLabel.jsx";
import { formatWebsiteHostLabel } from "../../../lib/formatWebsiteHostLabel.js";

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

function MapsPin() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 22s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="rgba(250,250,249,0.12)"
      />
      <circle cx="12" cy="10" r="2.4" fill="currentColor" />
    </svg>
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
  viewMenuTestId = "restaurant-profile-view-menu",
  showClaimInvites = false,
  metaBits = [],
  venueLabel = "",
  clusterName = "",
  clusterHref = null,
  saveContactControl = null,
  foodTruckLocation = null,
  phone = "",
  website = "",
  websiteRaw = "",
  instagram = "",
  shortDescription = "",
  openStatus = null,
  operatingHours = [],
  profile = null,
  isMobile = false,
  contentMax,
}) {
  void shortDescription;

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
  const openLabel =
    openStatus?.label ||
    (openStatus?.is_open === true ? "Open" : openStatus?.is_open === false ? "Closed" : "");
  const showOrder = profileType !== "food_truck" && canShowOrderAction(profile, menuHref);
  const callHref = phone ? `tel:${String(phone).replace(/\s+/g, "")}` : "";
  const mapsHref =
    profileType === "food_truck"
      ? foodTruckLocation?.directionsUrl || directionsUrl || ""
      : directionsUrl || "";
  const websiteLabel = formatWebsiteHostLabel(websiteRaw || website);
  const ig = firstNonEmpty(instagram);
  const igHref = ig
    ? ig.startsWith("http")
      ? ig
      : `https://instagram.com/${String(ig).replace(/^@/, "")}`
    : "";
  const igLabel = ig
    ? ig.startsWith("@") || ig.startsWith("http")
      ? ig.startsWith("http")
        ? `@${String(ig).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/$/, "")}`
        : ig
      : `@${String(ig).replace(/^@/, "")}`
    : "";
  const hoursRows = formatHoursRows(operatingHours);
  const showRestaurantContact = profileType === "restaurant";
  const hasAddress = Boolean(streetAddr || cityLine);

  const hoursPanel = (
    <div
      data-testid="profile-hero-hours"
      style={{
        flex: isMobile ? "1 1 100%" : "0 0 220px",
        minWidth: isMobile ? 0 : 180,
        maxWidth: isMobile ? "100%" : 240,
        padding: isMobile ? "10px 12px" : "12px 14px",
        borderRadius: 12,
        background: "rgba(28,25,23,0.28)",
        border: "1px solid rgba(250,250,249,0.18)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: muted,
          marginBottom: 8,
        }}
      >
        Hours{openLabel ? ` · ${openLabel}` : ""}
      </div>
      {hoursRows.length ? (
        <div style={{ display: "grid", gap: 3 }}>
          {hoursRows.map((row) => (
            <div
              key={row.day}
              style={{
                display: "grid",
                gridTemplateColumns: "36px 1fr",
                gap: 8,
                fontSize: 12,
                color: ink,
              }}
            >
              <span style={{ color: muted, fontWeight: 700 }}>{row.day}</span>
              <span>{row.text}</span>
            </div>
          ))}
        </div>
      ) : showClaimInvites ? (
        <div data-testid="profile-hero-hours-blank" style={{ fontSize: 12, color: muted, fontStyle: "italic" }}>
          Claim this profile to complete hours.
        </div>
      ) : (
        <div style={{ fontSize: 12, color: muted }}>Hours not posted</div>
      )}
    </div>
  );

  const identityLeft = (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0, flex: "1 1 280px" }}>
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

        {showRestaurantContact && hasAddress ? (
          mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${name} in Google Maps`}
              title="Open in Google Maps"
              data-testid="profile-hero-maps-address"
              style={{
                margin: "8px 0 0",
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
                <MapsPin />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                {streetAddr ? <span>{streetAddr}</span> : null}
                {cityLine ? <span>{cityLine}</span> : null}
              </span>
            </a>
          ) : (
            <div
              data-testid="profile-hero-maps-address"
              style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.4, color: muted }}
            >
              {streetAddr ? <div>{streetAddr}</div> : null}
              {cityLine ? <div>{cityLine}</div> : null}
            </div>
          )
        ) : null}

        {showRestaurantContact && (phone || igHref || website) ? (
          <div
            data-testid="profile-hero-contact"
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 14,
              lineHeight: 1.4,
              color: muted,
              paddingLeft: hasAddress ? 24 : 0,
            }}
          >
            {phone ? (
              <a
                href={callHref}
                data-testid="profile-hero-phone"
                style={{ color: linkColor, textDecoration: "none", fontWeight: 600 }}
              >
                {phone}
              </a>
            ) : null}
            {igHref ? (
              <a
                href={igHref}
                target="_blank"
                rel="noreferrer"
                data-testid="profile-hero-instagram"
                style={{ color: linkColor, textDecoration: "none", fontWeight: 600 }}
              >
                {igLabel}
              </a>
            ) : showClaimInvites ? (
              <span data-testid="profile-hero-instagram-blank" style={{ fontStyle: "italic", fontSize: 13 }}>
                Claim this profile to complete Instagram.
              </span>
            ) : null}
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noreferrer"
                data-testid="profile-hero-website"
                style={{ color: linkColor, textDecoration: "none", fontWeight: 600 }}
              >
                {websiteLabel} ↗
              </a>
            ) : showClaimInvites ? (
              <span data-testid="profile-hero-website-blank" style={{ fontStyle: "italic", fontSize: 13 }}>
                Claim this profile to complete website.
              </span>
            ) : null}
          </div>
        ) : showRestaurantContact && showClaimInvites ? (
          <div
            data-testid="profile-hero-contact"
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 13,
              fontStyle: "italic",
              color: muted,
              paddingLeft: hasAddress ? 24 : 0,
            }}
          >
            <span data-testid="profile-hero-instagram-blank">Claim this profile to complete Instagram.</span>
            <span data-testid="profile-hero-website-blank">Claim this profile to complete website.</span>
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

        {profileType === "food_truck" && (phone || website) ? (
          <div
            data-testid="food-truck-contact"
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 14,
              lineHeight: 1.45,
              color: muted,
            }}
          >
            {phone ? (
              <a
                href={callHref}
                data-testid="food-truck-hero-phone"
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
                data-testid="food-truck-hero-website"
                style={{ color: linkColor, textDecoration: "none", fontWeight: 600 }}
              >
                {websiteLabel} ↗
              </a>
            ) : null}
          </div>
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
        minHeight: isMobile ? 260 : 340,
        backgroundColor: "#e7e5e4",
        backgroundImage: `linear-gradient(to top, rgba(28,25,23,0.78) 0%, rgba(28,25,23,0.28) 48%, transparent 72%), url(${JSON.stringify(
          String(bannerPhotoUrl)
        )})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        position: "relative",
        minHeight: isMobile ? 220 : 280,
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
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: isMobile ? 14 : 24,
            }}
          >
            {identityLeft}
            {hoursPanel}
          </div>
        </div>
      </div>
    </header>
  );
}
