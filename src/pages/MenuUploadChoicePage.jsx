import { useEffect, useMemo } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import {
  RESTAURANT_SIGNUP_RESTART_ROUTE,
  navigateWithRestaurantOnboardingState,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
} from "../lib/restaurantOnboardingState.js";

const ROUTES = {
  pdf: "/restaurant/pdf-upload",
  manual: "/restaurant/manual-menu-entry",
  spreadsheet: "/restaurant/spreadsheet-upload",
  ocr: "/restaurant/ocr-upload",
};

const styles = {
  page: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "36px 20px 80px",
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    color: "#111",
  },
  steps: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    marginBottom: 32,
    fontSize: 11,
    fontWeight: 600,
    flexWrap: "wrap",
    rowGap: 8,
  },
  step: (active, done) => ({
    padding: "4px 10px",
    borderRadius: 999,
    background: done ? "#4caf50" : active ? "#F9FAFB" : "transparent",
    color: done ? "#fff" : active ? "#0B0F0C" : "#9CA3AF",
    border: active ? "1.5px solid #0B0F0C" : done ? "1.5px solid #4caf50" : "1.5px solid transparent",
    whiteSpace: "nowrap",
    fontSize: 11,
  }),
  stepDivider: { flex: "0 0 12px", height: 1, background: "#E5E7EB", margin: "0 2px" },
  heading: { fontSize: 28, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.03em" },
  subheading: { fontSize: 15, color: "#555", lineHeight: 1.6, marginBottom: 24 },
  summary: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#fafafa",
    padding: "14px 16px",
    marginBottom: 24,
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    fontSize: 13,
  },
  summaryLabel: { fontWeight: 800, color: "#111", marginRight: 4 },
  grid: { display: "grid", gap: 14 },
  card: {
    border: "1px solid #d7dce5",
    borderRadius: 16,
    padding: "18px 18px 16px",
    background: "#fff",
    cursor: "pointer",
  },
  cardTitle: { fontSize: 16, fontWeight: 800, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 10 },
  cardMeta: { fontSize: 12, color: "#667085", lineHeight: 1.5 },
  error: {
    padding: "12px 16px",
    background: "#fff0f0",
    border: "1px solid #f5c6c6",
    borderRadius: 10,
    fontSize: 13,
    color: "#c00",
    marginBottom: 16,
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
};

const OPTIONS = [
  {
    key: "pdf",
    title: "Upload menu PDF",
    description: "Upload a PDF and continue with the standard Menuply menu ingestion flow.",
    meta: "Best when you already have a finished menu PDF.",
  },
  {
    key: "manual",
    title: "Enter menu manually",
    description: "Type your menu sections, item names, descriptions, and prices directly in a simple form.",
    meta: "Best when you want to add items quickly without preparing a file first.",
  },
  {
    key: "spreadsheet",
    title: "Upload menu spreadsheet",
    description: "Use the CSV template workflow to import structured menu data in bulk.",
    meta: "Best when you already have sections, descriptions, and prices in a spreadsheet.",
  },
  {
    key: "ocr",
    title: "Photograph the menu page (OCR)",
    description:
      "Clear menu photos of printed text and prices work best. This path is for menu pages, not dish photos. PDFs work too.",
    meta: "Camera or gallery: capture menu pages so we can read wording and prices, not plated food.",
  },
];

export default function MenuUploadChoicePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
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

  const state = recovery.state || {};
  const missingState = recovery.missing;

  function handleChoice(choice) {
    navigateWithRestaurantOnboardingState(navigate, ROUTES[choice], {
      ...state,
      ingestion_method: choice,
    });
  }

  if (missingState) {
    return (
      <div style={styles.page}>
        <BrandLogo height={48} radius={14} matchPageBackground={false} />
        <div style={styles.error}>
          <strong>We could not recover your restaurant signup session.</strong><br />
          Restart signup to continue into menu upload.
          <br />
          <Link to={RESTAURANT_SIGNUP_RESTART_ROUTE} style={styles.restartBtn}>
            Restart restaurant signup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <BrandLogo height={48} radius={14} matchPageBackground={false} />

      <div style={styles.steps}>
        <div style={styles.step(false, true)}>1. Account</div>
        <div style={styles.stepDivider} />
        <div style={styles.step(false, true)}>2. Choose plan</div>
        <div style={styles.stepDivider} />
        <div style={styles.step(false, true)}>3. Design</div>
        <div style={styles.stepDivider} />
        <div style={styles.step(true, false)}>4. Upload menu</div>
      </div>

      <div style={styles.heading}>Choose how to add your menu</div>
      <div style={styles.subheading}>
        Choose the fastest way to import your menu. Refresh-safe recovery is enabled here, so your signup session survives page reloads and mobile camera handoffs.
      </div>
      <div style={{
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        background: "#fafafa",
        padding: "14px 16px",
        marginBottom: 24,
        fontSize: 13,
        lineHeight: 1.6,
        color: "#475467",
      }}>
        Upload only menu PDFs, menu photos, and descriptions you are authorized to use for this restaurant.
      </div>

      <div style={styles.summary}>
        <div><span style={styles.summaryLabel}>Restaurant:</span>{state.restaurant_name}</div>
        <div><span style={styles.summaryLabel}>Email:</span>{state.email}</div>
        {state.plan ? <div><span style={styles.summaryLabel}>Plan:</span>{state.plan}</div> : null}
      </div>

      <div style={styles.grid}>
        {OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            style={styles.card}
            onClick={() => handleChoice(option.key)}
          >
            <div style={styles.cardTitle}>{option.title}</div>
            <div style={styles.cardDesc}>{option.description}</div>
            <div style={styles.cardMeta}>{option.meta}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
