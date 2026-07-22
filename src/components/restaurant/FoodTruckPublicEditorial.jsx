/**
 * Food truck public profile — editorial shell + Where & when panel.
 * Visual language matches RestaurantPublicEditorial; truck location/schedule
 * live in an open side panel (collapsible on mobile).
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RestaurantProfileMenuPreview from "./RestaurantProfileMenuPreview.jsx";
import FollowRestaurantButton from "../FollowRestaurantButton.jsx";
import ShareButton from "../share/ShareButton.jsx";
import RestaurantStatusLight from "../RestaurantStatusLight.jsx";
import {
  MENU_ROW_HEADER_ICON_GAP,
  MENU_ROW_ICON_SIZE,
} from "../menu-templates/menuPresentationUtils.js";
import { buildGoogleMapsDirectionsUrl } from "../../lib/catalogMenuUtils.js";

const SCHEDULE_PREVIEW = 5;

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

function fmtTimeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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

function IdentityBlock({
  name,
  cityLine,
  streetAddr,
  directionsUrl,
  logoUrl,
  statusLightProps,
  restaurantId,
  shareData,
  shareAnalytics,
  metaBits,
  onPhoto = false,
  isMobile,
}) {
  const ink = onPhoto ? "#fafaf9" : "#1c1917";
  const muted = onPhoto ? "rgba(250,250,249,0.88)" : "#57534e";

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
          {restaurantId || shareData ? (
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
            </div>
          ) : null}
        </div>

        {cityLine || streetAddr ? (
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

        {metaBits.length ? (
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
      </div>
    </div>
  );
}

function buildLiveLocation(profile) {
  const locName = firstNonEmpty(profile?.current_location_name, profile?.current_location);
  const street = firstNonEmpty(
    profile?.current_address,
    profile?.current_pickup_address,
    profile?.address_line1,
    profile?.address
  );
  const city = firstNonEmpty(profile?.current_city, profile?.city);
  const state = firstNonEmpty(profile?.current_state, profile?.state);
  const cityLine = [city, state].filter(Boolean).join(", ");
  const servingUntil = firstNonEmpty(profile?.serving_until);
  const serviceWindow = firstNonEmpty(profile?.service_window);
  const updatedAt = firstNonEmpty(
    profile?.location_updated_at,
    profile?.current_location_updated_at
  );
  const currentlyServing = profile?.is_currently_serving === true;
  const landmarks = firstNonEmpty(profile?.landmarks);
  const landmarkLines = landmarks
    ? String(landmarks)
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean)
    : [];

  const dest = [street, city, state].filter(Boolean).join(", ") || locName;
  const directionsUrl = dest ? buildGoogleMapsDirectionsUrl(dest) : "";

  return {
    locName,
    street,
    cityLine,
    servingUntil,
    serviceWindow,
    updatedAt,
    currentlyServing,
    landmarkLines,
    directionsUrl,
    hasLocationBits: Boolean(
      locName || street || cityLine || currentlyServing || servingUntil || serviceWindow
    ),
  };
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

/** Where & when — live location + upcoming stops. Always visible (empty states included). */
export function WhereAndWhenPanel({
  profile,
  scheduleHref,
  isMobile,
  collapsed,
  onToggle,
}) {
  const live = useMemo(() => buildLiveLocation(profile), [profile]);
  const stops = useMemo(() => normalizeScheduleStops(profile), [profile]);
  const preview = stops.slice(0, SCHEDULE_PREVIEW);
  const hasMore = stops.length > SCHEDULE_PREVIEW;
  const timeAgo = live.updatedAt ? fmtTimeAgo(live.updatedAt) : "";

  const body = (
    <div data-testid="where-and-when-panel" style={{ display: "grid", gap: 16 }}>
      <div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 24,
            padding: "0 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.3,
            background: live.currentlyServing ? "#ecfdf5" : "#f5f5f4",
            color: live.currentlyServing ? "#166534" : "#57534e",
            border: live.currentlyServing ? "1px solid #bbf7d0" : "1px solid #e7e5e4",
          }}
        >
          {live.currentlyServing ? "Currently serving" : "Not serving right now"}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            color: "#78716c",
            marginBottom: 8,
          }}
        >
          Live location
        </div>
        {live.hasLocationBits ? (
          <div style={{ fontSize: 14, lineHeight: 1.5, color: "#1c1917" }}>
            {live.locName ? (
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{live.locName}</div>
            ) : null}
            {live.street ? <div>{live.street}</div> : null}
            {live.cityLine ? <div style={{ color: "#57534e" }}>{live.cityLine}</div> : null}
            {live.servingUntil ? (
              <div style={{ marginTop: 8, color: "#57534e" }}>Serving until {live.servingUntil}</div>
            ) : live.serviceWindow ? (
              <div style={{ marginTop: 8, color: "#57534e" }}>{live.serviceWindow}</div>
            ) : null}
            {timeAgo ? (
              <div style={{ marginTop: 6, fontSize: 12, color: "#a8a29e" }}>Updated {timeAgo}</div>
            ) : null}
            {live.directionsUrl ? (
              <a
                href={live.directionsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  marginTop: 10,
                  color: "#166534",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Get directions →
              </a>
            ) : null}
          </div>
        ) : (
          <div style={{ fontSize: 14, color: "#78716c", lineHeight: 1.5 }}>
            Location not posted yet.
          </div>
        )}
      </div>

      {live.landmarkLines.length ? (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.7,
              textTransform: "uppercase",
              color: "#78716c",
              marginBottom: 8,
            }}
          >
            Nearby
          </div>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 6 }}>
            {live.landmarkLines.map((line) => (
              <li key={line} style={{ fontSize: 13, color: "#44403c", lineHeight: 1.4 }}>
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            color: "#78716c",
            marginBottom: 8,
          }}
        >
          Upcoming
        </div>
        {preview.length ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
            {preview.map((stop, idx) => (
              <li
                key={`${stop.day}-${stop.location}-${idx}`}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#fafaf9",
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1917", lineHeight: 1.35 }}>
                    {stop.location}
                  </div>
                ) : null}
                {stop.time ? (
                  <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>{stop.time}</div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 14, color: "#78716c", lineHeight: 1.5 }}>
            No upcoming stops yet.
          </div>
        )}
        {scheduleHref ? (
          <Link
            to={scheduleHref}
            style={{
              display: "inline-block",
              marginTop: 12,
              color: "#166534",
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            {hasMore ? "View full schedule →" : "Upcoming locations / events →"}
          </Link>
        ) : null}
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <aside
        aria-label="Where and when"
        style={{
          position: "sticky",
          top: "calc(var(--sph-h, 0px) + 16px)",
          alignSelf: "start",
          width: "100%",
          maxWidth: 320,
          padding: "18px 16px",
          borderRadius: 14,
          border: "1px solid #e7e5e4",
          background: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            color: "#78716c",
            marginBottom: 14,
          }}
        >
          Where & when
        </div>
        {body}
      </aside>
    );
  }

  return (
    <section
      aria-label="Where and when"
      style={{
        marginBottom: 20,
        borderRadius: 14,
        border: "1px solid #e7e5e4",
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.7,
            textTransform: "uppercase",
            color: "#78716c",
          }}
        >
          Where & when
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1917" }}>
          {collapsed ? "Show" : "Hide"}
        </span>
      </button>
      {!collapsed ? <div style={{ padding: "0 16px 16px" }}>{body}</div> : null}
    </section>
  );
}

export default function FoodTruckPublicEditorial({
  profile,
  name,
  streetAddr,
  cityLine,
  directionsUrl,
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
  menuPreviewItems,
  scheduleHref,
  isMobile,
}) {
  const stops = useMemo(() => normalizeScheduleStops(profile), [profile]);
  const currentlyServing = profile?.is_currently_serving === true;
  const defaultOpen = currentlyServing || stops.length > 0;
  const [mobileCollapsed, setMobileCollapsed] = useState(!defaultOpen);

  const metaBits = [cuisine, "Food Truck"].filter(Boolean);
  const hasDetails = Boolean(website || phone || cuisine);
  const hasMenuPreview = Array.isArray(menuPreviewItems) && menuPreviewItems.length > 0;

  const identityProps = {
    name,
    cityLine,
    streetAddr,
    directionsUrl,
    logoUrl,
    statusLightProps,
    restaurantId,
    shareData,
    shareAnalytics,
    metaBits,
    isMobile,
  };

  const wherePanel = (
    <WhereAndWhenPanel
      profile={profile}
      scheduleHref={scheduleHref}
      isMobile={isMobile}
      collapsed={mobileCollapsed}
      onToggle={() => setMobileCollapsed((v) => !v)}
    />
  );

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
        {isMobile ? wherePanel : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : hasMenuPreview
                ? "minmax(260px, 300px) minmax(0, 1.2fr) minmax(220px, 0.85fr)"
                : "minmax(260px, 300px) minmax(0, 1fr)",
            gap: isMobile ? 0 : 24,
            alignItems: "start",
          }}
        >
          {!isMobile ? wherePanel : null}

          <div style={{ minWidth: 0 }}>
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
                  <DetailLine label="Category">Food Truck</DetailLine>
                </div>
              </Section>
            ) : null}

            {isMobile && hasMenuPreview ? (
              <div style={{ marginTop: 8, marginBottom: 24 }}>
                <RestaurantProfileMenuPreview items={menuPreviewItems} isMobile />
              </div>
            ) : null}
          </div>

          {!isMobile && hasMenuPreview ? (
            <RestaurantProfileMenuPreview items={menuPreviewItems} isMobile={false} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
