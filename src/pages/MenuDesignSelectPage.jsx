/**
 * File:    MenuDesignSelectPage.jsx
 * Path:    menubloc-frontend/src/pages/MenuDesignSelectPage.jsx
 * Date:    2026-03-09
 * Purpose:
 *   Onboarding step 4 — design style selection.
 *   Reached from SubscriptionSelect after plan is chosen.
 *
 *   Router state expected (forwarded from SubscriptionSelect):
 *     restaurant_id    — numeric restaurant ID
 *     restaurant_name  — display name
 *     email            — owner email
 *     owner_token      — HMAC auth token
 *     plan             — "verified" | "pro"
 *     ingestion_method — "pdf" | "spreadsheet" | "ocr"
 *
 *   On style selection: navigates to the upload page (keyed by ingestion_method)
 *   and passes design_style in router state.
 *
 *   On "Skip for now": same navigation with design_style = null.
 *
 *   Adobe integration:
 *     designEngine.js is the sole integration point.
 *     No real Adobe API calls are made here yet.
 */

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DESIGN_STYLES } from "../services/designEngine.js";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const UPLOAD_ROUTES = {
  pdf:         "/restaurant/pdf-upload",
  spreadsheet: "/restaurant/spreadsheet-upload",
  ocr:         "/restaurant/ocr-upload",
};

const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const s = {
  page: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "36px 20px 80px",
    fontFamily: FONT,
    color: "#111",
  },

  // Brand
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

  // Page header
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: 10,
  },
  heading: { fontSize: 30, fontWeight: 800, marginBottom: 10, lineHeight: 1.2 },
  subheading: {
    fontSize: 15,
    color: "#555",
    marginBottom: 36,
    lineHeight: 1.6,
    maxWidth: 520,
  },

  // Style grid
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 52,
  },

  // Individual style card
  card: (selected) => ({
    flex: "1 1 240px",
    maxWidth: 300,
    border: selected ? "2px solid #111" : "1.5px solid #e0e0e0",
    borderRadius: 18,
    overflow: "hidden",
    background: "#fff",
    cursor: "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxShadow: selected
      ? "0 0 0 3px rgba(0,0,0,0.1)"
      : "0 2px 10px rgba(0,0,0,0.05)",
    display: "flex",
    flexDirection: "column",
  }),

  // Preview area
  previewArea: { height: 190, flexShrink: 0, position: "relative", overflow: "hidden" },

  popularBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "#f5c842",
    color: "#1a1200",
    fontSize: 10,
    fontWeight: 800,
    borderRadius: 999,
    padding: "3px 9px",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    zIndex: 1,
  },

  // Card content
  cardContent: {
    padding: "16px 18px 18px",
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  cardName: { fontSize: 16, fontWeight: 800, marginBottom: 3 },
  cardTagline: { fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 8 },
  cardDesc: { fontSize: 12, color: "#777", lineHeight: 1.6, marginBottom: 16, flex: 1 },

  selectBtn: (selected) => ({
    width: "100%",
    height: 40,
    borderRadius: 10,
    border: selected ? 0 : "1.5px solid #ddd",
    background: selected ? "#111" : "#fff",
    color: selected ? "#fff" : "#111",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    fontFamily: FONT,
  }),

  // Value proposition strip
  valueStrip: {
    background: "#f8f8f8",
    border: "1px solid #eee",
    borderRadius: 16,
    padding: "24px 28px",
    marginBottom: 40,
    display: "flex",
    flexWrap: "wrap",
    gap: "16px 40px",
    alignItems: "flex-start",
  },
  valueCol: { flex: "1 1 180px" },
  valueLabel: { fontSize: 11, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 },
  valuePt: { display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7, fontSize: 13, color: "#333", lineHeight: 1.5 },
  valuePtIcon: { color: "#111", fontWeight: 900, flexShrink: 0, marginTop: 1 },

  // Actions
  actions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 14,
  },
  continueBtn: (disabled) => ({
    width: "100%",
    maxWidth: 380,
    height: 50,
    borderRadius: 14,
    border: 0,
    background: disabled ? "#ccc" : "#111",
    color: "#fff",
    fontWeight: 800,
    fontSize: 16,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: FONT,
    transition: "background 0.15s",
  }),
  skipLink: {
    fontSize: 13,
    color: "#888",
    cursor: "pointer",
    background: "none",
    border: "none",
    fontFamily: FONT,
    textDecoration: "underline",
    textDecorationColor: "rgba(0,0,0,0.2)",
    padding: 0,
  },

  // Missing state error
  error: {
    padding: "14px 18px",
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    fontSize: 13,
    color: "#c00",
    marginTop: 24,
  },
};

// ─────────────────────────────────────────────────────────────
// Mini menu preview renderer
// Each style's preview object drives the color scheme.
// ─────────────────────────────────────────────────────────────

const PREVIEW_ITEMS = [
  { name: "Garden Salad",   price: "$9" },
  { name: "Bruschetta",     price: "$11" },
  { name: "Grilled Salmon", price: "$26" },
  { name: "House Burger",   price: "$16" },
];

function StylePreview({ preview }) {
  const p = preview;

  return (
    <div
      style={{
        background: p.bg,
        width: "100%",
        height: "100%",
        padding: "14px 16px 10px",
        boxSizing: "border-box",
        fontFamily: FONT,
        border: p.border,
        borderBottom: "none",
        borderLeft: "none",
        borderRight: "none",
        borderTop: "none",
      }}
    >
      {/* Restaurant name */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: p.headerColor,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          paddingBottom: 8,
          marginBottom: 10,
          borderBottom: `2px solid ${p.accent}`,
          background: p.headerBg,
        }}
      >
        Rosewood Kitchen
      </div>

      {/* Section label */}
      <div
        style={{
          fontSize: 8.5,
          fontWeight: 700,
          color: p.sectionColor,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: 6,
        }}
      >
        Starters &amp; Mains
      </div>

      {/* Items */}
      {PREVIEW_ITEMS.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontSize: 10,
            color: p.itemColor,
            paddingBottom: 5,
            marginBottom: 5,
            borderBottom: i < PREVIEW_ITEMS.length - 1
              ? `1px solid ${p.divider}`
              : "none",
          }}
        >
          <span style={{ fontWeight: 500 }}>{item.name}</span>
          <span style={{ fontWeight: 700, color: p.priceColor, marginLeft: 8 }}>
            {item.price}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────

export default function MenuDesignSelectPage() {
  const nav      = useNavigate();
  const location = useLocation();

  const {
    restaurant_id,
    restaurant_name = "Your restaurant",
    email           = "",
    owner_token     = "",
    plan            = "verified",
    ingestion_method,
  } = location.state || {};

  const [selectedStyle, setSelectedStyle] = useState(null);

  const missingState = !restaurant_id || !email || !owner_token;

  function navigate(designStyle) {
    const uploadRoute = UPLOAD_ROUTES[ingestion_method] || "/restaurant/signup-complete";
    nav(uploadRoute, {
      state: {
        restaurant_id,
        restaurant_name,
        email,
        owner_token,
        plan,
        design_style: designStyle,
      },
    });
  }

  function handleContinue() {
    navigate(selectedStyle);
  }

  function handleSkip() {
    navigate(null);
  }

  // ── Missing state guard ──────────────────────────────────
  if (missingState) {
    return (
      <div style={s.page}>
        <div style={s.brand}>Grubbid</div>
        <div style={s.subbrand}>for Restaurants</div>
        <div style={s.error}>
          <strong>Missing session data.</strong> Please complete the signup flow to reach this
          page.{" "}
          <a href="/signup" style={{ color: "#c00", fontWeight: 700 }}>
            Start over
          </a>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────
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
        <div style={s.step(false, true)}>3. Choose plan</div>
        <div style={s.stepDivider} />
        <div style={s.step(true,  false)}>4. Design</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, false)}>5. Upload menu</div>
      </div>

      {/* Page header */}
      <div style={s.eyebrow}>Menu Design</div>
      <div style={s.heading}>Choose your menu style</div>
      <div style={s.subheading}>
        Beautiful menu design in minutes. No design experience needed. Pick a style
        that fits your restaurant — we handle the rest.
      </div>

      {/* Style cards */}
      <div style={s.grid}>
        {DESIGN_STYLES.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <div
              key={style.id}
              style={s.card(isSelected)}
              onClick={() => setSelectedStyle(style.id)}
            >
              {/* Preview */}
              <div style={s.previewArea}>
                {style.popular && (
                  <div style={s.popularBadge}>Most Popular</div>
                )}
                <StylePreview preview={style.preview} />
              </div>

              {/* Card content */}
              <div style={s.cardContent}>
                <div style={s.cardName}>{style.name}</div>
                <div style={s.cardTagline}>{style.tagline}</div>
                <div style={s.cardDesc}>{style.description}</div>
                <button
                  style={s.selectBtn(isSelected)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStyle(style.id);
                  }}
                >
                  {isSelected ? "✓  Style selected" : "Select this style"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Value proposition */}
      <div style={s.valueStrip}>
        <div style={s.valueCol}>
          <div style={s.valueLabel}>What you get</div>
          {[
            "Your menu styled and ready to share",
            "QR codes use your chosen design",
            "Great for dine-in, takeout, and online",
          ].map((pt) => (
            <div key={pt} style={s.valuePt}>
              <span style={s.valuePtIcon}>&#10003;</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
        <div style={s.valueCol}>
          <div style={s.valueLabel}>Included with your plan</div>
          {[
            "Automatic updates when you edit your menu",
            "Mobile-friendly layout out of the box",
            "No design tools or skills required",
          ].map((pt) => (
            <div key={pt} style={s.valuePt}>
              <span style={s.valuePtIcon}>&#10003;</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={s.actions}>
        <button
          style={s.continueBtn(!selectedStyle)}
          disabled={!selectedStyle}
          onClick={handleContinue}
        >
          {selectedStyle
            ? `Continue with ${DESIGN_STYLES.find((d) => d.id === selectedStyle)?.name}`
            : "Select a style to continue"}
        </button>

        <button style={s.skipLink} onClick={handleSkip}>
          Skip for now — use basic menu layout
        </button>
      </div>
    </div>
  );
}
