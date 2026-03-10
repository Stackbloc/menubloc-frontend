/**
 * File:    SubscriptionSelect.jsx
 * Path:    menubloc-frontend/src/pages/SubscriptionSelect.jsx
 * Date:    2026-03-09
 * Purpose:
 *   Onboarding step 3 — choose a profile plan (Verified or Pro).
 *   Reached from ProfileSearchPage after restaurant is found/created/claimed.
 *
 *   Router state expected:
 *     restaurant_id    — numeric restaurant ID
 *     restaurant_name  — display name
 *     email            — owner email
 *     owner_token      — HMAC auth token
 *     ingestion_method — "pdf" | "spreadsheet" | "ocr"
 *
 *   On plan choice: navigates to /restaurant/design-select (step 4)
 *   with plan + all forwarded state in router state.
 *
 *   Update 2026-03-09:
 *     Added design upgrade teaser section below plan cards.
 *     Plan selection now routes to MenuDesignSelectPage (step 4)
 *     instead of directly to the upload page.
 */

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const s = {
  page: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "36px 20px 80px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  brand:    { fontWeight: 800, fontSize: 18 },
  subbrand: { fontSize: 12, color: "#666", marginBottom: 28 },

  // Step trail
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 40,
    fontSize: 11,
    fontWeight: 600,
    flexWrap: "wrap",
    rowGap: 8,
  },
  step: (active, done) => ({
    padding: "4px 10px",
    borderRadius: 999,
    background: done ? "#111" : active ? "#f0f0f5" : "transparent",
    color: done ? "#fff" : active ? "#111" : "#aaa",
    border: active ? "1.5px solid #111" : "1.5px solid transparent",
    whiteSpace: "nowrap",
    fontSize: 11,
  }),
  stepDivider: { flex: "0 0 12px", height: 1, background: "#e0e0e0", margin: "0 2px" },

  heading:    { fontSize: 24, fontWeight: 800, marginBottom: 6 },
  subheading: { fontSize: 15, color: "#555", marginBottom: 32 },

  // Plan cards
  grid: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 48 },
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
  planName:    { fontSize: 20, fontWeight: 800, marginBottom: 4 },
  planTagline: { fontSize: 13, fontWeight: 700, color: "#222", marginBottom: 8 },
  planDesc:    { fontSize: 13, color: "#555", marginBottom: 18, lineHeight: 1.6 },
  divider:     { height: 1, background: "#eee", marginBottom: 16 },
  includesLabel: {
    fontSize: 11, fontWeight: 800, color: "#888",
    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10,
  },
  featureList: { listStyle: "none", padding: 0, margin: "0 0 8px", fontSize: 13, color: "#333", lineHeight: 1.7 },
  featureItem: { display: "flex", gap: 8, alignItems: "flex-start" },
  checkmark:   { color: "#111", fontWeight: 900, marginTop: 1, flexShrink: 0 },
  bestFor:     { fontSize: 12, color: "#888", marginTop: 12, lineHeight: 1.5, marginBottom: 20 },
  bestForLabel:{ fontWeight: 700, color: "#555" },
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
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
  }),

  // Design upgrade teaser
  designTeaser: {
    border: "1.5px solid #e0e0e0",
    borderRadius: 18,
    padding: "24px 24px 20px",
    background: "linear-gradient(135deg, #fafafa 0%, #f5f5ff 100%)",
    display: "flex",
    gap: 24,
    flexWrap: "wrap",
    alignItems: "center",
  },
  teaserLeft: { flex: "1 1 260px" },
  teaserEyebrow: {
    fontSize: 11, fontWeight: 800, color: "#888",
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
  },
  teaserHeading: { fontSize: 18, fontWeight: 800, marginBottom: 8, lineHeight: 1.3 },
  teaserDesc:    { fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 0 },
  teaserRight: { flex: "0 0 auto", display: "flex", gap: 8 },

  // Mini style preview swatches (decorative)
  swatch: (bg, accent) => ({
    width: 64,
    height: 80,
    borderRadius: 10,
    background: bg,
    border: "1.5px solid rgba(0,0,0,0.1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    padding: "8px 7px",
    boxSizing: "border-box",
    gap: 3,
  }),
  swatchHeader: (color) => ({
    height: 5, borderRadius: 2, background: color, marginBottom: 2,
  }),
  swatchLine: (opacity) => ({
    height: 3, borderRadius: 2, background: `rgba(0,0,0,${opacity})`, width: "80%",
  }),
  swatchLineSm: (opacity) => ({
    height: 3, borderRadius: 2, background: `rgba(0,0,0,${opacity})`, width: "55%",
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

// Brief swatch previews shown in the design teaser — decorative only.
const TEASER_SWATCHES = [
  { bg: "#111111", accent: "#f5c842" },
  { bg: "#faf6f0", accent: "#8b5e3c" },
  { bg: "#ffffff", accent: "#111111" },
];

export default function SubscriptionSelect() {
  const nav      = useNavigate();
  const location = useLocation();

  const {
    restaurant_id,
    restaurant_name,
    email,
    owner_token,
    ingestion_method,
  } = location.state || {};

  function choose(plan) {
    // Step 4 is now design selection — always route there first.
    nav("/restaurant/design-select", {
      state: { restaurant_id, restaurant_name, email, owner_token, plan, ingestion_method },
    });
  }

  return (
    <div style={s.page}>
      {/* Brand */}
      <div style={s.brand}>Grubbid</div>
      <div style={s.subbrand}>for Restaurants</div>

      {/* Step trail */}
      <div style={s.steps}>
        <div style={s.step(false, true)}>1. Account</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>2. Find your profile</div>
        <div style={s.stepDivider} />
        <div style={s.step(true,  false)}>3. Choose plan</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, false)}>4. Design</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, false)}>5. Upload menu</div>
      </div>

      {/* Heading */}
      <div style={s.heading}>Choose your profile plan</div>
      <div style={s.subheading}>Select the plan that fits your restaurant.</div>

      {/* Plan cards */}
      <div style={s.grid}>
        {/* Verified */}
        <div style={s.card(false)}>
          <div style={s.planName}>Verified</div>
          <div style={s.planTagline}>Verified Profile</div>
          <div style={s.planDesc}>
            Claim and verify your restaurant on Grubbid so customers know your menu and
            restaurant information are accurate. Verified restaurants receive a verified
            badge and can manage their menu directly.
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
          <div style={s.planTagline}>Pro Profile</div>
          <div style={s.planDesc}>
            Unlock the full power of the Grubbid food intelligence platform. The Pro plan
            enhances your menu with intelligent insights and helps your dishes stand out
            in discovery results.
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

      {/* Design upgrade teaser */}
      <div style={s.designTeaser}>
        <div style={s.teaserLeft}>
          <div style={s.teaserEyebrow}>Up next — step 4</div>
          <div style={s.teaserHeading}>
            Make your menu look beautiful
          </div>
          <div style={s.teaserDesc}>
            After choosing your plan, you will pick a design style for your digital menu.
            It takes under a minute, and no design skills are needed.
          </div>
        </div>
        <div style={s.teaserRight}>
          {TEASER_SWATCHES.map(({ bg, accent }, i) => (
            <div key={i} style={s.swatch(bg, accent)}>
              <div style={s.swatchHeader(accent)} />
              <div style={s.swatchLine(bg === "#111111" ? 0.6 : 0.2)} />
              <div style={s.swatchLineSm(bg === "#111111" ? 0.4 : 0.15)} />
              <div style={{ ...s.swatchLine(bg === "#111111" ? 0.6 : 0.2), marginTop: 3 }} />
              <div style={s.swatchLineSm(bg === "#111111" ? 0.4 : 0.15)} />
              <div style={{ ...s.swatchLine(bg === "#111111" ? 0.6 : 0.2), marginTop: 2 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
