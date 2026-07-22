/**
 * Food truck public profile — editorial shell.
 * Current Location under the name (maps pin); upcoming stops inline; full menu elsewhere.
 */
import { useMemo } from "react";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import ShareButton from "../share/ShareButton.jsx";
import RestaurantStatusLight from "../RestaurantStatusLight.jsx";
import MapPinIcon from "../menu-templates/MapPinIcon.jsx";
import {
  MENU_ROW_HEADER_ICON_GAP,
  MENU_ROW_ICON_SIZE,
} from "../menu-templates/menuPresentationUtils.js";
import { buildGoogleMapsDirectionsUrl } from "../../lib/catalogMenuUtils.js";

function asStr(v) {
  return v == null ? "" : String(v);
}

function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = asStr(v).trim();
    if (s) return s;
  }
  return "";
}

function Section({ title, children }) {
  if (children == null || children === false || children === "") return null;
  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: "#78716c",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.65, color: "#1c1917" }}>{children}</div>
    </section>
  );
}

function QuietLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ color: "#166534", textDecoration: "none", fontWeight: 600 }}
    >
      {children}
    </a>
  );
}

function DetailLine({ label, children }) {
  if (!children) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, padding: "8px 0" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#78716c", paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 15, color: "#1c1917", lineHeight: 1.5, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function buildCurrentLocation(profile, streetAddr, cityLine) {
  const locName = firstNonEmpty(profile?.current_location_name, profile?.current_location);
  const street = firstNonEmpty(
    profile?.current_address,
    profile?.current_pickup_address,
    streetAddr,
    profile?.address_line1,
    profile?.address
  );
  const city = firstNonEmpty(profile?.current_city, profile?.city);
  const state = firstNonEmpty(profile?.current_state, profile?.state);
  const liveCityLine = [city, state].filter(Boolean).join(", ") || cityLine;

  const parts = [];
  if (locName) parts.push(locName);
  if (street) parts.push(street);
  if (liveCityLine && liveCityLine !== street && liveCityLine !== locName) parts.push(liveCityLine);

  const text = parts.join(" · ") || "";
  const mapsDest = [street, liveCityLine].filter(Boolean).join(", ") || locName || text;
  const directionsUrl = mapsDest ? buildGoogleMapsDirectionsUrl(mapsDest) : "";

  return { text, directionsUrl };
}

function normalizeScheduleStops(profile) {
  const raw = profile?.schedule || profile?.scheduled_locations;
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean).map((entry) => ({
    day: firstNonEmpty(entry?.day, entry?.date),
    location: firstNonEmpty(entry?.location, entry?.address, entry?.place),
    time: firstNonEmpty(entry?.time, entry?.time_window, entry?.hours),
  }));
}

function UpcomingStops({ stops }) {
  return (
    <Section title="Upcoming">
      <div data-testid="food-truck-upcoming" style={{ display: "grid", gap: 10 }}>
        {stops.length ? (
          stops.map((stop, idx) => (
            <div
              key={`${stop.day}-${stop.location}-${idx}`}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #e7e5e4",
              }}
            >
              {stop.day ? (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: "#166534",
                    marginBottom: 4,
                  }}
                >
                  {stop.day}
                </div>
              ) : null}
              {stop.location ? (
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1917", lineHeight: 1.35 }}>
                  {stop.location}
                </div>
              ) : null}
              {stop.time ? (
                <div style={{ fontSize: 13, color: "#78716c", marginTop: 2 }}>{stop.time}</div>
              ) : null}
            </div>
          ))
        ) : (
          <div style={{ fontSize: 14, color: "#78716c", lineHeight: 1.5 }}>
            No upcoming stops yet.
          </div>
        )}
      </div>
    </Section>
  );
}

function IdentityBlock({
  name,
  currentLocationText,
  directionsUrl,
  logoUrl,
  statusLightProps,
  restaurantId,
  shareData,
  shareAnalytics,
  saveContactControl,
  cuisine,
  onPhoto = false,
  isMobile,
}) {
  const ink = onPhoto ? "#fafaf9" : "#1c1917";
  const muted = onPhoto ? "rgba(250,250,249,0.88)" : "#57534e";
  const pinStroke = onPhoto ? "#fafaf9" : "#166534";

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, minWidth: 0 }}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          width={64}
          height={64}
          style={{
            width: 64,
            height: 64,
            objectFit: "cover",
            borderRadius: 12,
            border: onPhoto ? "2px solid #fafaf9" : "1px solid #e7e5e4",
            background: "#fff",
            flexShrink: 0,
          }}
        />
      ) : null}
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
          {restaurantId || shareData || saveContactControl ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: MENU_ROW_HEADER_ICON_GAP,
                flexShrink: 0,
              }}
            >
              {restaurantId ? (
                <FollowRestaurantButton
                  restaurantId={restaurantId}
                  restaurantName={name}
                  source="food_truck_profile"
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

        <div
          data-testid="food-truck-current-location"
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.45, color: muted }}>
            <span style={{ fontWeight: 700, color: ink }}>Current Location:</span>{" "}
            <span>{currentLocationText || "Location not posted yet."}</span>
          </div>
          {directionsUrl ? (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open directions to ${name} in Google Maps`}
              title="Directions"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 8,
                flexShrink: 0,
                color: pinStroke,
                textDecoration: "none",
                background: onPhoto ? "rgba(28,25,23,0.28)" : "#ecfdf5",
                border: onPhoto ? "1px solid rgba(250,250,249,0.35)" : "1px solid #bbf7d0",
              }}
            >
              <MapPinIcon size={16} stroke={pinStroke} />
            </a>
          ) : null}
        </div>

        {cuisine ? (
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: muted }}>{cuisine}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function FoodTruckPublicEditorial({
  profile,
  name,
  streetAddr,
  cityLine,
  website,
  websiteRaw,
  phone,
  cuisine,
  aboutText,
  logoUrl,
  bannerPhotoUrl,
  statusLightProps,
  restaurantId,
  shareData,
  shareAnalytics,
  saveContactControl = null,
  isMobile,
}) {
  const stops = useMemo(() => normalizeScheduleStops(profile), [profile]);
  const location = useMemo(
    () => buildCurrentLocation(profile, streetAddr, cityLine),
    [profile, streetAddr, cityLine]
  );
  const hasDetails = Boolean(website || phone || cuisine);

  const identityProps = {
    name,
    currentLocationText: location.text,
    directionsUrl: location.directionsUrl,
    logoUrl,
    statusLightProps,
    restaurantId,
    shareData,
    shareAnalytics,
    saveContactControl,
    cuisine,
    isMobile,
  };

  return (
    <div
      data-testid="food-truck-public-editorial"
      style={{
        background: "#fafaf9",
        color: "#1c1917",
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
      }}
    >
      {bannerPhotoUrl ? (
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
            <div style={{ maxWidth: 1040, margin: "0 auto" }}>
              <IdentityBlock {...identityProps} onPhoto />
            </div>
          </div>
        </header>
      ) : (
        <header
          aria-label={name}
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: isMobile ? "24px 16px 8px" : "32px 28px 8px",
          }}
        >
          <IdentityBlock {...identityProps} onPhoto={false} />
        </header>
      )}

      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: isMobile ? "20px 16px 0" : "28px 28px 0",
        }}
      >
        <Section title="About">{aboutText || null}</Section>

        {hasDetails ? (
          <Section title="Details">
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
            </div>
          </Section>
        ) : null}

        <UpcomingStops stops={stops} />
      </div>
    </div>
  );
}
