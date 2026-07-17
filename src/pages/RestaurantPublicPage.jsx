/**
 * ============================================================
 * Path: menubloc-frontend/src/pages/RestaurantPublicPage.jsx
 * File: RestaurantPublicPage.jsx
 * Date: 2026-07-17
 * Purpose:
 *   Menuply public restaurant profile page. React route:
 *     /restaurants/:slugOrId
 *     /restaurants/:state/:city/:restaurantSlug
 *
 *   Consumer editorial profile (not a claim form).
 *   Full menu is NOT shown here — View Menu → PublicMenuPage.
 *   Menu panel is a highlight / partial preview only (no basket, no Waiter).
 *
 *   Data: GET /public/restaurants/:slugOrId
 *   Menu highlights: GET /public/restaurants/:id/menu-preview
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import StickyPageHeader from "../components/StickyPageHeader.jsx";
import BottomNav from "../components/BottomNav.jsx";
import RestaurantBillboardStrip from "../components/RestaurantBillboardStrip.jsx";
import PublicProfileOwnerChrome from "../components/restaurant/PublicProfileOwnerChrome.jsx";
import RestaurantStatusBannerStrip from "../components/restaurant/RestaurantStatusBannerStrip.jsx";
import RestaurantProfileHero from "../components/restaurant/RestaurantProfileHero.jsx";
import RestaurantProfileMenuPreview from "../components/restaurant/RestaurantProfileMenuPreview.jsx";
import UnclaimedRestaurantBrandSplash, {
  UNCLAIMED_BRAND_SPLASH_MS,
} from "../components/restaurant/UnclaimedRestaurantBrandSplash.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import { fetchRestaurantMenuPreview, toConsumerErrorMessage } from "../lib/api.js";
import { trackRestaurantView } from "../lib/analytics.js";
import { sendPageVisit } from "../lib/analyticsPageVisitSend.js";
import { getLocalizedField } from "../utils/getLocalizedField.js";
import { getDisplayMenuItemName } from "../utils/getDisplayMenuItemName.js";
import { restaurantMenuPath } from "../lib/canonicalUrl.js";
import { buildRestaurantStatusLightProps } from "../lib/restaurantStatusLight.js";
import { buildRestaurantShareData } from "../components/share/shareUtils.js";
import { clusterTypeLabel } from "../lib/clusterUrl.js";

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
  // Follow-up: claim-pending rendering and owner authority require a separate authorization audit.
  return status === "claimed" || status === "claim_pending";
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
  const corrected = new Map([["jamacian", "jamaican"]]).get(normalized) || s;
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

function detectFoodTruck(data) {
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

function getTierTheme(tier) {
  if (tier === "pro") {
    return {
      accentBarColor: "#1a4f95",
      badgeColor: "#1e40af",
      metaColor: "#3b5ea6",
      sectionColor: "#1e40af",
      nameColor: "#0f172a",
      viewMenuBg: "#1d4ed8",
      viewMenuColor: "#ffffff",
      viewMenuBorder: "none",
      dealDot: "#1d4ed8",
    };
  }
  if (tier === "verified") {
    return {
      accentBarColor: "#0f766e",
      badgeColor: "#0f766e",
      metaColor: "#64748b",
      sectionColor: "#0f766e",
      nameColor: "#0f172a",
      viewMenuBg: "#0f766e",
      viewMenuColor: "#ffffff",
      viewMenuBorder: "none",
      dealDot: "#0f766e",
    };
  }
  return {
    accentBarColor: "#64748b",
    badgeColor: "#475569",
    metaColor: "#64748b",
    sectionColor: "#334155",
    nameColor: "#0f172a",
    viewMenuBg: "#1d4ed8",
    viewMenuColor: "#ffffff",
    viewMenuBorder: "none",
    dealDot: "#64748b",
  };
}

/**
 * Merge public profile JSON into page state.
 *
 * Intentionally does NOT copy top-level `menu_items` into state.
 * Root cause of prior drop: spread used `json.restaurant` only, so sibling
 * `menu_items` / `deal_items` were ignored — but those arrays can include
 * descriptions/badges and are not a safe profile-state model for preview.
 * Menu highlights load via GET …/menu-preview instead (partial, no enrichment).
 */
function applyPublicRestaurantPayload(json) {
  const restaurant = json?.restaurant || json || {};
  return {
    ...restaurant,
    menus: Array.isArray(json?.menus) ? json.menus : [],
    menu_presentation: json?.menu_presentation || null,
    default_menu_id: json?.default_menu_id ?? null,
    claim_status: json?.claim_status ?? restaurant?.claim_status ?? null,
    subscription_plan: json?.subscription_plan ?? restaurant?.subscription_plan ?? null,
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
    deal_items: Array.isArray(json?.deal_items) ? json.deal_items : [],
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

function SectionLabel({ children, color }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.9,
        textTransform: "uppercase",
        color: color || "#64748b",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function ProfileContentSection({ title, children }) {
  if (!children) return null;
  return (
    <section style={{ marginBottom: 22 }}>
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 0.4,
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.65, color: "#0f172a" }}>{children}</div>
    </section>
  );
}

function ClaimProfileCard({ isFoodTruck, claimPrefillState }) {
  return (
    <aside
      id="claim-profile"
      style={{
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        padding: 18,
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",
          fontSize: 16,
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        Own this restaurant?
      </h2>
      <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.6, color: "#475569" }}>
        {isFoodTruck
          ? "Claim this profile to manage your food truck information, menu, photos, announcements, and available Menuply features."
          : "Claim this profile to manage your restaurant information, menu, photos, announcements, and available Menuply features."}
      </p>
      <Link
        to="/onboarding"
        state={claimPrefillState}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 42,
          padding: "0 16px",
          borderRadius: 10,
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 800,
          background: "#111827",
          color: "#ffffff",
        }}
      >
        Claim This Profile
      </Link>
    </aside>
  );
}

function Skel({ w = 160, h = 14 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 6,
        background: "#e9eef5",
        flexShrink: 0,
      }}
    />
  );
}

function ActionLink({ to, href, children, primary = false }) {
  const style = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    padding: "0 16px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 700,
    background: primary ? "#1d4ed8" : "#ffffff",
    color: primary ? "#ffffff" : "#0f172a",
    border: primary ? "none" : "1px solid #cbd5e1",
  };
  if (to) {
    return (
      <Link to={to} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" style={style}>
      {children}
    </a>
  );
}

function ConsumerProfileBody({
  data,
  isDark,
  slugOrId,
  showClaimCard,
  menuPreview,
  locationSearch,
  translateUi,
}) {
  const isMobile = useIsMobile();
  const isFoodTruck = detectFoodTruck(data);
  const tier = resolvePublicProfileTier(data);
  const t = getTierTheme(tier);
  const isPro = tier === "pro";
  const isVerified = tier === "verified";
  const statusLightProps = buildRestaurantStatusLightProps(data);

  const name =
    firstNonEmpty(data?.restaurant_name, data?.name) || `Restaurant ${slugOrId}`;
  const streetAddr = firstNonEmpty(data?.address, data?.address_line1);
  const city = firstNonEmpty(data?.city);
  const stateVal = firstNonEmpty(data?.state, data?.region);
  const zipVal = firstNonEmpty(data?.zip, data?.postal_code, data?.postcode);
  const cityLine = [city, stateVal].filter(Boolean).join(", ") + (zipVal ? ` ${zipVal}` : "");
  const locationLine = firstNonEmpty(streetAddr, cityLine);
  const directionsUrl = buildGoogleMapsDirectionsUrl(
    [streetAddr, city, stateVal, zipVal].filter(Boolean).join(", ")
  );
  const websiteRaw = firstNonEmpty(data?.website, data?.website_url);
  const website = normalizeUrl(websiteRaw);
  const logoUrl = firstNonEmpty(data?.logo_url);
  const cuisine = humanizeLabel(firstNonEmpty(data?.cuisine));
  const category = humanizeLabel(firstNonEmpty(data?.category));
  const bio = firstNonEmpty(data?.bio);
  const landmarks = firstNonEmpty(data?.landmarks);
  const rawFeaturedItem = data?.featured_item || null;
  const featuredItem = rawFeaturedItem
    ? {
        name: getDisplayMenuItemName(rawFeaturedItem, "en", rawFeaturedItem.name || ""),
        price: rawFeaturedItem.price || "",
      }
    : null;
  const featuredFieldValue = featuredItem
    ? [featuredItem.name, featuredItem.price].filter(Boolean).join(" · ")
    : "";
  const dealItems = Array.isArray(data?.deal_items) ? data.deal_items : [];
  const billboardPreview = Array.isArray(data?.billboard_preview) ? data.billboard_preview : [];
  const billboardHref = buildRestaurantBillboardHref(data?.slug || data?.id || slugOrId);
  const bannerPhotoUrl =
    firstNonEmpty(
      data?.hero_image_url,
      data?.cover_image_url,
      data?.banner_url,
      billboardPreview.find((p) => p?.image_url || p?.photo_url)?.image_url,
      billboardPreview.find((p) => p?.image_url || p?.photo_url)?.photo_url
    ) || null;

  const hasStatusNotes =
    (Array.isArray(data?.status_banners) && data.status_banners.length > 0) ||
    (Array.isArray(data?.status_event_presentations) &&
      data.status_event_presentations.length > 0);

  const menuHref =
    (data?.id &&
      (restaurantMenuPath({
        slug: data.slug,
        city: data.city,
        state: data.state,
        id: data.id,
      }) ||
        `/restaurants/${encodeURIComponent(String(data.slug || data.id))}/menu`)) ||
    menuPreview?.menu_url ||
    null;

  const restaurantShareData = data?.id
    ? buildRestaurantShareData({
        restaurantName: name,
        restaurantSlug: data?.slug || slugOrId,
        restaurantId: data?.id,
        city,
        state: stateVal,
        logoUrl,
      })
    : null;

  const phone = firstNonEmpty(data?.phone, data?.phone_number, data?.contact_phone);
  const claimPrefillState = {
    restaurant_name: name,
    address_line1: streetAddr,
    city,
    state: stateVal,
    postal_code: zipVal,
    phone,
    website_url: websiteRaw || website,
    category,
    cuisine,
    claim_source: "public_restaurant_page",
    public_restaurant_slug_or_id: slugOrId,
    restaurant_id: data?.id || null,
  };

  const primaryActions = (
    <>
      {menuHref ? (
        <ActionLink
          primary
          to={{ pathname: menuHref, search: locationSearch || "" }}
        >
          {translateUi("common.viewMenu")}
        </ActionLink>
      ) : null}
      {directionsUrl ? <ActionLink href={directionsUrl}>Directions</ActionLink> : null}
    </>
  );

  const pageBg = isDark ? "#0b0b0f" : "#ffffff";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: pageBg,
        color: "#0f172a",
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        padding: "20px 16px 88px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <RestaurantProfileHero
          name={name}
          locationLine={locationLine}
          cuisine={cuisine}
          category={category}
          logoUrl={logoUrl}
          bannerPhotoUrl={bannerPhotoUrl}
          tierLabel={isPro ? "◆ Pro" : isVerified ? "✓ Verified" : ""}
          tierBadgeColor={t.badgeColor}
          accentBarColor={t.accentBarColor}
          metaColor={t.metaColor}
          nameColor={t.nameColor}
          isMobile={isMobile}
          restaurantId={data?.id || null}
          statusLightProps={statusLightProps}
          shareData={restaurantShareData}
          shareAnalytics={{
            restaurantId: data?.id,
            restaurantName: name,
            restaurantSlug: data?.slug || slugOrId,
          }}
          primaryActions={primaryActions}
        />

        <div
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : menuPreview?.items?.length
                ? "minmax(0, 1.55fr) minmax(260px, 0.9fr)"
                : "1fr",
            gap: 22,
            alignItems: "start",
          }}
        >
          <div>
            <ProfileContentSection title={isFoodTruck ? "Primary service area" : "Address"}>
              {streetAddr ? (
                directionsUrl ? (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Get directions to ${name}`}
                    style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}
                  >
                    {streetAddr}
                    {cityLine ? (
                      <span style={{ display: "block", marginTop: 4, color: "#475569" }}>{cityLine}</span>
                    ) : null}
                  </a>
                ) : (
                  <>
                    {streetAddr}
                    {cityLine ? (
                      <span style={{ display: "block", marginTop: 4, color: "#475569" }}>{cityLine}</span>
                    ) : null}
                  </>
                )
              ) : cityLine || null}
            </ProfileContentSection>

            <ProfileContentSection title="Website">
              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}
                >
                  {websiteRaw || website} ↗
                </a>
              ) : null}
            </ProfileContentSection>

            <ProfileContentSection title="Cuisine">{cuisine || null}</ProfileContentSection>
            <ProfileContentSection title={isFoodTruck ? "Category / format" : "Category"}>
              {category || null}
            </ProfileContentSection>
            <ProfileContentSection title={isFoodTruck ? "Truck story" : "About"}>
              {bio || null}
            </ProfileContentSection>
            <ProfileContentSection title="Featured dish">
              {featuredFieldValue || null}
            </ProfileContentSection>
            <ProfileContentSection title={isFoodTruck ? "Regular stops" : "Nearby"}>
              {landmarks || null}
            </ProfileContentSection>

            {data?.display_cluster?.name && data?.display_cluster?.public_url ? (
              <ProfileContentSection title="Cluster">
                <Link
                  to={data.display_cluster.public_url}
                  style={{ color: "#1d4ed8", textDecoration: "none", fontWeight: 600 }}
                >
                  {data.display_cluster.name}
                  {data.display_cluster.cluster_type
                    ? ` · ${clusterTypeLabel(data.display_cluster.cluster_type)}`
                    : ""}
                </Link>
              </ProfileContentSection>
            ) : null}

            {billboardPreview.length ? (
              <section style={{ marginBottom: 22 }}>
                <SectionLabel color={t.sectionColor}>Billboard</SectionLabel>
                <RestaurantBillboardStrip
                  posts={billboardPreview}
                  isDark={false}
                  isMobile={isMobile}
                  muted="#64748b"
                />
                <div style={{ marginTop: 12 }}>
                  <ActionLink to={billboardHref}>View Full Billboard</ActionLink>
                </div>
              </section>
            ) : null}

            {dealItems.length ? (
              <section style={{ marginBottom: 22 }}>
                <SectionLabel color={t.sectionColor}>Active deals</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {dealItems.map((deal, idx) => (
                    <div key={deal.id ?? `deal-${idx}`} style={{ display: "flex", gap: 10 }}>
                      <span
                        aria-hidden="true"
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: t.dealDot,
                          marginTop: 7,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                          {deal.name}
                          {deal.price ? (
                            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "#64748b" }}>
                              {deal.price}
                            </span>
                          ) : null}
                        </div>
                        {deal.description ? (
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{deal.description}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {hasStatusNotes ? (
              <section style={{ marginBottom: 22 }}>
                <SectionLabel color="#64748b">Announcements</SectionLabel>
                <RestaurantStatusBannerStrip
                  variant="aside"
                  statusBanners={data.status_banners}
                  statusEventPresentations={data.status_event_presentations}
                />
              </section>
            ) : null}

            {showClaimCard ? (
              <div style={{ marginTop: 8 }}>
                <ClaimProfileCard isFoodTruck={isFoodTruck} claimPrefillState={claimPrefillState} />
              </div>
            ) : null}
          </div>

          {menuPreview?.items?.length && menuHref ? (
            <RestaurantProfileMenuPreview
              items={menuPreview.items}
              menuHref={menuHref}
              search={locationSearch || ""}
              viewMenuLabel={translateUi("common.viewMenu")}
              isMobile={isMobile}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function UnclaimedRestaurantPage({ data, isDark, slugOrId, menuPreview, locationSearch, translateUi }) {
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
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
  }, []);

  if (showBrandSplash) {
    const name = firstNonEmpty(data?.restaurant_name, data?.name) || `Restaurant ${slugOrId}`;
    return <UnclaimedRestaurantBrandSplash name={name} isDark={isDark} />;
  }

  return (
    <>
      <StickyPageHeader />
      <ConsumerProfileBody
        data={data}
        isDark={isDark}
        slugOrId={slugOrId}
        showClaimCard
        menuPreview={menuPreview}
        locationSearch={locationSearch}
        translateUi={translateUi}
      />
    </>
  );
}

export default function RestaurantPublicPage() {
  const { language, t: translateUi } = useLanguage();
  const {
    isAuthenticated: isOperatorAuthenticated,
    restaurants: operatorRestaurants,
  } = useOperator();
  const location = useLocation();
  const { slugOrId, restaurantSlug: canonicalRestaurantSlug } = useParams();
  // canonicalRestaurantSlug is present on 3-segment canonical routes
  // (/restaurants/:state/:city/:restaurantSlug); slugOrId on legacy 1-segment routes
  const trackedRestaurantViewRef = useRef(new Set());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [menuPreview, setMenuPreview] = useState(null);

  const isDark = PUBLIC_PROFILE_IS_DARK;
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

  const reloadPublicData = useCallback(async () => {
    const res = await fetch(dataUrl);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || "Could not reload public profile.");
    }
    setData(applyPublicRestaurantPayload(json));
  }, [dataUrl]);
  void reloadPublicData;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    setData(null);
    setMenuPreview(null);

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

  useEffect(() => {
    const restaurantId = data?.id;
    if (!restaurantId || loading || err) return;
    let alive = true;
    fetchRestaurantMenuPreview(restaurantId, { limit: 8 })
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
  }, [data?.id, loading, err]);

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

  const localizedData = useMemo(() => {
    if (!data) return null;
    const localizedName =
      getLocalizedField(data, "restaurant_name", language) ||
      getLocalizedField(data, "name", language) ||
      data.restaurant_name ||
      data.name;
    const localizedBio = getLocalizedField(data, "bio", language) || data.bio;
    const localizedLandmarks =
      getLocalizedField(data, "landmarks", language) || data.landmarks;
    return {
      ...data,
      restaurant_name: localizedName || data.restaurant_name,
      bio: localizedBio,
      landmarks: localizedLandmarks,
    };
  }, [data, language]);

  if (!loading && !err && localizedData && !isClaimedRestaurant(localizedData) && !isOwner) {
    return (
      <UnclaimedRestaurantPage
        data={localizedData}
        isDark={isDark}
        slugOrId={resolvedSlug}
        menuPreview={menuPreview}
        locationSearch={location.search}
        translateUi={translateUi}
      />
    );
  }

  return (
    <>
      <StickyPageHeader />
      {!loading && !err && localizedData && isOwner ? <PublicProfileOwnerChrome /> : null}
      {loading ? (
        <div style={{ padding: "28px 16px", maxWidth: 860, margin: "0 auto" }}>
          <Skel w="100%" h={160} />
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <Skel w={220} h={28} />
            <Skel w="75%" h={13} />
            <Skel w="55%" h={13} />
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
      ) : localizedData ? (
        <ConsumerProfileBody
          data={localizedData}
          isDark={isDark}
          slugOrId={resolvedSlug}
          showClaimCard={false}
          menuPreview={menuPreview}
          locationSearch={location.search}
          translateUi={translateUi}
        />
      ) : null}
      <BottomNav />
    </>
  );
}
