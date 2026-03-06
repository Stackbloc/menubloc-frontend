// menubloc-frontend/src/pages/SubscriptionSelect.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const s = {
  page: {
    maxWidth: 720,
    margin: "40px auto",
    padding: "0 20px 60px",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  brand: { fontWeight: 800, fontSize: 18, marginBottom: 4 },
  subbrand: { fontSize: 12, color: "#666", marginBottom: 28 },
  heading: { fontSize: 24, fontWeight: 800, marginBottom: 6 },
  subheading: { fontSize: 15, color: "#555", marginBottom: 32 },
  grid: { display: "flex", gap: 16, flexWrap: "wrap" },
  card: (highlighted) => ({
    flex: "1 1 280px",
    border: highlighted ? "2px solid #111" : "1px solid #e5e5e5",
    borderRadius: 18,
    padding: "24px 22px",
    background: highlighted ? "#fafafa" : "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    position: "relative",
  }),
  badge: {
    display: "inline-block",
    fontSize: 11,
    fontWeight: 800,
    background: "#111",
    color: "#fff",
    borderRadius: 999,
    padding: "3px 10px",
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  planName: { fontSize: 20, fontWeight: 800, marginBottom: 4 },
  planTagline: { fontSize: 13, fontWeight: 700, color: "#222", marginBottom: 8 },
  planDesc: { fontSize: 13, color: "#555", marginBottom: 18, lineHeight: 1.6 },
  divider: { height: 1, background: "#eee", marginBottom: 16 },
  includesLabel: { fontSize: 11, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 },
  featureList: { listStyle: "none", padding: 0, margin: "0 0 8px", fontSize: 13, color: "#333", lineHeight: 1.7 },
  featureItem: { display: "flex", gap: 8, alignItems: "flex-start" },
  checkmark: { color: "#111", fontWeight: 900, marginTop: 1, flexShrink: 0 },
  bestFor: { fontSize: 12, color: "#888", marginTop: 12, lineHeight: 1.5, marginBottom: 20 },
  bestForLabel: { fontWeight: 700, color: "#555" },
  btn: (primary) => ({
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: primary ? 0 : "1px solid #ccc",
    background: primary ? "#111" : "#fff",
    color: primary ? "#fff" : "#111",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    marginTop: "auto",
  }),
};

const VERIFIED_FEATURES = [
  "Verified restaurant badge",
  "Ability to edit and manage your menu",
  "Update pricing, descriptions, and restaurant details",
  "Eligibility to appear in search results",
  "Basic menu insights",
];

const PRO_FEATURES = [
  "Everything in Verified, plus",
  "AI-powered menu insights",
  "Pairing suggestions for menu items",
  "Advanced menu presentation features",
  "Promotional menu layers such as deals and featured dishes",
  "Priority visibility in menu discovery",
];

export default function SubscriptionSelect() {
  const nav = useNavigate();

  function choose(plan) {
    // Placeholder — wire to billing/API when ready
    nav(`/restaurant/signup-complete?plan=${plan}`);
  }

  return (
    <div style={s.page}>
      <div style={s.brand}>Grubbid</div>
      <div style={s.subbrand}>for Restaurants</div>

      <div style={s.heading}>Choose your listing plan</div>
      <div style={s.subheading}>
        Select the plan that fits your restaurant.
      </div>

      <div style={s.grid}>
        {/* Verified */}
        <div style={s.card(false)}>
          <div style={s.planName}>Verified</div>
          <div style={s.planTagline}>Verified Listing</div>
          <div style={s.planDesc}>
            Claim and verify your restaurant on Grubbid so customers know your
            menu and restaurant information are accurate. Verified restaurants
            receive a verified badge and can manage their menu directly.
          </div>

          <div style={s.divider} />

          <div style={s.includesLabel}>Includes</div>
          <ul style={s.featureList}>
            {VERIFIED_FEATURES.map((f) => (
              <li key={f} style={s.featureItem}>
                <span style={s.checkmark}>&#10003;</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div style={s.bestFor}>
            <span style={s.bestForLabel}>Best for: </span>
            Restaurants that want an accurate, verified presence on Grubbid.
          </div>

          <button style={s.btn(false)} onClick={() => choose("verified")}>
            Choose Verified
          </button>
        </div>

        {/* Pro */}
        <div style={s.card(true)}>
          <div style={s.badge}>Pro</div>
          <div style={s.planName}>Pro</div>
          <div style={s.planTagline}>Pro Listing</div>
          <div style={s.planDesc}>
            Unlock the full power of the Grubbid food intelligence platform.
            The Pro plan enhances your menu with intelligent insights and helps
            your dishes stand out in discovery results.
          </div>

          <div style={s.divider} />

          <div style={s.includesLabel}>Includes everything in Verified, plus</div>
          <ul style={s.featureList}>
            {PRO_FEATURES.slice(1).map((f) => (
              <li key={f} style={s.featureItem}>
                <span style={s.checkmark}>&#10003;</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div style={s.bestFor}>
            <span style={s.bestForLabel}>Best for: </span>
            Restaurants that want maximum discoverability and menu intelligence.
          </div>

          <button style={s.btn(true)} onClick={() => choose("pro")}>
            Choose Pro
          </button>
        </div>
      </div>
    </div>
  );
}
