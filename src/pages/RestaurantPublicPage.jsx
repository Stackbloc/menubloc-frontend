/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/RestaurantPublicPage.jsx
 * File: RestaurantPublicPage.jsx
 * Date: 2026-03-10
 * Purpose:
 *   Menuply public restaurant profile page. React route:
 *     /restaurants/:slugOrId
 *
 *   Primary destination for:
 *     - Search result restaurant name clicks
 *     - QR code scan landings (/qr/:token → /restaurants/:slugOrId)
 *
 *   Behavior:
 *     - Claimed restaurants with an active billboard splash show the graphic
 *       briefly, then the normal public profile
 *     - Claimed restaurants without splash render the normal public profile
 *     - Unclaimed / seeded restaurants show a brief brand splash
 *       (active billboard graphic when present, else name +
 *       "Your Billboard Goes Here"), then the stub sales page
 *     - Food trucks (restaurant_type/category) redirect to /foodtrucks/:slug
 *       for the dedicated custom FoodTruckPage profile
 *
 *   Claimed restaurants: Option A editorial public profile (diner presentation).
 *   Unclaimed: existing Claim Screen (brand splash → FieldRow stub + Claim CTA).
 *   Menu preview: GET /public/restaurants/:id/menu-preview (scrollable name+price list).
 *
 *   Profile tier values coded against: "pro" | "verified"
 *   Data source: GET /public/restaurants/:slugOrId
 * ============================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import PublicProfileOwnerChrome from "../components/restaurant/PublicProfileOwnerChrome.jsx";
import RestaurantPublicEditorial from "../components/restaurant/RestaurantPublicEditorial.jsx";
import UnclaimedRestaurantBrandSplash, {
  UNCLAIMED_BRAND_SPLASH_MS,
} from "../components/restaurant/UnclaimedRestaurantBrandSplash.jsx";
import ClaimedRestaurantBillboardSplash, {
  pickClaimedBillboardSplashPost,
} from "../components/restaurant/ClaimedRestaurantBillboardSplash.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import { fetchRestaurantMenuPreview, toConsumerErrorMessage } from "../lib/api.js";
import { trackRestaurantView } from "../lib/analytics.js";
import { sendPageVisit } from "../lib/analyticsPageVisitSend.js";
import { getLocalizedField } from "../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../utils/getDisplayMenuItemName.js";
import RestaurantStatusLight from "../components/RestaurantStatusLight.jsx";
import { buildRestaurantStatusLightProps } from "../lib/restaurantStatusLight.js";
import ShareButton from "../components/share/ShareButton.jsx";
import { buildRestaurantShareData } from "../components/share/shareUtils.js";
import FollowRestaurantButton from "../components/FollowRestaurantButton.jsx";
import {
  MENU_ROW_HEADER_ICON_GAP,
  MENU_ROW_ICON_SIZE,
} from "../components/menu-templates/menuPresentationUtils.js";

const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

/** Public restaurant profile is always light — consumer-facing restaurant face. */
const PUBLIC_PROFILE_IS_DARK = false;

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}

/* ---- Helpers ---- */

function normalizeUrl(url) {
  const s = String(url || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function buildGoogleMapsDirectionsUrl(destination) {
  const s = String(destination || "").trim();
  if (!s) return "";
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s)}`;
}

function normalizeTier(profileTier, listingStatus) {
  for (const v of [profileTier, listingStatus]) {
    const s = String(v || "").toLowerCase();
    if (s.includes("pro") || s.includes("founder")) return "pro";
    if (s.includes("verified")) return "verified";
  }
  return "";
}

/** Resolve public profile visual tier from explicit tier or paid plan signals. */
function resolvePublicProfileTier(data) {
  const explicit = normalizeTier(data?.profile_tier, data?.listing_status);
  if (explicit) return explicit;
  if (data?.is_pro === true || data?.menu_presentation?.is_pro === true) return "pro";
  const plan = String(
    data?.menu_presentation?.plan_slug ||
      data?.plan_slug ||
      data?.subscription_plan ||
      data?.subscription_plan_code ||
      ""
  ).toLowerCase();
  if (
    plan.includes("founder") ||
    plan === "pro" ||
    plan === "enterprise" ||
    plan.startsWith("founders_")
  ) {
    return "pro";
  }
  if (plan.includes("verified") || plan.includes("starter")) return "verified";
  return "";
}

function normalizeClaimStatus(v) {
  return String(v || "").trim().toLowerCase();
}

function isClaimedRestaurant(data) {
  const status = normalizeClaimStatus(data?.claim_status);
  // Owner signup leaves claim_pending until formal claim completion — still owned, not an open claim stub.
  return status === "claimed" || status === "claim_pending";
}

function isFullClaimablePublicProfile(data) {
  const mode =
    data?.public_profile_mode ||
    data?.restaurant?.public_profile_mode ||
    "";
  return String(mode).trim().toLowerCase() === "full_claimable";
}

function buildClaimPrefillState(data, slugOrId) {
  const name =
    firstNonEmpty(data?.restaurant_name, data?.name) || `Restaurant ${slugOrId}`;
  const addressLine1 = firstNonEmpty(data?.address, data?.address_line1);
  const city = firstNonEmpty(data?.city);
  const stateVal = firstNonEmpty(data?.state, data?.region);
  const postalCode = firstNonEmpty(data?.zip, data?.postal_code, data?.postcode);
  const phone = firstNonEmpty(data?.phone, data?.phone_number, data?.contact_phone);
  const websiteRaw = firstNonEmpty(data?.website, data?.website_url);
  return {
    restaurant_name: name,
    address_line1: addressLine1,
    city,
    state: stateVal,
    postal_code: postalCode,
    phone,
    website_url: websiteRaw,
    category: humanizeLabel(firstNonEmpty(data?.category)),
    cuisine: humanizeLabel(firstNonEmpty(data?.cuisine)),
    claim_source: "public_restaurant_page",
    public_restaurant_slug_or_id: slugOrId,
    restaurant_id: data?.id || null,
  };
}

function firstNonEmpty(...values) {
  for (const v of values) {
    const s = String(v || "").trim();
    if (s) return s;
  }
  return "";
}

function humanizeLabel(value) {
  const s = String(value || "").trim();
  if (!s) return "";
  const normalized = s.toLowerCase().replace(/\s+/g, " ");
  const corrected = new Map([
    ["jamacian", "jamaican"],
  ]).get(normalized) || s;

  return corrected
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildRestaurantBaseHref(slugOrId) {
  return `/restaurants/${encodeURIComponent(String(slugOrId))}`;
}

function buildRestaurantBillboardHref(slugOrId) {
  return `${buildRestaurantBaseHref(slugOrId)}/billboard`;
}

function normalizeFoodTruckToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

/** Authoritative food-truck listing check (prefer type/category over name heuristics). */
function isFoodTruckListing(data) {
  const type = normalizeFoodTruckToken(data?.restaurant_type || data?.entity_type);
  if (type === "food_truck" || type === "foodtruck") return true;
  const category = normalizeFoodTruckToken(data?.category);
  if (category === "food_truck" || category === "foodtruck") return true;
  return false;
}

function detectFoodTruck(data) {
  if (isFoodTruckListing(data)) return true;
  const haystack = [
    data?.restaurant_name,
    data?.name,
    data?.category,
    data?.cuisine,
    data?.address,
    data?.address_line1,
  ]
    .map((v) => String(v || "").toLowerCase())
    .join(" ");

  return /\bfood truck\b|\btruck\b|\bmobile\b|\btrailer\b/.test(haystack);
}

function buildFoodTruckProfileHref(data, fallbackSlugOrId, location) {
  const target =
    String(data?.slug || data?.id || fallbackSlugOrId || "")
      .trim() || null;
  if (!target) return null;
  const search = location?.search || "";
  const hash = location?.hash || "";
  return `/foodtrucks/${encodeURIComponent(target)}${search}${hash}`;
}

function fieldHasValue(value) {
  if (value == null || value === false) return false;
  if (typeof value === "string" || typeof value === "number") {
    return Boolean(String(value).trim());
  }
  return true;
}

function FieldRow({ label, value, placeholder, isDark }) {
  const hasValue = fieldHasValue(value);

  return (
    <div
      style={{
        padding: "14px 0",
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid #eef2f7",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.7,
          textTransform: "uppercase",
          color: isDark ? "rgba(255,255,255,0.42)" : "#64748b",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: hasValue
            ? isDark
              ? "#e2e8f0"
              : "#0f172a"
            : isDark
            ? "rgba(255,255,255,0.55)"
            : "#64748b",
          fontStyle: hasValue ? "normal" : "italic",
        }}
      >
        {hasValue ? value : placeholder}
      </div>
    </div>
  );
}

/** Shared labeled profile fields — Claim Screen (unclaimed) stub only. */
function ProfileFieldList({
  isDark,
  isFoodTruck = false,
  name,
  addressValue,
  cityLine,
  websiteValue,
  cuisine,
  category,
  storyValue,
  featuredValue,
  landmarksValue,
  brandValue,
  verifiedEmpty = "—",
  proEmpty = "—",
}) {
  return (
    <>
      <FieldRow
        label={isFoodTruck ? "Food Truck Name" : "Restaurant Name"}
        value={name}
        placeholder=""
        isDark={isDark}
      />
      <FieldRow
        label={isFoodTruck ? "Primary Service Area" : "Address"}
        value={addressValue}
        placeholder={verifiedEmpty}
        isDark={isDark}
      />
      <FieldRow
        label="City / Region / Postal Code"
        value={cityLine}
        placeholder={verifiedEmpty}
        isDark={isDark}
      />
      <FieldRow label="Website" value={websiteValue} placeholder={verifiedEmpty} isDark={isDark} />
      <FieldRow label="Cuisine" value={cuisine} placeholder={verifiedEmpty} isDark={isDark} />
      <FieldRow
        label={isFoodTruck ? "Category / Format" : "Category"}
        value={category}
        placeholder={verifiedEmpty}
        isDark={isDark}
      />
      <FieldRow
        label={isFoodTruck ? "Truck Story / About" : "Story / About"}
        value={storyValue}
        placeholder={proEmpty}
        isDark={isDark}
      />
      <FieldRow
        label={isFoodTruck ? "Featured Menu Item" : "Featured Dish"}
        value={featuredValue}
        placeholder={proEmpty}
        isDark={isDark}
      />
      <FieldRow
        label={isFoodTruck ? "Regular Stops / Areas" : "Landmarks / Nearby"}
        value={landmarksValue}
        placeholder={proEmpty}
        isDark={isDark}
      />
      <FieldRow
        label="Brand Presentation"
        value={brandValue}
        placeholder={proEmpty}
        isDark={isDark}
      />
    </>
  );
}

function UnclaimedRestaurantPage({ data, isDark, slugOrId }) {
  const isFoodTruck = detectFoodTruck(data);
  const isMobile = useIsMobile();
  const [showBrandSplash, setShowBrandSplash] = useState(true);
  const billboardSplashPost = pickClaimedBillboardSplashPost(data?.billboard_preview);

  const name =
    firstNonEmpty(data?.restaurant_name, data?.name) || `Restaurant ${slugOrId}`;

  useEffect(() => {
    // Billboard splash owns its own image-load + hold timer.
    if (billboardSplashPost) return undefined;
    let delayMs = UNCLAIMED_BRAND_SPLASH_MS;
    try {
      if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        delayMs = 400;
      }
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setShowBrandSplash(false), delayMs);
    return () => window.clearTimeout(timer);
  }, [billboardSplashPost]);

  const addressLine1 = firstNonEmpty(data?.address, data?.address_line1);
  const city = firstNonEmpty(data?.city);
  const stateVal = firstNonEmpty(data?.state, data?.region);
  const postalCode = firstNonEmpty(data?.zip, data?.postal_code, data?.postcode);
  const phone = firstNonEmpty(data?.phone, data?.phone_number, data?.contact_phone);
  const websiteRaw = firstNonEmpty(data?.website, data?.website_url);
  const website = normalizeUrl(websiteRaw);
  const cuisine = humanizeLabel(firstNonEmpty(data?.cuisine));
  const category = humanizeLabel(firstNonEmpty(data?.category));
  const claimPrefillState = {
    restaurant_name: name,
    address_line1: addressLine1,
    city,
    state: stateVal,
    postal_code: postalCode,
    phone,
    website_url: websiteRaw || website,
    category,
    cuisine,
    claim_source: "public_restaurant_page",
    public_restaurant_slug_or_id: slugOrId,
    restaurant_id: data?.id || null,
  };

  const pageBg = isDark ? "#0b0b0f" : "#ffffff";
  const pageColor = isDark ? "#e2e8f0" : "#0f172a";
  const muted = isDark ? "rgba(255,255,255,0.55)" : "#64748b";
  const cardBg = isDark ? "#111218" : "#ffffff";
  const cardBorder = isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid #e4e9f0";
  const cardShadow = isDark ? "0 12px 40px rgba(0,0,0,0.34)" : "0 10px 30px rgba(15,23,42,0.07)";
  const heroBg = isDark ? "#10151d" : "#f8fbff";

  const verifiedMessage = isFoodTruck
    ? "Your information appears here with a free Verified subscription."
    : "Your information appears here with a free Verified subscription.";

  const proMessage = isFoodTruck
    ? "Your information appears here with Pro subscription."
    : "Your information appears here with Pro subscription.";

  const restaurantShareData = data?.id
    ? buildRestaurantShareData({
        restaurantName: name,
        restaurantSlug: data?.slug || slugOrId,
        restaurantId: data?.id,
        city,
        state: stateVal,
      })
    : null;
  const unclaimedStatusLightProps = buildRestaurantStatusLightProps(data);

  if (showBrandSplash) {
    // Active billboard creative replaces the generic "Your Billboard Goes Here" placeholder.
    if (billboardSplashPost) {
      return (
        <ClaimedRestaurantBillboardSplash
          restaurantName={name}
          post={billboardSplashPost}
          onDismiss={() => setShowBrandSplash(false)}
        />
      );
    }
    return <UnclaimedRestaurantBrandSplash name={name} isDark={isDark} />;
  }

  return (
    <>
    <StickyPageHeader />
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        color: pageColor,
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        padding: "20px 16px 64px",
      }}
    >

      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.7fr) minmax(280px, 1fr)",
          gap: 22,
        }}
      >
        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            border: cardBorder,
            boxShadow: cardShadow,
            background: cardBg,
          }}
        >
          <div
            style={{
              padding: isMobile ? "20px 16px 18px" : "24px 24px 22px",
              background: heroBg,
              borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e9eef5",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.9,
                textTransform: "uppercase",
                color: muted,
                marginBottom: 8,
              }}
            >
              {isFoodTruck ? "Unclaimed Food Truck Profile" : "Unclaimed Restaurant Profile"}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: isMobile ? 24 : 32,
                  lineHeight: 1.1,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: isDark ? "#f8fafc" : "#0f172a",
                }}
              >
                {name}
              </h1>

              <RestaurantStatusLight {...unclaimedStatusLightProps} size={7} />

              {data?.id || restaurantShareData ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: MENU_ROW_HEADER_ICON_GAP,
                    flexShrink: 0,
                  }}
                >
                  {data?.id ? (
                    <FollowRestaurantButton
                      restaurantId={data.id}
                      restaurantName={name}
                      source="restaurant_profile"
                      size={MENU_ROW_ICON_SIZE}
                    />
                  ) : null}
                  {restaurantShareData ? (
                    <ShareButton
                      variant="menu"
                      iconOnly
                      tone="ghost"
                      shareData={restaurantShareData}
                      analyticsContext={{
                        restaurantId: data?.id,
                        restaurantName: name,
                        restaurantSlug: data?.slug || slugOrId,
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            <p
              style={{
                margin: "12px 0 0",
                fontSize: 14,
                lineHeight: 1.65,
                color: muted,
                maxWidth: 680,
              }}
            >
              {isFoodTruck
                ? "This food truck does not yet have a completed Menuply public profile. Claim it to manage your listing and menu."
                : "This restaurant does not yet have a completed Menuply public profile. Claim it to manage your listing and menu."}
            </p>
          </div>

          <div style={{ padding: isMobile ? "8px 16px 24px" : "8px 24px 24px" }}>
            <ProfileFieldList
              isDark={isDark}
              isFoodTruck={isFoodTruck}
              name={name}
              addressValue={addressLine1}
              cityLine={[city, stateVal].filter(Boolean).join(", ") + (postalCode ? ` ${postalCode}` : "")}
              websiteValue={websiteRaw || website}
              cuisine={cuisine}
              category={category}
              storyValue=""
              featuredValue=""
              landmarksValue=""
              brandValue=""
              verifiedEmpty={verifiedMessage}
              proEmpty={proMessage}
            />
          </div>
        </div>

        <div
          id="claim-profile"
          style={{
            alignSelf: "start",
            borderRadius: 18,
            border: cardBorder,
            boxShadow: cardShadow,
            background: cardBg,
            padding: isMobile ? 16 : 24,
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: isDark ? "#f8fafc" : "#0f172a",
              marginBottom: 14,
            }}
          >
            Claim This Profile
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              color: muted,
              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            <p style={{ margin: 0 }}>
              {isFoodTruck
                ? "Claim this food truck profile on Menuply to manage your listing and menu."
                : "Claim this restaurant profile on Menuply to manage your listing and menu."}
            </p>

            <Link
              to="/onboarding"
              state={claimPrefillState}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 4,
                height: 44,
                padding: "0 18px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 800,
                background: "#111827",
                color: "#ffffff",
              }}
            >
              Claim this profile
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function Skel({ w = 160, h = 14, isDark }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: isDark ? "rgba(255,255,255,0.08)" : "#e9eef5",
        flexShrink: 0,
      }}
    />
  );
}

function applyPublicRestaurantPayload(json) {
  const restaurant = json?.restaurant || json || {};
  return {
    ...restaurant,
    menus: Array.isArray(json?.menus) ? json.menus : [],
    menu_presentation: json?.menu_presentation || null,
    // Intentionally do NOT merge top-level menu_items — use menu-preview endpoint.
    deal_items: Array.isArray(json?.deal_items) ? json.deal_items : [],
    billboard_preview: Array.isArray(restaurant?.billboard_preview)
      ? restaurant.billboard_preview
      : Array.isArray(json?.billboard_preview)
        ? json.billboard_preview
        : [],
    claim_status: json?.claim_status ?? restaurant?.claim_status ?? null,
    public_profile_mode:
      json?.public_profile_mode ?? restaurant?.public_profile_mode ?? "standard",
    public_ordering_mode:
      json?.public_ordering_mode ?? restaurant?.public_ordering_mode ?? "standard",
    subscription_plan:
      json?.subscription_plan ?? restaurant?.subscription_plan ?? null,
    plan_slug: json?.plan_slug ?? json?.menu_presentation?.plan_slug ?? null,
    is_pro: json?.is_pro === true || json?.menu_presentation?.is_pro === true,
    is_paid_subscriber:
      json?.is_paid_subscriber === true ||
      json?.menu_presentation?.is_paid_subscriber === true,
    order_acceptance_status:
      json?.order_acceptance_status ?? restaurant?.order_acceptance_status ?? null,
    menu_last_verified_at:
      json?.menu_last_verified_at ?? restaurant?.menu_last_verified_at ?? null,
    status_light_tone: json?.status_light_tone ?? json?.verification_badge_tone ?? null,
    verification_badge_tone: json?.verification_badge_tone ?? json?.status_light_tone ?? null,
    menu_status: json?.menu_status ?? null,
    display_cluster: json?.display_cluster ?? null,
    status_banners: Array.isArray(json?.status_banners)
      ? json.status_banners
      : Array.isArray(restaurant?.status_banners)
        ? restaurant.status_banners
        : [],
    status_event_presentations: Array.isArray(json?.status_event_presentations)
      ? json.status_event_presentations
      : Array.isArray(restaurant?.status_event_presentations)
        ? restaurant.status_event_presentations
        : [],
  };
}

export default function RestaurantPublicPage() {
  const { language } = useLanguage();
  const location = useLocation();
  const {
    isAuthenticated: isOperatorAuthenticated,
    restaurants: operatorRestaurants,
  } = useOperator();
  const { slugOrId, restaurantSlug: canonicalRestaurantSlug } = useParams();
  // canonicalRestaurantSlug is present on 3-segment canonical routes
  // (/restaurants/:state/:city/:restaurantSlug); slugOrId on legacy 1-segment routes.
  const trackedRestaurantViewRef = useRef(new Set());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [menuPreview, setMenuPreview] = useState(null);
  const [billboardSplashDone, setBillboardSplashDone] = useState(false);

  const isDark = PUBLIC_PROFILE_IS_DARK;
  const isMobile = useIsMobile();
  const resolvedSlug = canonicalRestaurantSlug || slugOrId;
  const dataUrl = useMemo(
    () => `${API}/public/restaurants/${encodeURIComponent(resolvedSlug)}`,
    [resolvedSlug]
  );

  const isOwner = Boolean(
    data?.id &&
      isOperatorAuthenticated &&
      Array.isArray(operatorRestaurants) &&
      operatorRestaurants.some((r) => String(r.id) === String(data.id))
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    setData(null);
    setMenuPreview(null);
    setBillboardSplashDone(false);

    fetch(dataUrl)
      .then((r) => r.json())
      .then((json) => {
        if (!alive) return;
        if (!json?.ok) throw new Error(json?.error || "Not found");
        setData(applyPublicRestaurantPayload(json));
      })
      .catch((e) => {
        if (alive) {
          setErr(
            toConsumerErrorMessage(
              e,
              "We couldn’t load this restaurant right now. Please try again in a moment."
            )
          );
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [dataUrl]);

  const claimedBillboardSplashPost = useMemo(() => {
    if (loading || err || !data) return null;
    if (isFoodTruckListing(data)) return null;
    // Ordinary unclaimed listings use UnclaimedRestaurantPage (its own splash).
    if (!isClaimedRestaurant(data) && !isOwner && !isFullClaimablePublicProfile(data)) return null;
    return pickClaimedBillboardSplashPost(data?.billboard_preview);
  }, [data, loading, err, isOwner]);

  // Billboard splash owns image-load + hold timing via onDismiss.
  useEffect(() => {
    const restaurantId = data?.id;
    if (!restaurantId || loading || err) return;
    if (!isClaimedRestaurant(data) && !isOwner && !isFullClaimablePublicProfile(data)) {
      setMenuPreview(null);
      return;
    }
    let alive = true;
    fetchRestaurantMenuPreview(restaurantId, { limit: 50 })
      .then((json) => {
        if (!alive) return;
        const items = Array.isArray(json?.preview_items)
          ? json.preview_items
          : Array.isArray(json?.items)
            ? json.items
            : [];
        if (!json?.ok || !items.length) {
          setMenuPreview(null);
          return;
        }
        setMenuPreview({
          menu_id: json.menu_id,
          menu_url: json.menu_url,
          items,
        });
      })
      .catch(() => {
        if (alive) setMenuPreview(null);
      });
    return () => {
      alive = false;
    };
  }, [data, loading, err, isOwner]);

  useEffect(() => {
    const restaurantId = String(data?.id || "").trim();
    if (!restaurantId || loading || err) return;
    if (trackedRestaurantViewRef.current.has(restaurantId)) return;
    trackedRestaurantViewRef.current.add(restaurantId);
    trackRestaurantView({
      restaurantId,
      restaurantName: data?.restaurant_name || data?.name || "",
      slug: data?.slug || resolvedSlug,
      source: "restaurant_profile",
    });
    sendPageVisit({
      path: window.location.pathname + window.location.search,
      restaurant_id: Number(data.id),
    });
  }, [data?.id, data?.restaurant_name, data?.name, data?.slug, resolvedSlug, loading, err]);

  // Food trucks always use the dedicated custom FoodTruckPage profile.
  if (!loading && !err && data && isFoodTruckListing(data)) {
    const foodTruckHref = buildFoodTruckProfileHref(data, resolvedSlug, location);
    if (foodTruckHref) {
      return <Navigate to={foodTruckHref} replace />;
    }
  }

  // Claim Screen path — leave UnclaimedRestaurantPage unchanged for ordinary unclaimed listings.
  // Real sales demos use full_claimable → editorial profile + menu + claim CTA.
  if (
    !loading &&
    !err &&
    data &&
    !isClaimedRestaurant(data) &&
    !isOwner &&
    !isFullClaimablePublicProfile(data)
  ) {
    return <UnclaimedRestaurantPage data={data} isDark={isDark} slugOrId={resolvedSlug} />;
  }

  const tier = resolvePublicProfileTier(data);
  const isPro = tier === "pro";
  const isVerified = tier === "verified";
  const restaurantStatusLightProps = buildRestaurantStatusLightProps(data);

  const name =
    getLocalizedField(data, "restaurant_name", language) ||
    getLocalizedField(data, "name", language) ||
    data?.restaurant_name ||
    data?.name ||
    `Restaurant ${resolvedSlug}`;
  const streetAddr = data?.address || data?.address_line1 || "";
  const city = data?.city || "";
  const stateVal = data?.state || data?.region || "";
  const zipVal = data?.zip || data?.postal_code || data?.postcode || "";
  const streetDirectionsUrl = buildGoogleMapsDirectionsUrl(
    [streetAddr, city, stateVal, zipVal].filter(Boolean).join(", ")
  );
  const cityLine = [city, stateVal].filter(Boolean).join(", ") + (zipVal ? ` ${zipVal}` : "");
  const websiteRaw = data?.website || data?.website_url || "";
  const website = normalizeUrl(websiteRaw);
  const phone = data?.phone || data?.phone_number || data?.contact_phone || "";
  const logoUrl = data?.logo_url || "";
  const cuisine = humanizeLabel(data?.cuisine || "");
  const category = humanizeLabel(data?.category || "");

  const restaurantShareData = data?.id
    ? buildRestaurantShareData({
        restaurantName: name,
        restaurantSlug: data?.slug || resolvedSlug,
        restaurantId: data?.id,
        city,
        state: stateVal,
        logoUrl,
      })
    : null;

  const aboutText =
    getLocalizedField(data, "about_us", language) ||
    data?.about_us ||
    getLocalizedField(data, "bio", language) ||
    data?.bio ||
    "";
  const landmarks = getLocalizedField(data, "landmarks", language) || data?.landmarks || "";
  const rawFeaturedItem = data?.featured_item || null;
  const featuredItem = rawFeaturedItem
    ? {
        ...rawFeaturedItem,
        name: getDisplayMenuItemName(rawFeaturedItem, language, rawFeaturedItem.name || ""),
      }
    : null;
  const featuredText = featuredItem
    ? [featuredItem.name, featuredItem.price].filter(Boolean).join(" · ")
    : "";
  const dealItems = Array.isArray(data?.deal_items) ? data.deal_items : [];
  const billboardPreview = Array.isArray(data?.billboard_preview) ? data.billboard_preview : [];
  const billboardHref = buildRestaurantBillboardHref(data?.slug || data?.id || resolvedSlug);
  const splashPost = claimedBillboardSplashPost;
  const bannerPhotoUrl =
    data?.hero_image_url ||
    data?.cover_image_url ||
    data?.banner_url ||
    billboardPreview.find((p) => p?.image_url || p?.photo_url)?.image_url ||
    billboardPreview.find((p) => p?.image_url || p?.photo_url)?.photo_url ||
    null;

  const pageBg = isDark ? "#0b0b0f" : "#ffffff";

  if (!loading && !err && data && splashPost && !billboardSplashDone) {
    return (
      <ClaimedRestaurantBillboardSplash
        restaurantName={name}
        post={splashPost}
        onDismiss={() => setBillboardSplashDone(true)}
      />
    );
  }

  return (
    <>
      <StickyPageHeader />
      {!loading && !err && data && isOwner ? <PublicProfileOwnerChrome /> : null}
      {loading ? (
        <div style={{ padding: "28px 16px", maxWidth: 860, margin: "0 auto", background: pageBg }}>
          <Skel w="100%" h={200} isDark={isDark} />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <Skel w={220} h={28} isDark={isDark} />
            <Skel w="75%" h={13} isDark={isDark} />
            <Skel w="55%" h={13} isDark={isDark} />
          </div>
        </div>
      ) : err ? (
        <div
          style={{
            margin: "24px auto",
            maxWidth: 640,
            padding: "12px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            background: "#fff5f5",
            border: "1px solid #fca5a5",
            color: "#b91c1c",
          }}
        >
          {err}
        </div>
      ) : data ? (
        <>
          {isFullClaimablePublicProfile(data) && !isClaimedRestaurant(data) && !isOwner ? (
            <div
              style={{
                maxWidth: 860,
                margin: "16px auto 0",
                padding: isMobile ? "14px 16px" : "16px 24px",
                borderRadius: 14,
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "#14532d", flex: "1 1 220px" }}>
                Your Menuply profile is already set up. You only need to claim it.
              </div>
              <Link
                to="/onboarding"
                state={buildClaimPrefillState(data, resolvedSlug)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontSize: 13,
                  fontWeight: 800,
                  background: "#111827",
                  color: "#ffffff",
                  whiteSpace: "nowrap",
                }}
              >
                Claim this profile
              </Link>
            </div>
          ) : null}
          <RestaurantPublicEditorial
          name={name}
          streetAddr={streetAddr}
          cityLine={cityLine}
          directionsUrl={streetDirectionsUrl}
          website={website}
          websiteRaw={websiteRaw}
          phone={phone}
          cuisine={cuisine}
          category={category}
          aboutText={aboutText}
          featuredText={featuredText}
          landmarks={landmarks}
          logoUrl={logoUrl}
          bannerPhotoUrl={bannerPhotoUrl}
          tierLabel={isPro ? "Pro" : isVerified ? "Verified" : ""}
          statusLightProps={restaurantStatusLightProps}
          restaurantId={data?.id || null}
          shareData={restaurantShareData}
          shareAnalytics={{
            restaurantId: data?.id,
            restaurantName: name,
            restaurantSlug: data?.slug || resolvedSlug,
          }}
          menuPreviewItems={menuPreview?.items || []}
          billboardPreview={billboardPreview}
          billboardHref={billboardHref}
          dealItems={dealItems}
          displayCluster={data?.display_cluster || null}
          statusBanners={data?.status_banners}
          statusEventPresentations={data?.status_event_presentations}
          isMobile={isMobile}
        />
        </>
      ) : null}
      <BottomNav />
    </>
  );
}
