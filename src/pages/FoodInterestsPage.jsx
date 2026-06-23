import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { fetchWaiterBriefing } from "../lib/waiterApi.js";
import { getDefaultMealPeriod, getMealPeriodFallback, getWaiterGreeting, WAITER_MEAL_PERIODS } from "../lib/waiterMealPeriod.js";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_AUTO_LABEL_KEY = "grubbid.discovery.auto_label";

function parseSessionLocation(raw) {
  const str = String(raw || "").trim();
  if (!str) return { city: "", state: "" };
  const comma = str.lastIndexOf(",");
  if (comma === -1) return { city: str, state: "" };
  return { city: str.slice(0, comma).trim(), state: str.slice(comma + 1).trim() };
}

function MarketFallback({ marketLabel, mealPeriod }) {
  const guidance = getMealPeriodFallback(mealPeriod);
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ borderRadius: 16, padding: "15px", border: "1px solid rgba(134,239,172,0.14)", background: "linear-gradient(180deg, rgba(17,24,20,0.92), rgba(11,15,12,0.92))" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#F9FAFB" }}>We're actively expanding Menuply's menu coverage across {marketLabel}.</div>
        <div style={{ marginTop: 6, fontSize: 13, color: "#9CA3AF", lineHeight: 1.55 }}>New restaurants and menu items are added regularly as we continue building local food intelligence.</div>
        <div style={{ marginTop: 16, fontSize: 15, fontWeight: 800, color: "#F9FAFB" }}>{guidance.title}</div>
        {guidance.paragraphs.map((paragraph) => (
          <div key={paragraph} style={{ marginTop: 6, fontSize: 13, color: "#CBD5E1", lineHeight: 1.55 }}>{paragraph}</div>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 15 }}>
          <Link to="/deals" style={{ fontSize: 12, fontWeight: 800, color: "#86EFAC", textDecoration: "none", borderBottom: "1px solid rgba(134,239,172,0.28)", paddingBottom: 1 }}>View active deals →</Link>
          <Link to="/search" style={{ fontSize: 12, fontWeight: 800, color: "#86EFAC", textDecoration: "none", borderBottom: "1px solid rgba(134,239,172,0.28)", paddingBottom: 1 }}>Search nearby food →</Link>
        </div>
      </div>
    </div>
  );
}

function CommunityGrowthCard({ marketLabel }) {
  return (
    <div style={{ borderRadius: 14, padding: "13px 14px", border: "1px solid rgba(107,114,128,0.22)", background: "rgba(17,24,20,0.5)" }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#D1D5DB" }}>Help Menuply Grow</div>
      <div style={{ marginTop: 5, fontSize: 12, color: "#9CA3AF", lineHeight: 1.55 }}>We're actively collecting restaurant menus throughout {marketLabel}.</div>
      <div style={{ marginTop: 5, fontSize: 12, color: "#9CA3AF", lineHeight: 1.55 }}>If your favorite restaurant is missing, use the camera scanner on the home page to submit a menu.</div>
      <div style={{ marginTop: 5, fontSize: 12, color: "#9CA3AF", lineHeight: 1.55 }}>Every menu submission helps improve food discovery and recommendations.</div>
    </div>
  );
}

function verifiedCount(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function normalizeRecommendationKey(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['']/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(xs|extra small|small|medium|large|xl|xxl|mini|regular|kids?|junior|jr|side)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueRecommendations(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = [
      row?.restaurant_id ?? row?.restaurant_name ?? "",
      row?.menu_item_id ?? "",
      normalizeRecommendationKey(row?.title || row?.name || ""),
      normalizeRecommendationKey(row?.detail || ""),
    ].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function RecommendationCard({ recommendation }) {
  return (
    <div style={{ borderRadius: 16, padding: "14px 15px", border: "1px solid rgba(134,239,172,0.14)", background: "linear-gradient(180deg, rgba(17,24,20,0.92), rgba(11,15,12,0.92))" }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#86EFAC", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
        {recommendation.label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#F9FAFB" }}>{recommendation.title}</div>
      {recommendation.detail ? <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5, marginTop: 4 }}>{recommendation.detail}</div> : null}
      {recommendation.link ? (
        <Link to={recommendation.link} style={{ display: "inline-block", marginTop: 10, fontSize: 12, fontWeight: 800, color: "#86EFAC", textDecoration: "none", borderBottom: "1px solid rgba(134,239,172,0.28)", paddingBottom: 1 }}>
          {recommendation.link_label || "View Dish"}
        </Link>
      ) : null}
    </div>
  );
}

export default function FoodInterestsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useConsumer();
  const now = useMemo(() => new Date(), []);
  const [mealPeriod, setMealPeriod] = useState(() => getDefaultMealPeriod(now));
  const [briefing, setBriefing] = useState(null);
  const [locationLabel] = useState(() => {
    if (typeof window === "undefined") return "";
    return (
      String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim() ||
      String(window.sessionStorage.getItem(SESSION_AUTO_LABEL_KEY) || "").trim()
    );
  });
  const [briefingLoading, setBriefingLoading] = useState(() => {
    if (typeof window === "undefined") return false;
    const raw = (
      String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim() ||
      String(window.sessionStorage.getItem(SESSION_AUTO_LABEL_KEY) || "").trim()
    );
    const initialLocation = parseSessionLocation(raw);
    return Boolean(initialLocation.city && initialLocation.state);
  });

  const location = useMemo(() => parseSessionLocation(locationLabel), [locationLabel]);

  useEffect(() => {
    if (!location.city || !location.state) return undefined;
    let cancelled = false;
    setBriefingLoading(true);
    fetchWaiterBriefing(location.city, location.state, mealPeriod)
      .then((data) => { if (!cancelled) setBriefing(data?.ok ? data : null); })
      .catch(() => { if (!cancelled) setBriefing(null); })
      .finally(() => { if (!cancelled) setBriefingLoading(false); });
    return () => { cancelled = true; };
  }, [location.city, location.state, mealPeriod]);

  const briefingSubheading = locationLabel
    ? `Food picks for ${locationLabel}.`
    : "Your local food market intelligence.";
  const firstName = profile?.first_name || briefing?.account?.first_name || "there";
  const formattedDate = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now);
  const recommendationRows = Array.isArray(briefing?.suggestions)
    ? briefing.suggestions
    : (Array.isArray(briefing?.recommendations) ? briefing.recommendations : []);
  const suggestions = uniqueRecommendations(recommendationRows.filter((row) => row?.type !== "active_deal")).slice(0, 5);
  const deals = uniqueRecommendations((Array.isArray(briefing?.deals)
    ? briefing.deals
    : recommendationRows.filter((row) => row?.type === "active_deal"))).slice(0, 3);
  const marketLabel = [location.city, location.state].filter(Boolean).join(", ");
  const menuItemCount = verifiedCount(briefing?.counts?.menu_item_count);
  const restaurantCount = verifiedCount(briefing?.counts?.restaurant_count);
  const hasVerifiedMarketCounts = menuItemCount !== null && restaurantCount !== null && menuItemCount > 0 && restaurantCount > 0;
  const coverageLimited = Boolean(briefing?.coverage_limited) || suggestions.length < 3;
  const selectedMealLabel = WAITER_MEAL_PERIODS.find((period) => period.id === mealPeriod)?.label || "Meal";
  const marketSubtitle = marketLabel
    ? (hasVerifiedMarketCounts
      ? `Tracking ${menuItemCount.toLocaleString()} menu items across ${marketLabel}.`
      : `Building menu intelligence for ${marketLabel}.`)
    : "Building menu intelligence for your local market.";

  return (
    <div style={{ minHeight: "100vh", background: "var(--gb-color-page)", color: "var(--gb-color-ink)", paddingBottom: "calc(var(--bottom-nav-h, 72px) + 28px)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "18px 16px 0" }}>
        <div style={{ borderRadius: 24, padding: "18px 18px 20px", background: "linear-gradient(135deg, rgba(20,31,22,0.98), rgba(13,19,16,0.94))", border: "1px solid rgba(34,197,94,0.16)", boxShadow: "0 24px 54px rgba(0,0,0,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 800, color: "#86EFAC", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <span>Waiter</span>
            <svg width="16" height="11" viewBox="6.5 12.5 11 7.5" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M11.58 16.34 7.4 13.68v5.32l4.18-2.66Z" />
              <path d="M12.42 16.34 16.6 13.68v5.32l-4.18-2.66Z" />
              <circle cx="12" cy="16.34" r="1" />
            </svg>
          </div>
          <h1 style={{ margin: "10px 0 0", fontSize: 28, lineHeight: 1.05, letterSpacing: "-0.03em" }}>{briefingSubheading}</h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: "#CBD5E1", lineHeight: 1.55, maxWidth: 540 }}>{marketSubtitle}</p>
          {!isAuthenticated ? (
            <div style={{ marginTop: 16, borderRadius: 16, border: "1px solid rgba(34,197,94,0.18)", background: "rgba(34,197,94,0.08)", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontSize: 13, color: "#DCFCE7", lineHeight: 1.45 }}>Sign in to like dishes and improve Waiter recommendations.</div>
              <button type="button" onClick={() => navigate("/account/login")} style={{ border: "none", borderRadius: 999, background: "#22C55E", color: "#0B0F0C", fontSize: 12, fontWeight: 800, padding: "10px 12px", cursor: "pointer", whiteSpace: "nowrap" }}>Sign In</button>
            </div>
          ) : null}
        </div>

        <section style={{ marginTop: 20, borderRadius: 20, border: "1px solid rgba(31,41,55,0.92)", background: "rgba(17,24,20,0.88)", padding: 18, boxShadow: "0 20px 40px rgba(0,0,0,0.28)" }}>
          <div style={{ fontSize: 13, color: "#9CA3AF" }}>Today is {formattedDate}.</div>
          <h2 style={{ margin: "5px 0 0", fontSize: 22, color: "#F9FAFB", letterSpacing: "-0.02em" }}>{getWaiterGreeting(now)}, {firstName}.</h2>

          <div role="radiogroup" aria-label="Meal period" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
            {WAITER_MEAL_PERIODS.map((period) => {
              const selected = mealPeriod === period.id;
              return (
                <button
                  key={period.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => { if (!selected) { setBriefingLoading(true); setMealPeriod(period.id); } }}
                  style={{ borderRadius: 999, border: selected ? "1px solid #22C55E" : "1px solid #374151", background: selected ? "rgba(34,197,94,0.16)" : "rgba(17,24,39,0.55)", color: selected ? "#DCFCE7" : "#6B7280", padding: "9px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                >
                  {period.label}
                </button>
              );
            })}
          </div>

          {isAuthenticated && briefing?.account ? (
            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 14, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.16)", color: "#FDE68A", fontSize: 13, lineHeight: 1.55 }}>
              <div>You currently have {Number(briefing.account.coin_balance || 0).toLocaleString()} G Coins.</div>
              {briefing.account.coin_expiration ? <div>{briefing.account.coin_expiration.amount} expire in {briefing.account.coin_expiration.days_remaining} days.</div> : null}
            </div>
          ) : null}

          <div aria-live="polite" style={{ marginTop: 18 }}>
            {briefingLoading ? (
              <div style={{ fontSize: 14, color: "#9CA3AF" }}>Updating recommendations…</div>
            ) : marketLabel ? (
              <div style={{ display: "grid", gap: 14 }}>
                {hasVerifiedMarketCounts ? (
                  <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.55 }}>
                    Currently tracking {menuItemCount.toLocaleString()} menu items from {restaurantCount.toLocaleString()} {restaurantCount === 1 ? "restaurant" : "restaurants"} in {marketLabel}.
                  </div>
                ) : null}

                {coverageLimited ? (
                  <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.55 }}>
                    We are new to {marketLabel} and are actively adding restaurants and menu data.
                  </div>
                ) : null}

                {suggestions.length ? (
                  <div>
                    <h3 style={{ margin: "0 0 10px", fontSize: 16, color: "#F9FAFB" }}>{selectedMealLabel} Picks</h3>
                    <div style={{ display: "grid", gap: 12 }}>
                      {suggestions.map((recommendation, index) => (
                        <RecommendationCard
                          key={`${recommendation.type}-${recommendation.menu_item_id || recommendation.link}-${index}`}
                          recommendation={recommendation}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <MarketFallback marketLabel={marketLabel} mealPeriod={mealPeriod} />
                )}

                {deals.length ? (
                  <div>
                    <h3 style={{ margin: "2px 0 10px", fontSize: 16, color: "#F9FAFB" }}>Today's Deals</h3>
                    <div style={{ display: "grid", gap: 12 }}>
                      {deals.map((deal, index) => (
                        <RecommendationCard
                          key={`deal-${deal.deal_id || deal.link}-${index}`}
                          recommendation={deal}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {coverageLimited ? <CommunityGrowthCard marketLabel={marketLabel} /> : null}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55 }}>Set your location on the home screen to receive local recommendations.</div>
            )}
          </div>
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
