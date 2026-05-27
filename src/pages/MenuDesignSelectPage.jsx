import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DESIGN_STYLES } from "../services/designEngine.js";
import { BrandLockup } from "../components/BrandLogo.jsx";
import {
  RESTAURANT_SIGNUP_RESTART_ROUTE,
  buildRestaurantOnboardingSearch,
  navigateWithRestaurantOnboardingState,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
} from "../lib/restaurantOnboardingState.js";

const BYPASS_MODE = import.meta.env.VITE_ALLOW_OWNER_TOKEN_BYPASS === "true";
const UPLOAD_ROUTES = {
  pdf: "/restaurant/pdf-upload",
  later: "/restaurant/design-select",
  spreadsheet: "/restaurant/spreadsheet-upload",
  ocr: "/restaurant/ocr-upload",
};
const FONT = "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";

const s = {
  page: {
    maxWidth: 860,
    margin: "0 auto",
    padding: "36px 20px 80px",
    fontFamily: FONT,
    color: "#111",
  },
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
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 18,
    marginBottom: 52,
  },
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
  valueLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 10,
  },
  valuePt: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 7,
    fontSize: 13,
    color: "#333",
    lineHeight: 1.5,
  },
  valuePtIcon: { color: "#111", fontWeight: 900, flexShrink: 0, marginTop: 1 },
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
  error: {
    padding: "14px 18px",
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    fontSize: 13,
    color: "#c00",
    marginTop: 24,
    lineHeight: 1.6,
  },
  restartBtn: {
    display: "inline-flex",
    marginTop: 14,
    padding: "10px 14px",
    borderRadius: 10,
    background: "#111",
    color: "#fff",
    fontWeight: 700,
    textDecoration: "none",
  },
  completionCard: {
    background: "#f8fbf8",
    border: "1px solid #cfe0d8",
    borderRadius: 18,
    padding: "22px 24px",
    marginBottom: 34,
  },
  completionLabel: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#1F4E3D",
    marginBottom: 10,
  },
  completionHeading: {
    fontSize: 24,
    fontWeight: 800,
    marginBottom: 10,
    lineHeight: 1.25,
  },
  completionCopy: {
    fontSize: 14,
    lineHeight: 1.65,
    color: "#344054",
    marginBottom: 16,
  },
  completionList: {
    margin: "0 0 18px",
    paddingLeft: 18,
    color: "#344054",
    fontSize: 14,
    lineHeight: 1.7,
  },
  completionActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  completionBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    padding: "0 18px",
    borderRadius: 12,
    background: "#111",
    color: "#fff",
    fontWeight: 800,
    textDecoration: "none",
    border: 0,
    cursor: "pointer",
    fontFamily: FONT,
  },
  completionBtnAlt: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    padding: "0 18px",
    borderRadius: 12,
    background: "#fff",
    color: "#111",
    fontWeight: 700,
    textDecoration: "none",
    border: "1px solid #d0d5dd",
    cursor: "pointer",
    fontFamily: FONT,
  },
};

const PREVIEW_ITEMS = [
  { name: "Garden Salad", price: "$9" },
  { name: "Bruschetta", price: "$11" },
  { name: "Grilled Salmon", price: "$26" },
  { name: "House Burger", price: "$16" },
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
      }}
    >
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

      {PREVIEW_ITEMS.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontSize: 10,
            color: p.itemColor,
            paddingBottom: 5,
            marginBottom: 5,
            borderBottom: index < PREVIEW_ITEMS.length - 1
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

export default function MenuDesignSelectPage() {
  const { t } = useLanguage();
  const nav = useNavigate();
  const location = useLocation();
  const recovery = useMemo(
    () => resolveRestaurantOnboardingState({ routeState: location.state, search: location.search }),
    [location.state, location.search]
  );

  useEffect(() => {
    if (recovery.hasAnyData) {
      persistRestaurantOnboardingState(recovery.state);
    }
  }, [recovery]);

  const flowState = recovery.state || {};
  const {
    restaurant_id,
    restaurant_name = "Your restaurant",
    email = "",
    owner_token = "",
    plan = "verified",
    ingestion_method,
    design_style = null,
  } = flowState;
  const searchParams = new URLSearchParams(location.search || "");
  const isUploadLater = ingestion_method === "later";
  const uploadLaterReady = isUploadLater && searchParams.get("upload_later_ready") === "1";

  const isPro =
    plan === "pro_monthly" ||
    plan === "pro_annual" ||
    plan === "pro" ||
    plan === "founders_annual";
  const visibleStyles = isPro ? DESIGN_STYLES : DESIGN_STYLES.filter((style) => !style.proOnly);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const missingState = !restaurant_id || !email || (!owner_token && !BYPASS_MODE);

  function navigateNext(designStyle) {
    const nextState = persistRestaurantOnboardingState({
      ...flowState,
      design_style: designStyle,
    });

    if (isUploadLater) {
      const onboardingSearch = buildRestaurantOnboardingSearch(nextState);
      nav({
        pathname: "/restaurant/design-select",
        search: `${onboardingSearch}${onboardingSearch ? "&" : "?"}upload_later_ready=1`,
      });
      return;
    }

    const uploadRoute = UPLOAD_ROUTES[ingestion_method] || "/restaurant/menu-upload-choice";
    navigateWithRestaurantOnboardingState(nav, uploadRoute, nextState);
  }

  if (missingState) {
    return (
      <div style={s.page}>
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
        />
        <div style={s.error}>
          <strong>We could not recover your restaurant signup session.</strong><br />
          Start signup again to restore your account, plan, and upload path.
          <br />
          <Link to={RESTAURANT_SIGNUP_RESTART_ROUTE} style={s.restartBtn}>
            Restart restaurant signup
          </Link>
        </div>
      </div>
    );
  }

  if (uploadLaterReady) {
    const chosenStyle = DESIGN_STYLES.find((style) => style.id === (design_style ?? selectedStyle));
    return (
      <div style={s.page}>
        <BrandLockup
          subtitle="for Restaurants"
          logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
        />

        <div style={s.completionCard}>
          <div style={s.completionLabel}>Setup saved</div>
          <div style={s.completionHeading}>Your restaurant account is ready for you to return later.</div>
          <div style={s.completionCopy}>
            We saved your restaurant details and {chosenStyle ? `${chosenStyle.name} design style` : "basic menu layout"}.
            You can sign in to My Account any time to upload your menu, check review status, and continue setup.
          </div>
          <ul style={s.completionList}>
            <li>Your restaurant account has been created.</li>
            <li>Your menu style choice has been saved.</li>
            <li>No menu upload is required right now.</li>
          </ul>
          <div style={s.completionActions}>
            <Link to="/operator/login" style={s.completionBtn}>
              Sign in to My Account
            </Link>
            <button type="button" style={s.completionBtnAlt} onClick={() => nav("/")}>
              Finish for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <BrandLockup
        subtitle="for Restaurants"
        logoProps={{ width: 180, height: 112, radius: 24, pageColor: "#f6f6f3" }}
      />

      <div style={s.steps}>
        <div style={s.step(false, true)}>1. Account</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, true)}>2. Choose plan</div>
        <div style={s.stepDivider} />
        <div style={s.step(true, false)}>3. Design</div>
        <div style={s.stepDivider} />
        <div style={s.step(false, false)}>4. Upload menu</div>
      </div>

      <div style={s.eyebrow}>Menu Design</div>
      <div style={s.heading}>Choose your menu style</div>
      <div style={s.subheading}>
        {isPro
          ? "Beautiful menu design powered by Adobe. Pick a style that fits your restaurant and continue into upload."
          : "Your plan includes the Clean Classic design. Upgrade to Pro to unlock all styles including Adobe-powered designs."}
      </div>

      <div style={s.grid}>
        {visibleStyles.map((style) => {
          const isSelected = selectedStyle === style.id;
          return (
            <div
              key={style.id}
              style={s.card(isSelected)}
              onClick={() => setSelectedStyle(style.id)}
            >
              <div style={s.previewArea}>
                {style.popular ? <div style={s.popularBadge}>Most Popular</div> : null}
                <StylePreview preview={style.preview} />
              </div>

              <div style={s.cardContent}>
                <div style={s.cardName}>{style.name}</div>
                <div style={s.cardTagline}>{style.tagline}</div>
                <div style={s.cardDesc}>{style.description}</div>
                <button
                  style={s.selectBtn(isSelected)}
                  onClick={(event) => {
                    event.stopPropagation();
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

      <div style={s.valueStrip}>
        <div style={s.valueCol}>
          <div style={s.valueLabel}>What you get</div>
          {[
            "Your menu styled and ready to share",
            "QR codes use your chosen design",
            "Great for dine-in, takeout, and online",
          ].map((point) => (
            <div key={point} style={s.valuePt}>
              <span style={s.valuePtIcon}>&#10003;</span>
              <span>{point}</span>
            </div>
          ))}
        </div>
        <div style={s.valueCol}>
          <div style={s.valueLabel}>{isPro ? "Pro plan includes" : "Included with your plan"}</div>
          {(isPro
            ? [
                "All Adobe-powered design styles",
                "Automatic updates when you edit your menu",
                "Mobile-friendly layout out of the box",
              ]
            : [
                "Clean Classic design style",
                "Automatic updates when you edit your menu",
                "Mobile-friendly layout out of the box",
              ]
          ).map((point) => (
            <div key={point} style={s.valuePt}>
              <span style={s.valuePtIcon}>&#10003;</span>
              <span>{point}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={s.actions}>
        <button
          style={s.continueBtn(!selectedStyle)}
          disabled={!selectedStyle}
          onClick={() => navigateNext(selectedStyle)}
        >
          {selectedStyle
            ? `Continue with ${DESIGN_STYLES.find((entry) => entry.id === selectedStyle)?.name}`
            : "Select a style to continue"}
        </button>

        <button style={s.skipLink} onClick={() => navigateNext(null)}>
          {isUploadLater ? "Save this setup and finish for now" : "Skip for now and keep the basic menu layout"}
        </button>
      </div>
    </div>
  );
}
