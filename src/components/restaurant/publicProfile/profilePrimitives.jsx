/**
 * Shared primitives for Menuply public restaurant + food-truck profiles.
 * Presentation only — no ordering, claim entitlement, or schema changes.
 */
import { Link } from "react-router-dom";
import ViewMenuIcon from "../../icons/ViewMenuIcon.jsx";
import IconHoverLabel from "../../IconHoverLabel.jsx";
import {
  MENU_ROW_HEADER_ICON_GAP,
  MENU_ROW_ICON_SIZE,
} from "../../menu-templates/menuPresentationUtils.js";
import { buildGoogleMapsDirectionsUrl } from "../../../lib/catalogMenuUtils.js";

export const PROFILE_PAGE_BG = "#fafaf9";
export const PROFILE_INK = "#1c1917";
export const PROFILE_MUTED = "#78716c";
export const PROFILE_GREEN = "#166534";
export const PROFILE_CONTENT_MAX = 1040;
export const FOOD_TRUCK_CONTENT_MAX = 640;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function asStr(v) {
  return v == null ? "" : String(v);
}

export function firstNonEmpty(...vals) {
  for (const v of vals) {
    const s = asStr(v).trim();
    if (s) return s;
  }
  return "";
}

export function ghostIconStyle(dark) {
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

export function ViewMenuLink({ href, dark, testId = "restaurant-profile-view-menu" }) {
  if (!href) return null;
  return (
    <IconHoverLabel label="View menu">
      <Link
        to={href}
        data-testid={testId}
        aria-label="View menu"
        title="View menu"
        style={ghostIconStyle(dark)}
      >
        <ViewMenuIcon size={14} color="currentColor" />
      </Link>
    </IconHoverLabel>
  );
}

export { MENU_ROW_HEADER_ICON_GAP, MENU_ROW_ICON_SIZE };

export function ProfileSection({ title, children, empty = false, testId }) {
  if (children == null || children === false || children === "") return null;
  return (
    <section style={{ marginBottom: 28 }} data-empty={empty ? "true" : undefined} data-testid={testId}>
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: PROFILE_MUTED,
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.65,
          color: empty ? PROFILE_MUTED : PROFILE_INK,
          fontStyle: empty ? "italic" : undefined,
        }}
      >
        {children}
      </div>
    </section>
  );
}

export function QuietLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{ color: PROFILE_GREEN, textDecoration: "none", fontWeight: 600 }}
    >
      {children}
    </a>
  );
}

export function DetailLine({ label, children }) {
  if (!children) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, padding: "8px 0" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: PROFILE_MUTED, paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 15, color: PROFILE_INK, lineHeight: 1.5, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export function LogoMark({ name, logoUrl, onPhoto = false }) {
  if (logoUrl) {
    return (
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
    );
  }
  const initial = (asStr(name).trim().charAt(0) || "?").toUpperCase();
  return (
    <div
      aria-hidden="true"
      style={{
        width: 64,
        height: 64,
        borderRadius: 12,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 800,
        flexShrink: 0,
        background: onPhoto ? "rgba(250,250,249,0.2)" : "#f5f5f4",
        border: onPhoto ? "2px solid #fafaf9" : "1px solid #e7e5e4",
        color: onPhoto ? "#fafaf9" : PROFILE_MUTED,
      }}
    >
      {initial}
    </div>
  );
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

export function formatHoursRows(rows) {
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

export function normalizeScheduleStops(profile) {
  const raw = profile?.schedule || profile?.scheduled_locations;
  if (!Array.isArray(raw)) return [];
  const now = Date.now();
  return raw
    .filter(Boolean)
    .map((entry) => ({
      day: firstNonEmpty(entry?.day, entry?.date),
      location: firstNonEmpty(entry?.location, entry?.address, entry?.place),
      time: firstNonEmpty(entry?.time, entry?.time_window, entry?.hours),
      eventName: firstNonEmpty(entry?.event_name, entry?.name, entry?.title),
      startsAt: entry?.starts_at || entry?.start_at || entry?.start || null,
    }))
    .filter((stop) => {
      if (!stop.startsAt) return true;
      const t = Date.parse(String(stop.startsAt));
      if (Number.isNaN(t)) return true;
      return t >= now - 60 * 60 * 1000;
    });
}

export function buildCurrentLocation(profile, streetAddr, cityLine) {
  const locName = firstNonEmpty(profile?.current_location_name, profile?.current_location, profile?.current_pickup_label);
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

  const hasPostedLocation = Boolean(
    locName ||
      profile?.current_pickup_address ||
      profile?.current_address ||
      profile?.is_currently_serving === true
  );

  const parts = [];
  if (locName) parts.push(locName);
  if (street && hasPostedLocation) parts.push(street);
  if (hasPostedLocation && liveCityLine && liveCityLine !== street && liveCityLine !== locName) {
    parts.push(liveCityLine);
  }

  const text = parts.join(" · ") || "";
  const mapsDest = hasPostedLocation
    ? [street, liveCityLine].filter(Boolean).join(", ") || locName || text
    : "";
  const directionsUrl = mapsDest ? buildGoogleMapsDirectionsUrl(mapsDest) : "";

  let statusLabel = "";
  if (profile?.is_currently_serving === true) statusLabel = "Now Serving";
  else if (hasPostedLocation) statusLabel = "Location posted";
  else statusLabel = "";

  return { text, directionsUrl, hasPostedLocation, statusLabel };
}

/** Order CTA only when menu exists and ordering is not display-only / paused. */
export function canShowOrderAction(profile, menuHref) {
  if (!menuHref) return false;
  const mode = String(profile?.public_ordering_mode || "").trim().toLowerCase();
  if (mode === "display_only") return false;
  const accept = String(profile?.order_acceptance_status || "").trim().toLowerCase();
  if (accept === "paused" || accept === "closed" || accept === "disabled" || accept === "off") {
    return false;
  }
  return true;
}

export function actionChipStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid #d6d3d1",
    background: "#fff",
    color: PROFILE_INK,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: "nowrap",
    cursor: "pointer",
  };
}

export function primaryActionChipStyle() {
  return {
    ...actionChipStyle(),
    background: PROFILE_GREEN,
    borderColor: PROFILE_GREEN,
    color: "#fff",
  };
}
