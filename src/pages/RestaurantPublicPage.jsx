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
 *   Claimed / unclaimed / full_claimable: shared editorial public profile (PublicProfileShell).
 *   Ordinary unclaimed: brief brand splash → real public profile + one Claim panel (not a claim form).
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
  pickClaimedBillboardSplashPosts,
} from "../components/restaurant/ClaimedRestaurantBillboardSplash.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import { fetchRestaurantMenuPreview, toConsumerErrorMessage } from "../lib/api.js";
import { trackRestaurantView } from "../lib/analytics.js";
import { sendPageVisit } from "../lib/analyticsPageVisitSend.js";
import { restaurantMenuPathFromRow } from "../lib/canonicalUrl.js";
import { getLocalizedField } from "../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../utils/getDisplayMenuItemName.js";
import { buildRestaurantStatusLightProps } from "../lib/restaurantStatusLight.js";
import { buildRestaurantShareData } from "../components/share/shareUtils.js";

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

function ClaimProfilePanel({ claimPrefillState, isMobile = false }) {
  return (
    <div
      id="claim-profile"
      data-testid="claim-profile-panel"
      style={{
        marginTop: 8,
        marginBottom: 8,
        padding: isMobile ? "10px 0" : "12px 0",
        borderTop: "1px solid #e7e5e4",
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ flex: "1 1 220px", fontSize: 13, lineHeight: 1.5, color: "#78716c" }}>
        <span style={{ fontWeight: 700, color: "#44403c" }}>Claim This Profile</span>
        {" — "}
        manage this listing and menu on Menuply.
      </div>
      <Link
        to="/onboarding"
        state={claimPrefillState}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 36,
          padding: "0 14px",
          borderRadius: 999,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 700,
          border: "1px solid #d6d3d1",
          background: "#fff",
          color: "#1c1917",
          whiteSpace: "nowrap",
        }}
      >
        Claim
      </Link>
    </div>
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
    menu_item_count: Array.isArray(json?.menu_items) ? json.menu_items.length : 0,
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
  const [unclaimedSplashDone, setUnclaimedSplashDone] = useState(false);

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
    setUnclaimedSplashDone(false);

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

  const claimedBillboardSplashPosts = useMemo(() => {
    if (loading || err || !data) return [];
    if (isFoodTruckListing(data)) return [];
    return pickClaimedBillboardSplashPosts(data?.billboard_preview);
  }, [data, loading, err]);

  const isOrdinaryUnclaimed =
    Boolean(data) &&
    !isClaimedRestaurant(data) &&
    !isOwner &&
    !isFullClaimablePublicProfile(data);

  // Brief brand splash for ordinary unclaimed when no billboard creative.
  useEffect(() => {
    if (loading || err || !data || !isOrdinaryUnclaimed) return undefined;
    if (claimedBillboardSplashPosts.length) return undefined;
    let delayMs = UNCLAIMED_BRAND_SPLASH_MS;
    try {
      if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        delayMs = 400;
      }
    } catch {
      /* ignore */
    }
    const timer = window.setTimeout(() => setUnclaimedSplashDone(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [loading, err, data, isOrdinaryUnclaimed, claimedBillboardSplashPosts.length]);

  // Menu preview for any public restaurant profile (claimed or unclaimed).
  useEffect(() => {
    const restaurantId = data?.id;
    if (!restaurantId || loading || err) return;
    if (isFoodTruckListing(data)) {
      setMenuPreview(null);
      return;
    }
    let alive = true;
    fetchRestaurantMenuPreview(restaurantId, { limit: 18 })
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
  }, [data, loading, err]);

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

  const menuHref =
    (typeof menuPreview?.menu_url === "string" && menuPreview.menu_url.trim()) ||
    restaurantMenuPathFromRow({
      slug: data?.slug || resolvedSlug,
      city,
      state: stateVal,
      id: data?.id,
    }) ||
    (data?.id ? `/public/restaurants/${data.id}/menu` : null);

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
  const splashPosts = claimedBillboardSplashPosts;
  // Phase 1.5: billboard image first, then cover/hero, then Menuply gradient (never fake food).
  const firstBillboardImage =
    billboardPreview.find((p) => p?.image_url || p?.photo_url)?.image_url ||
    billboardPreview.find((p) => p?.image_url || p?.photo_url)?.photo_url ||
    null;
  const bannerPhotoUrl =
    firstBillboardImage ||
    data?.hero_image_url ||
    data?.cover_image_url ||
    data?.banner_url ||
    null;

  const pageBg = isDark ? "#0b0b0f" : "#ffffff";
  const operatingHours = Array.isArray(data?.operating_hours) ? data.operating_hours : [];
  const showClaimPanel =
    Boolean(data) &&
    !isClaimedRestaurant(data) &&
    !isOwner &&
    (isOrdinaryUnclaimed || isFullClaimablePublicProfile(data));
  const claimPrefillState = data ? buildClaimPrefillState(data, resolvedSlug) : null;

  if (!loading && !err && data && splashPosts.length && !billboardSplashDone) {
    return (
      <ClaimedRestaurantBillboardSplash
        restaurantName={name}
        posts={splashPosts}
        onDismiss={() => {
          setBillboardSplashDone(true);
          setUnclaimedSplashDone(true);
        }}
      />
    );
  }

  if (
    !loading &&
    !err &&
    data &&
    isOrdinaryUnclaimed &&
    !splashPosts.length &&
    !unclaimedSplashDone
  ) {
    return <UnclaimedRestaurantBrandSplash name={name} isDark={isDark} />;
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
          featuredItem={featuredItem}
          landmarks={landmarks}
          logoUrl={logoUrl}
          bannerPhotoUrl={bannerPhotoUrl}
          tierLabel={isPro ? "Pro" : isVerified ? "Verified" : ""}
          statusLightProps={restaurantStatusLightProps}
          restaurantId={data?.id || null}
          menuHref={menuHref}
          shareData={restaurantShareData}
          shareAnalytics={{
            restaurantId: data?.id,
            restaurantName: name,
            restaurantSlug: data?.slug || resolvedSlug,
          }}
          menuPreviewItems={menuPreview?.items || []}
          menuItemCount={data?.menu_item_count || 0}
          menuCount={Array.isArray(data?.menus) ? data.menus.length : 0}
          billboardPreview={billboardPreview}
          billboardHref={billboardHref}
          dealItems={dealItems}
          displayCluster={data?.display_cluster || null}
          statusBanners={data?.status_banners}
          statusEventPresentations={data?.status_event_presentations}
          operatingHours={operatingHours}
          profile={data}
          claimPanel={
            showClaimPanel ? (
              <ClaimProfilePanel claimPrefillState={claimPrefillState} isMobile={isMobile} />
            ) : null
          }
          isMobile={isMobile}
        />
      ) : null}
      <BottomNav />
    </>
  );
}
