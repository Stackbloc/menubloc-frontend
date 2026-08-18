import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import WaiterPublicActivity from "../components/WaiterPublicActivity.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { fetchWaiterBriefing } from "../lib/waiterApi.js";
import { WAITER_MEAL_PERIODS, getDefaultMealPeriod, normalizeMealPeriodId } from "../lib/waiterMealPeriod.js";
import { getTimezoneForUsState } from "../lib/timeZoneUtils.js";
import { readMenuBrowserVenueSession } from "../lib/menuBrowserVenueContext.js";
import { readDetectedLocation } from "../lib/discoveryLocationPersistence.js";

// ⚠️ WAITER PROTECTION GUARDRAIL (2026-07-02)
// This file is FROZEN. Do NOT add MarketFallback, CommunityGrowthCard, or
// remove the meal period selector without explicit user instruction.
// One card per recommendation category. See CLAUDE.md Waiter guardrail.
// 2026-08-15 Phase 6 (user-authorized): cluster subscription report is additive to core Waiter.
// 2026-08-15: core meal/location Waiter always runs with city+state; clusters never replace it.
// 2026-08-18 (user-authorized): public Activity ("What's happening") is additive on Waiter.
// Do not replace recommendation cards. Do not add MarketFallback, CommunityGrowthCard, or greetings.

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_AUTO_LABEL_KEY = "grubbid.discovery.auto_label";

function parseSessionLocation(raw) {
  const str = String(raw || "").trim();
  if (!str) return { city: "", state: "" };
  const comma = str.lastIndexOf(",");
  if (comma === -1) return { city: str, state: "" };
  return { city: str.slice(0, comma).trim(), state: str.slice(comma + 1).trim() };
}

function resolveWaiterMarketLabel() {
  if (typeof window === "undefined") return "";
  const sessionLabel =
    String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim() ||
    String(window.sessionStorage.getItem(SESSION_AUTO_LABEL_KEY) || "").trim();
  if (sessionLabel) return sessionLabel;
  const detected = readDetectedLocation(window.localStorage);
  if (detected?.city && detected?.state) {
    return String(detected.label || `${detected.city}, ${detected.state}`).trim();
  }
  return "";
}

// Meal-period picks first; cluster updates additive at the end (matches backend merge order).
const WAITER_GROUP_ORDER = [
  "what_people_are_eating",
  "liked_signal",
  "new_item",
  "trending_dish",
  "meal_recommendation",
  "active_deal",
  "new_restaurant",
  "cluster_report",
  "dining_hall_update",
  "dining_conditions",
];

function sortWaiterGroups(groups) {
  const rank = (type) => {
    const idx = WAITER_GROUP_ORDER.indexOf(type);
    return idx === -1 ? WAITER_GROUP_ORDER.length : idx;
  };
  return [...groups].sort((a, b) => rank(a.type) - rank(b.type));
}

// ONE group per type — enforces the one-card-per-category rule.
// Deduplicates items by title within each group (prevents duplicate franchise entries).
function groupByType(recommendations) {
  const order = [];
  const map = new Map();
  for (const rec of (recommendations || [])) {
    const key = rec.type || "other";
    if (!map.has(key)) {
      map.set(key, { type: key, label: rec.label, items: [] });
      order.push(key);
    }
    map.get(key).items.push(rec);
  }
  return order.map((key) => {
    const group = map.get(key);
    const seen = new Set();
    group.items = group.items.filter((item) => {
      const normalized = String(item.title || "").toLowerCase().trim();
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
    return group;
  }).filter((group) => group.items.length > 0);
}

const CARD_STYLE = {
  borderRadius: 16,
  padding: "14px 15px",
  border: "1px solid rgba(134,239,172,0.14)",
  background: "linear-gradient(180deg, rgba(17,24,20,0.92), rgba(11,15,12,0.92))",
};

const LABEL_STYLE = {
  fontSize: 15,
  fontWeight: 800,
  color: "#86EFAC",
  letterSpacing: "-0.01em",
  marginBottom: 10,
};

const ITEM_LINK_STYLE = {
  color: "#CBD5E1",
  textDecoration: "none",
  fontSize: 13,
  lineHeight: 1.45,
};

function capitalizeHeading(value) {
  const text = String(value || "").trim();
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function itemDetailLine(item) {
  // Backend cluster report already embeds cluster_name in detail when present.
  return String(item.detail || "").trim();
}

// Renders one card for an entire category (e.g. all "New for Dinner" items).
// Each item title is directly clickable — no separate "View dish →" link.
function CategoryCard({ group }) {
  return (
    <div style={CARD_STYLE}>
      {group.label ? <div style={LABEL_STYLE}>{capitalizeHeading(group.label)}</div> : null}
      <div style={{ display: "grid", gap: 10 }}>
        {group.items.map((item, index) => {
          const detail = itemDetailLine(item);
          return (
            <div key={item.link || item.title || index}>
              {item.link ? (
                <Link to={item.link} style={{ ...ITEM_LINK_STYLE, display: "block", fontWeight: 600, color: "#E5E7EB" }}>
                  {item.title}
                </Link>
              ) : (
                <span style={{ ...ITEM_LINK_STYLE, fontWeight: 600, color: "#E5E7EB" }}>{item.title}</span>
              )}
              {detail ? (
                <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.4, marginTop: 2 }}>{detail}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function FoodInterestsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();
  const [searchParams, setSearchParams] = useSearchParams();

  const [locationLabel] = useState(resolveWaiterMarketLabel);

  const location = parseSessionLocation(locationLabel);

  // Prefer current Place/cluster when known (query param, then Yellow Browser session).
  const clusterSlug =
    String(searchParams.get("cluster") || searchParams.get("cluster_slug") || "").trim() ||
    readMenuBrowserVenueSession() ||
    "";
  const clusterId = String(searchParams.get("cluster_id") || "").trim();

  const [mealPeriod, setMealPeriod] = useState(() => {
    const fromUrl = normalizeMealPeriodId(searchParams.get("meal_period"));
    if (fromUrl) return fromUrl;
    return getDefaultMealPeriod(new Date(), getTimezoneForUsState(location.state));
  });

  const canFetchBriefing = Boolean((location.city && location.state) || isAuthenticated);

  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(canFetchBriefing);

  useEffect(() => {
    if (!canFetchBriefing) {
      setBriefing(null);
      setBriefingLoading(false);
      return undefined;
    }
    let cancelled = false;
    setBriefingLoading(true);
    fetchWaiterBriefing(location.city, location.state, mealPeriod, {
      clusterId: clusterId || undefined,
      clusterSlug: clusterSlug || undefined,
    })
      .then((data) => { if (!cancelled) setBriefing(data?.ok ? data : null); })
      .catch(() => { if (!cancelled) setBriefing(null); })
      .finally(() => { if (!cancelled) setBriefingLoading(false); });
    return () => { cancelled = true; };
  }, [canFetchBriefing, location.city, location.state, mealPeriod, clusterId, clusterSlug]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (window.location.hash !== "#activity") return undefined;
    const el = document.getElementById("activity");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    return undefined;
  }, [briefingLoading]);

  function selectMealPeriod(id) {
    setMealPeriod(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("meal_period", id);
      return next;
    });
  }

  const subscriptionCount = Number(briefing?.cluster_report?.followed_total || 0);
  const clusterNames = (briefing?.cluster_report?.subscriptions || [])
    .map((c) => c?.name)
    .filter(Boolean)
    .slice(0, 3);
  const hasLocation = Boolean(location.city && location.state);
  const subheading = (() => {
    if (hasLocation && subscriptionCount > 0 && clusterNames.length) {
      const more = subscriptionCount > clusterNames.length ? ` +${subscriptionCount - clusterNames.length}` : "";
      return `Food picks for ${locationLabel}, plus updates from ${clusterNames.join(", ")}${more}.`;
    }
    if (hasLocation || locationLabel) return `Food picks for ${locationLabel || `${location.city}, ${location.state}`}.`;
    if (subscriptionCount > 0 && clusterNames.length) {
      const more = subscriptionCount > clusterNames.length ? ` +${subscriptionCount - clusterNames.length}` : "";
      return `Food updates from ${clusterNames.join(", ")}${more}.`;
    }
    return "Your local food market intelligence.";
  })();

  // Use recommendations from the briefing payload (never the legacy cards field).
  const groups = sortWaiterGroups(groupByType(briefing?.recommendations));
  const clusterNotice = briefing?.cluster_report?.notice || null;
  const emptyMessage = hasLocation
    ? "No recommendations available for your area right now. Check back soon."
    : clusterNotice ||
      "Set your location on the home screen or sign in to follow places for personalized updates.";

  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)", paddingBottom: "calc(var(--bottom-nav-h, 72px) + 28px)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 16px 0" }}>

        {/* Header */}
        <div style={{ borderRadius: 24, padding: "18px 18px 20px", background: "linear-gradient(135deg, rgba(20,31,22,0.98), rgba(13,19,16,0.94))", border: "1px solid rgba(34,197,94,0.16)", boxShadow: "0 24px 54px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 800, color: "#86EFAC", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <span>Waiter</span>
            <svg width="16" height="11" viewBox="6.5 12.5 11 7.5" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M11.58 16.34 7.4 13.68v5.32l4.18-2.66Z" />
              <path d="M12.42 16.34 16.6 13.68v5.32l-4.18-2.66Z" />
              <circle cx="12" cy="16.34" r="1" />
            </svg>
          </div>
          <h1 style={{ margin: "10px 0 0", fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Today&apos;s food highlights
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "#CBD5E1", lineHeight: 1.55 }}>{subheading}</p>
          {!isAuthenticated ? (
            <div style={{ marginTop: 16, borderRadius: 16, border: "1px solid rgba(34,197,94,0.18)", background: "rgba(34,197,94,0.08)", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#DCFCE7", lineHeight: 1.45 }}>Sign in to follow places and personalize your food updates.</div>
              <button type="button" onClick={() => navigate("/account/login")} style={{ border: "none", borderRadius: 999, background: "#22C55E", color: "#0B0F0C", fontSize: 12, fontWeight: 800, padding: "10px 12px", cursor: "pointer", whiteSpace: "nowrap" }}>Sign In</button>
            </div>
          ) : (
            <div style={{ marginTop: 12, fontSize: 12 }}>
              <Link to="/account/cluster-subscriptions" style={{ color: "#86EFAC", fontWeight: 700, textDecoration: "none" }}>
                Manage followed places
              </Link>
            </div>
          )}
        </div>

        {/* Meal period selector */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {WAITER_MEAL_PERIODS.map((period) => (
            <button
              key={period.id}
              type="button"
              onClick={() => selectMealPeriod(period.id)}
              style={{
                borderRadius: 999,
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: 700,
                border: mealPeriod === period.id ? "1px solid #22C55E" : "1px solid rgba(134,239,172,0.2)",
                background: mealPeriod === period.id ? "rgba(34,197,94,0.15)" : "transparent",
                color: mealPeriod === period.id ? "#22C55E" : "#9CA3AF",
                cursor: "pointer",
              }}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Recommendations */}
        <section style={{ marginTop: 14 }} aria-live="polite">
          {briefingLoading ? (
            <div style={{ fontSize: 14, color: "#9CA3AF", padding: "12px 0" }}>Loading recommendations…</div>
          ) : !canFetchBriefing ? (
            <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55, padding: "12px 0" }}>
              Set your location on the home screen or sign in to follow places for personalized updates.
            </div>
          ) : groups.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {groups.map((group) => (
                <CategoryCard key={group.type} group={group} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.55, padding: "12px 0" }}>
              {emptyMessage}
              {isAuthenticated && !hasLocation && subscriptionCount === 0 ? (
                <div style={{ marginTop: 8 }}>
                  <Link to="/clusters" style={{ color: "#86EFAC", fontWeight: 700, textDecoration: "none" }}>
                    Browse clusters to follow
                  </Link>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <WaiterPublicActivity />
      </div>
      <BottomNav />
    </div>
  );
}
