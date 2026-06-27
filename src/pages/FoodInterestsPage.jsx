import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { fetchWaiterBriefing } from "../lib/waiterApi.js";
import { getDefaultMealPeriod, getMealPeriodFallback, getWaiterGreeting, WAITER_MEAL_PERIODS } from "../lib/waiterMealPeriod.js";
import { groupLikedRecommendations } from "../lib/waiterRecommendations.js";

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_AUTO_LABEL_KEY = "grubbid.discovery.auto_label";

function parseSessionLocation(raw) {
  const str = String(raw || "").trim();
  if (!str) return { city: "", state: "" };
  const comma = str.lastIndexOf(",");
  if (comma === -1) return { city: str, state: "" };
  return { city: str.slice(0, comma).trim(), state: str.slice(comma + 1).trim() };
}

// ---- Grouping helpers ----

function extractRestaurantName(detail) {
  if (!detail) return "";
  const midDot = detail.indexOf(" · ");
  return midDot !== -1 ? detail.slice(0, midDot).trim() : detail.trim();
}

function extractRestaurantSlug(link) {
  if (!link) return null;
  const m = link.match(/\/restaurants\/([^/?#]+)/);
  return m ? m[1] : null;
}

function resolveGroupLabel(labels, mealLabel) {
  if (!labels.length) return null;
  if (labels.length === 1) return labels[0];
  return `Recommended for ${mealLabel}`;
}

// Groups new_item rows by restaurant. new_restaurant rows become standalones.
// Returns up to 5 groups.
function groupSuggestions(rows) {
  const restaurantOrder = [];
  const restaurantMap = new Map();

  const likedRows = rows.filter((row) => row.type === "liked_signal");
  let likedModuleAdded = false;

  for (const row of rows) {
    if (row.type === "liked_signal") {
      if (!likedModuleAdded) {
        restaurantOrder.push({
          kind: "liked_topic",
          label: "Based on dishes you like",
          restaurants: groupLikedRecommendations(likedRows),
        });
        likedModuleAdded = true;
      }
      continue;
    }
    if (row.type === "new_item") {
      const name = extractRestaurantName(row.detail);
      if (!name) continue;
      if (!restaurantMap.has(name)) {
        const entry = {
          kind: "restaurant_group",
          restaurantName: name,
          slug: extractRestaurantSlug(row.link),
          labelSet: [],
          items: [],
        };
        restaurantMap.set(name, entry);
        restaurantOrder.push(entry);
      }
      const g = restaurantMap.get(name);
      if (row.label && !g.labelSet.includes(row.label)) g.labelSet.push(row.label);
      g.items.push(row);
    } else {
      // new_restaurant or other — show as standalone
      restaurantOrder.push({ kind: "standalone", rec: row });
    }
  }

  return restaurantOrder.slice(0, 5);
}

// ---- Dedup ----

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

// ---- Card components ----

const CARD_STYLE = {
  borderRadius: 16,
  padding: "14px 15px",
  border: "1px solid rgba(134,239,172,0.14)",
  background: "linear-gradient(180deg, rgba(17,24,20,0.92), rgba(11,15,12,0.92))",
};

const LABEL_STYLE = {
  fontSize: 10,
  fontWeight: 800,
  color: "#86EFAC",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
};

const LINK_STYLE = {
  display: "inline-block",
  marginTop: 10,
  fontSize: 12,
  fontWeight: 800,
  color: "#86EFAC",
  textDecoration: "none",
  borderBottom: "1px solid rgba(134,239,172,0.28)",
  paddingBottom: 1,
};

const ITEM_LINK_STYLE = {
  color: "#CBD5E1",
  textDecoration: "none",
  fontSize: 13,
  lineHeight: 1.45,
};

export function LikedRecommendationTopicCard({ topic }) {
  return (
    <div style={CARD_STYLE} data-testid="liked-recommendation-topic">
      <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#86EFAC" }}>{topic.label}</h4>
      <div style={{ display: "grid", gap: 14 }}>
        {topic.restaurants.map((restaurant) => (
          <div key={restaurant.restaurantId ?? restaurant.restaurantName}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#F9FAFB" }}>
              {restaurant.restaurantName}
            </div>
            <div style={{ display: "grid", gap: 7, marginTop: 6 }}>
              {restaurant.items.map((item, index) => (
                <div key={item.menu_item_id ?? item.link ?? index} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ ...ITEM_LINK_STYLE, color: "#CBD5E1" }}>{item.title}</span>
                  {item.link ? (
                    <Link to={item.link} style={{ ...LINK_STYLE, marginTop: 0, whiteSpace: "nowrap" }}>
                      {item.link_label || "View dish →"}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// One card per restaurant with multiple items listed inside
function RestaurantGroupCard({ group, mealLabel }) {
  const { restaurantName, slug, labelSet, items } = group;
  const resolvedLabel = resolveGroupLabel(labelSet, mealLabel);
  const menuLink = slug ? `/restaurants/${slug}/menu` : (items[0]?.link || null);
  const visibleItems = items.slice(0, 4);
  const overflow = items.length - visibleItems.length;

  return (
    <div style={CARD_STYLE}>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#F9FAFB", marginBottom: 4 }}>
        {restaurantName}
      </div>
      {resolvedLabel ? <div style={LABEL_STYLE}>{resolvedLabel}</div> : null}
      <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 3 }}>
        {visibleItems.map((item, i) => (
          <li key={item.link || i} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ color: "#4B5563", fontSize: 12, flexShrink: 0 }}>&bull;</span>
            {item.link ? (
              <Link to={item.link} style={ITEM_LINK_STYLE}>{item.title}</Link>
            ) : (
              <span style={{ ...ITEM_LINK_STYLE, color: "#9CA3AF" }}>{item.title}</span>
            )}
          </li>
        ))}
      </ul>
      {overflow > 0 ? (
        <div style={{ marginTop: 5, fontSize: 12, color: "#6B7280" }}>+{overflow} more on menu</div>
      ) : null}
      {menuLink ? (
        <Link to={menuLink} style={LINK_STYLE}>View Menu →</Link>
      ) : null}
    </div>
  );
}

// Single-item or new_restaurant standalone card
function StandaloneCard({ rec }) {
  return (
    <div style={CARD_STYLE}>
      {rec.label ? <div style={LABEL_STYLE}>{rec.label}</div> : null}
      <div style={{ fontSize: 15, fontWeight: 800, color: "#F9FAFB" }}>{rec.title}</div>
      {rec.detail ? (
        <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.5, marginTop: 4 }}>{rec.detail}</div>
      ) : null}
      {rec.link ? (
        <Link to={rec.link} style={LINK_STYLE}>{rec.link_label || "View →"}</Link>
      ) : null}
    </div>
  );
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

  const suggestions = uniqueRecommendations(recommendationRows.filter((row) => row?.type !== "active_deal"));

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

  const groups = useMemo(() => groupSuggestions(suggestions), [suggestions]);

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

                {groups.length ? (
                  <div>
                    <h3 style={{ margin: "0 0 10px", fontSize: 16, color: "#F9FAFB" }}>{selectedMealLabel} Picks</h3>
                    {coverageLimited && suggestions.length < 3 ? (
                      <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 10, lineHeight: 1.55 }}>
                        We only have a few recommendations in this area right now.
                      </div>
                    ) : null}
                    <div style={{ display: "grid", gap: 12 }}>
                      {groups.map((group, index) =>
                        group.kind === "liked_topic" ? (
                          <LikedRecommendationTopicCard
                            key="liked-recommendation-topic"
                            topic={group}
                          />
                        ) : group.kind === "restaurant_group" ? (
                          <RestaurantGroupCard
                            key={group.restaurantName + index}
                            group={group}
                            mealLabel={selectedMealLabel}
                          />
                        ) : (
                          <StandaloneCard
                            key={(group.rec?.link || group.rec?.title) + index}
                            rec={group.rec}
                          />
                        )
                      )}
                    </div>
                  </div>
                ) : (
                  <MarketFallback marketLabel={marketLabel} mealPeriod={mealPeriod} />
                )}

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
