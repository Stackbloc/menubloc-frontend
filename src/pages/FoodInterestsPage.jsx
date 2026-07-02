import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { useConsumer } from "../context/ConsumerContext.jsx";
import { fetchWaiterBriefing } from "../lib/waiterApi.js";

// ⚠️ WAITER PROTECTION GUARDRAIL (2026-07-01)
// This file is FROZEN. Do NOT add meal period chips, greetings, MarketFallback,
// CommunityGrowthCard, or any new imports without explicit user instruction.
// One card per recommendation category. See CLAUDE.md Waiter guardrail.

const SESSION_LOCATION_KEY = "grubbid.discovery.location";
const SESSION_AUTO_LABEL_KEY = "grubbid.discovery.auto_label";

function parseSessionLocation(raw) {
  const str = String(raw || "").trim();
  if (!str) return { city: "", state: "" };
  const comma = str.lastIndexOf(",");
  if (comma === -1) return { city: str, state: "" };
  return { city: str.slice(0, comma).trim(), state: str.slice(comma + 1).trim() };
}

// ONE group per type — enforces the one-card-per-category rule
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
  return order.map((key) => map.get(key));
}

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
  marginBottom: 8,
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

// Renders one card for an entire category (e.g. all "New for Dinner" items)
function CategoryCard({ group }) {
  return (
    <div style={CARD_STYLE}>
      {group.label ? <div style={LABEL_STYLE}>{group.label}</div> : null}
      <div style={{ display: "grid", gap: 10 }}>
        {group.items.map((item, index) => (
          <div key={item.link || item.title || index}>
            {item.link ? (
              <Link to={item.link} style={{ ...ITEM_LINK_STYLE, display: "block", fontWeight: 700, color: "#F9FAFB" }}>
                {item.title}
              </Link>
            ) : (
              <span style={{ ...ITEM_LINK_STYLE, fontWeight: 700, color: "#F9FAFB" }}>{item.title}</span>
            )}
            {item.detail ? (
              <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.45, marginTop: 2 }}>{item.detail}</div>
            ) : null}
            {item.link && item.link_label ? (
              <Link to={item.link} style={LINK_STYLE}>{item.link_label}</Link>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FoodInterestsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConsumer();

  const [locationLabel] = useState(() => {
    if (typeof window === "undefined") return "";
    return (
      String(window.sessionStorage.getItem(SESSION_LOCATION_KEY) || "").trim() ||
      String(window.sessionStorage.getItem(SESSION_AUTO_LABEL_KEY) || "").trim()
    );
  });

  const location = parseSessionLocation(locationLabel);

  const [briefing, setBriefing] = useState(null);
  const [briefingLoading, setBriefingLoading] = useState(
    Boolean(location.city && location.state)
  );

  useEffect(() => {
    if (!location.city || !location.state) return undefined;
    let cancelled = false;
    setBriefingLoading(true);
    fetchWaiterBriefing(location.city, location.state)
      .then((data) => { if (!cancelled) setBriefing(data?.ok ? data : null); })
      .catch(() => { if (!cancelled) setBriefing(null); })
      .finally(() => { if (!cancelled) setBriefingLoading(false); });
    return () => { cancelled = true; };
  }, [location.city, location.state]);

  const subheading = locationLabel
    ? `Food picks for ${locationLabel}.`
    : "Your local food market intelligence.";

  // briefing.recommendations is the correct field (not briefing.cards)
  const groups = groupByType(briefing?.recommendations);

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
              <div style={{ fontSize: 13, color: "#DCFCE7", lineHeight: 1.45 }}>Sign in to like dishes and improve Waiter recommendations.</div>
              <button type="button" onClick={() => navigate("/account/login")} style={{ border: "none", borderRadius: 999, background: "#22C55E", color: "#0B0F0C", fontSize: 12, fontWeight: 800, padding: "10px 12px", cursor: "pointer", whiteSpace: "nowrap" }}>Sign In</button>
            </div>
          ) : null}
        </div>

        {/* Recommendations */}
        <section style={{ marginTop: 20 }} aria-live="polite">
          {briefingLoading ? (
            <div style={{ fontSize: 14, color: "#9CA3AF", padding: "12px 0" }}>Loading recommendations…</div>
          ) : !location.city ? (
            <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.55, padding: "12px 0" }}>
              Set your location on the home screen to receive local recommendations.
            </div>
          ) : groups.length ? (
            <div style={{ display: "grid", gap: 12 }}>
              {groups.map((group) => (
                <CategoryCard key={group.type} group={group} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#9CA3AF", lineHeight: 1.55, padding: "12px 0" }}>
              No recommendations available for your area right now. Check back soon.
            </div>
          )}
        </section>
      </div>
      <BottomNav />
    </div>
  );
}
