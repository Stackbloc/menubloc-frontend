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
import { normalizeDisplayAddress, formatAddressQuery } from "../../../lib/displayAddress.js";
import { formatHoursRows, getTodayDayOfWeek, formatFoodTruckHoursTodayHeading } from "../../../lib/formatOperatingHours.js";

export { formatHoursRows, getTodayDayOfWeek, formatFoodTruckHoursTodayHeading };

export const PROFILE_PAGE_BG = "#fafaf9";
export const PROFILE_INK = "#1c1917";
export const PROFILE_MUTED = "#78716c";
export const PROFILE_GREEN = "#166534";
export const PROFILE_CONTENT_MAX = 1040;
export const FOOD_TRUCK_CONTENT_MAX = 640;

/** CSS vars set by PublicProfileShell from Restaurant Style tokens (with fallbacks). */
export const profilePageBgVar = `var(--profile-page-background, ${PROFILE_PAGE_BG})`;
export const profileAccentVar = `var(--profile-accent, ${PROFILE_GREEN})`;
export const profileSectionLabelVar = `var(--profile-section-label, ${PROFILE_GREEN})`;
export const profileCardBorderVar = "var(--profile-card-border, #e7e5e4)";
export const profileCardShadowVar = "var(--profile-card-shadow, 0 1px 2px rgba(28,25,23,0.04))";
export const profileButtonBgVar = `var(--profile-button-background, ${PROFILE_GREEN})`;
export const profileButtonTextVar = "var(--profile-button-text, #ffffff)";

/**
 * Solid white surface for section titles + muted copy on patterned Restaurant Styles.
 * Prefer this over bare ink/muted text on `--profile-pattern`.
 */
export function profileReadableSurfaceStyle({
  marginBottom = 28,
  padding = "16px 16px",
} = {}) {
  return {
    marginBottom,
    padding,
    borderRadius: 16,
    background: "#fff",
    border: `1px solid ${profileCardBorderVar}`,
    boxShadow: profileCardShadowVar,
    minWidth: 0,
  };
}

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

/** Map DB restaurant_type enum → short public label. Empty if unknown. */
export function humanizeRestaurantType(raw) {
  const key = asStr(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!key) return "";
  const map = {
    full_service_restaurant: "Full-service restaurant",
    limited_service_restaurant: "Limited-service restaurant",
    quick_service: "Quick service",
    qsr: "Quick service",
    fast_casual: "Fast casual",
    cafe: "Café",
    coffee: "Coffee",
    bar: "Bar",
    pub: "Pub",
    food_truck: "Food truck",
    foodtruck: "Food truck",
    dining_hall: "Dining Hall",
    cafeteria: "Cafeteria",
    ghost_kitchen: "Ghost kitchen",
    bakery: "Bakery",
    catering: "Catering",
  };
  if (map[key]) return map[key];
  return key
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * When no operator-set featured dish exists, pick a real menu preview item.
 * Prefer entrees / signatures / appetizers — never invent names.
 */
export function pickFeaturedFromMenuItems(items) {
  const list = Array.isArray(items) ? items : [];
  const scored = [];
  for (const item of list) {
    const name = firstNonEmpty(item?.name);
    if (!name) continue;
    const section = firstNonEmpty(item?.section).toLowerCase();
    let score = 0;
    if (/signature|special|chef|popular|featured/.test(section)) score += 40;
    if (/entr[eé]e|main|burger|sandwich|bowl|plate/.test(section)) score += 30;
    if (/appetizer|starter|share/.test(section)) score += 20;
    if (/dessert|drink|beverage|beer|wine|cocktail|side/.test(section)) score -= 10;
    scored.push({
      score,
      name,
      description: firstNonEmpty(item?.description),
      price: firstNonEmpty(item?.display_price, item?.price),
      section: firstNonEmpty(item?.section),
    });
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best) return null;
  return {
    kind: "From the menu",
    name: best.name,
    description: best.description,
    price: best.price && best.price !== "0" && best.price !== "0.00" ? best.price : "",
    section: best.section,
  };
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
  // Guests may view menus — no auth gate. Upload/Add Menu is separate and requires sign-in.
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

/** Empty homepage slot — no per-field claim CTA (one banner on the page). */
export function ProfileSectionBlank({ testId, message }) {
  return (
    <div
      data-testid={testId || "profile-section-blank"}
      style={{
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px dashed ${profileCardBorderVar}`,
        background: "#fafaf9",
        fontSize: 13,
        color: PROFILE_MUTED,
        lineHeight: 1.45,
      }}
    >
      <span>{message}</span>
    </div>
  );
}

/** Single unclaimed-profile CTA — use once, prominently. */
export function ProfileClaimBanner({ claimHref = "/onboarding", claimState = null }) {
  return (
    <div
      data-testid="profile-claim-banner"
      data-profile-surface="card"
      style={{
        ...profileReadableSurfaceStyle({
          marginBottom: 20,
          padding: "14px 16px",
        }),
        borderRadius: 14,
        background: "#fffbeb",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 800, color: PROFILE_INK, letterSpacing: "-0.02em" }}>
        This profile is unclaimed.
      </div>
      <div style={{ marginTop: 4, fontSize: 13, color: PROFILE_MUTED, lineHeight: 1.45 }}>
        Owners can add Instagram, hours, photos, favorites, and updates.
      </div>
      <Link
        to={claimHref && claimHref !== "#claim-profile" ? claimHref : "/onboarding"}
        state={claimState || undefined}
        data-testid="profile-claim-banner-link"
        style={{
          display: "inline-block",
          marginTop: 10,
          fontSize: 14,
          fontWeight: 800,
          color: profileAccentVar,
          textDecoration: "none",
        }}
      >
        Claim this profile to complete it →
      </Link>
    </div>
  );
}

export { MENU_ROW_HEADER_ICON_GAP, MENU_ROW_ICON_SIZE };

export function ProfileSection({ title, children, empty = false, testId }) {
  if (children == null || children === false || children === "") return null;
  return (
    <section
      style={profileReadableSurfaceStyle({ marginBottom: 28, padding: "18px 18px" })}
      data-empty={empty ? "true" : undefined}
      data-testid={testId}
      data-profile-surface="card"
    >
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: profileSectionLabelVar,
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
      style={{ color: profileAccentVar, textDecoration: "none", fontWeight: 600 }}
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
  const locName = firstNonEmpty(
    profile?.current_location_name,
    profile?.current_location,
    profile?.current_pickup_label
  );
  const hasPostedLocation = Boolean(
    locName ||
      profile?.current_pickup_address ||
      profile?.current_address ||
      profile?.is_currently_serving === true
  );

  const normalized = normalizeDisplayAddress({
    address_line1: firstNonEmpty(
      profile?.current_address,
      profile?.current_pickup_address,
      streetAddr,
      profile?.address_line1,
      profile?.address
    ),
    city: firstNonEmpty(profile?.current_city, profile?.city),
    state: firstNonEmpty(profile?.current_state, profile?.state),
    postal_code: firstNonEmpty(profile?.postal_code, profile?.zip),
  });
  const street = normalized.streetAddr;
  const liveCityLine = normalized.cityLine || cityLine || "";

  const parts = [];
  if (locName) parts.push(locName);
  if (street && hasPostedLocation) parts.push(street);
  if (hasPostedLocation && liveCityLine && liveCityLine !== street && liveCityLine !== locName) {
    parts.push(liveCityLine);
  }

  const text = parts.join(" · ") || "";
  const mapsDest = hasPostedLocation
    ? formatAddressQuery({ streetAddr: street, cityLine: liveCityLine }) ||
      locName ||
      text
    : "";
  const directionsUrl = mapsDest ? buildGoogleMapsDirectionsUrl(mapsDest) : "";

  let statusLabel = "";
  if (profile?.is_currently_serving === true) statusLabel = "Located today";
  else if (hasPostedLocation) statusLabel = "Located today";
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

const FOOD_TRUCK_PLAN_CODES = new Set([
  "food_truck",
  "food_truck_monthly",
  "food_truck_annual",
  "foodtruck_verified_annual",
]);

/** Food truck via entity type OR subscription plan (no manual checkbox). */
export function isFoodTruckProfile(profile, profileType = null) {
  if (profileType === "food_truck") return true;
  const entity = String(
    profile?.restaurant_type || profile?.entity_type || profile?.category || ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (entity === "food_truck" || entity === "foodtruck") return true;
  const plan = String(
    profile?.subscription_plan ||
      profile?.subscription_plan_code ||
      profile?.plan_slug ||
      profile?.plan_code ||
      ""
  )
    .trim()
    .toLowerCase();
  return FOOD_TRUCK_PLAN_CODES.has(plan);
}

/** Campus Dining Hall — institutional, not restaurant-owned / not claimable. */
export function isDiningHallProfile(profile, profileType = null) {
  if (profileType === "dining_hall") return true;
  if (profile?.claimable === false && String(profile?.entity_type || "").toLowerCase() === "dining_hall") {
    return true;
  }
  const entity = String(
    profile?.restaurant_type || profile?.entity_type || profile?.category || ""
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return entity === "dining_hall" || entity === "dininghall";
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
    background: profileButtonBgVar,
    borderColor: profileButtonBgVar,
    color: profileButtonTextVar,
  };
}
