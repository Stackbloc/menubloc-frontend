/**
 * Food truck public profile — personality-first editorial shell.
 * Menu is one icon away; story sections live on the page.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import ShareButton from "../share/ShareButton.jsx";
import RestaurantStatusLight from "../RestaurantStatusLight.jsx";
import MapPinIcon from "../menu-templates/MapPinIcon.jsx";
import ViewMenuIcon from "../icons/ViewMenuIcon.jsx";
import IconHoverLabel from "../IconHoverLabel.jsx";
import {
  MENU_ROW_HEADER_ICON_GAP,
  MENU_ROW_ICON_SIZE,
} from "../menu-templates/menuPresentationUtils.js";
import { buildGoogleMapsDirectionsUrl } from "../../lib/catalogMenuUtils.js";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function Section({ title, children, empty = false }) {
  if (children == null || children === false || children === "") return null;
  return (
    <section style={{ marginBottom: 28 }} data-empty={empty ? "true" : undefined}>
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
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.65,
          color: empty ? "#78716c" : "#1c1917",
          fontStyle: empty ? "italic" : undefined,
        }}
      >
        {children}
      </div>
    </section>
  );
}

const CONTENT_MAX = 640;

function ghostIconStyle(dark) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: MENU_ROW_ICON_SIZE,
    height: MENU_ROW_ICON_SIZE,
    minWidth: MENU_ROW_ICON_SIZE,
    minHeight: MENU_ROW_ICON_SIZE,
    padding: 0,
    borderRadius: "50%",
    border: dark ? "1px solid rgba(255,255,255,0.28)" : "1px solid rgba(55,65,81,0.22)",
    background: dark ? "rgba(28,25,23,0.35)" : "rgba(255,255,255,0.96)",
    color: dark ? "#fafaf9" : "#0f172a",
    flexShrink: 0,
    boxShadow: dark ? "none" : "0 2px 8px rgba(15, 23, 42, 0.12)",
    textDecoration: "none",
    cursor: "pointer",
    lineHeight: 0,
  };
}

function ViewMenuLink({ href, dark }) {
  if (!href) return null;
  return (
    <IconHoverLabel label="View menu">
      <Link
        to={href}
        data-testid="food-truck-view-menu"
        aria-label="View menu"
        title="View menu"
        style={ghostIconStyle(dark)}
      >
        <ViewMenuIcon size={14} color="currentColor" />
      </Link>
    </IconHoverLabel>
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

function formatTimeLabel(raw) {
  const s = asStr(raw).trim();
  if (!s) return "";
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return s;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${min} ${ampm}`;
}

function formatHoursRows(rows) {
  if (!Array.isArray(rows) || !rows.length) return [];
  return [...rows]
    .sort((a, b) => Number(a.day_of_week) - Number(b.day_of_week))
    .map((row) => {
      const day = DAY_LABELS[Number(row.day_of_week)] || `Day ${row.day_of_week}`;
      if (row.is_closed) return { day, text: "Closed" };
      if (row.label) return { day, text: String(row.label) };
      const open = formatTimeLabel(row.opens_at);
      const close = formatTimeLabel(row.closes_at);
      if (open && close) return { day, text: `${open} – ${close}` };
      return { day, text: open || close || "—" };
    });
}

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
      <div style={{ fontSize: 16, fontWeight: 800, color: "#1c1917", lineHeight: 1.3 }}>
        {name}
        {price != null && String(price).trim() ? (
          <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 600, color: "#78716c" }}>
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

function IdentityBlock({
  name,
  currentLocationText,
  directionsUrl,
  website,
  websiteRaw,
  phone,
  logoUrl,
  statusLightProps,
  restaurantId,
  shareData,
  shareAnalytics,
  saveContactControl,
  menuHref,
  cuisine,
  onPhoto = false,
  isMobile,
}) {
  const ink = onPhoto ? "#fafaf9" : "#1c1917";
  const muted = onPhoto ? "rgba(250,250,249,0.88)" : "#57534e";
  const pinStroke = onPhoto ? "#fafaf9" : "#166534";
  const linkColor = onPhoto ? "rgba(250,250,249,0.92)" : "#166534";

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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: MENU_ROW_HEADER_ICON_GAP,
              flexShrink: 0,
            }}
          >
            <ViewMenuLink href={menuHref} dark={onPhoto} />
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
        </div>

        {cuisine ? (
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: muted }}>{cuisine}</div>
        ) : null}

        <div
          data-testid="food-truck-current-location"
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.45, color: muted }}>
            <span style={{ fontWeight: 700, color: ink }}>Current Location:</span>{" "}
            {directionsUrl && currentLocationText ? (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: muted, textDecoration: "underline", textUnderlineOffset: 2 }}
              >
                {currentLocationText}
              </a>
            ) : (
              <span>{currentLocationText || "Location not posted yet."}</span>
            )}
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
  bioText = "",
  aboutText = "",
  foundedText = "",
  featuredItem = null,
  todaysSpecial = null,
  operatingHours = [],
  logoUrl,
  bannerPhotoUrl,
  statusLightProps,
  restaurantId,
  shareData,
  shareAnalytics,
  saveContactControl = null,
  menuHref = null,
  isMobile,
}) {
  const stops = useMemo(() => normalizeScheduleStops(profile), [profile]);
  const location = useMemo(
    () => buildCurrentLocation(profile, streetAddr, cityLine),
    [profile, streetAddr, cityLine]
  );
  const hoursRows = useMemo(() => formatHoursRows(operatingHours), [operatingHours]);

  const bio = firstNonEmpty(bioText);
  const about = firstNonEmpty(aboutText);
  const aboutDistinct = about && about.toLowerCase() !== bio.toLowerCase() ? about : "";
  const founded = firstNonEmpty(foundedText, profile?.founded, profile?.founded_year, profile?.year_founded);

  const identityProps = {
    name,
    currentLocationText: location.text,
    directionsUrl: location.directionsUrl,
    website,
    websiteRaw,
    phone,
    logoUrl,
    statusLightProps,
    restaurantId,
    shareData,
    shareAnalytics,
    saveContactControl,
    menuHref,
    cuisine,
    isMobile,
  };

  const columnStyle = {
    maxWidth: CONTENT_MAX,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
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
              padding: isMobile ? "20px 16px 18px" : "28px 24px 24px",
            }}
          >
            <div style={columnStyle}>
              <IdentityBlock {...identityProps} onPhoto />
            </div>
          </div>
        </header>
      ) : (
        <header
          aria-label={name}
          style={{
            ...columnStyle,
            padding: isMobile ? "24px 16px 8px" : "32px 24px 8px",
          }}
        >
          <IdentityBlock {...identityProps} onPhoto={false} />
        </header>
      )}

      <div
        style={{
          ...columnStyle,
          padding: isMobile ? "20px 16px 8px" : "28px 24px 8px",
        }}
      >
        <Section title="Hours of operation" empty={!hoursRows.length}>
          {hoursRows.length ? (
            <div
              data-testid="food-truck-hours"
              style={{ display: "grid", gap: 6 }}
            >
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
                  <span style={{ color: "#1c1917" }}>{row.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <span data-testid="food-truck-hours">Hours not posted yet.</span>
          )}
        </Section>

        <Section title="Bio" empty={!bio}>
          {bio || "Bio coming soon."}
        </Section>

        {aboutDistinct ? <Section title="About us">{aboutDistinct}</Section> : null}

        {founded ? <Section title="Founded">{founded}</Section> : null}

        <Section title="Featured dish" empty={!featuredItem?.name}>
          {featuredItem?.name ? (
            <DishCard
              name={featuredItem.name}
              description={featuredItem.description}
              price={featuredItem.price}
            />
          ) : (
            "No featured dish yet."
          )}
        </Section>

        <Section title="Today's special" empty={!todaysSpecial?.name}>
          {todaysSpecial?.name ? (
            <DishCard
              name={todaysSpecial.name}
              description={todaysSpecial.description}
              price={todaysSpecial.price}
            />
          ) : (
            "No special posted today."
          )}
        </Section>

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
              <div style={{ fontSize: 14, color: "#78716c", lineHeight: 1.5, fontStyle: "italic" }}>
                No upcoming stops yet.
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
