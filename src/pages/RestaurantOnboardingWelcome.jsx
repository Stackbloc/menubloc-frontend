import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import {
  resolveRestaurantOnboardingState,
  navigateWithRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';

const STEPS = [
  {
    label: "Import your menu",
    detail: "PDF, photos, website URL, or paste your menu text",
  },
  {
    label: "Review extracted data",
    detail: "Confirm items, sections, and prices look right",
  },
  {
    label: "Publish your menu",
    detail: "Your menu goes live and diners can find you on Menuply",
  },
];

export default function RestaurantOnboardingWelcome() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: onboarding } = resolveRestaurantOnboardingState({
    routeState: location.state,
    search: location.search,
  });

  const restaurantName = onboarding?.restaurant_name || "your restaurant";

  useEffect(() => {
    if (!onboarding?.restaurant_id) return;
    syncRestaurantOnboardingProgress(onboarding, {
      current_step_key: "import_menu",
      completed_step_keys: ["account_created", "email_verified"],
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStart() {
    navigateWithRestaurantOnboardingState(navigate, "/restaurant/menu-upload-choice", onboarding);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
        <BrandLogo
          height={44}
          radius={12}
          matchPageBackground={false}
          linkStyle={{ display: "block", marginBottom: 40 }}
        />

        <div style={{
          fontSize: 11, fontWeight: 800, color: "#1F4E3D",
          letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10,
        }}>
          Welcome to Menuply
        </div>

        <h1 style={{
          fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          color: "#0B0F0C",
          lineHeight: 1.1,
          marginBottom: 12,
        }}>
          {restaurantName}
        </h1>

        <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.65, marginBottom: 36 }}>
          We'll help you build and publish your digital menu in just a few steps.
        </p>

        <div style={{
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: 16,
          padding: "22px 22px 18px",
          marginBottom: 36,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 800, color: "#6B7280",
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18,
          }}>
            Today's objectives
          </div>

          {STEPS.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: 14, marginBottom: i < STEPS.length - 1 ? 16 : 0 }}>
              <div style={{
                flexShrink: 0,
                width: 26, height: 26,
                borderRadius: "50%",
                background: "#1F4E3D",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900,
                marginTop: 1,
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#0B0F0C", marginBottom: 2 }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
                  {step.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 28 }}>
          Estimated setup time: <strong style={{ color: "#6B7280" }}>5–10 minutes</strong>
        </div>

        <button
          onClick={handleStart}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 14,
            border: 0,
            background: "#1F4E3D",
            color: "#fff",
            fontSize: 16,
            fontWeight: 900,
            cursor: "pointer",
            fontFamily: FONT,
            letterSpacing: "-0.01em",
          }}
        >
          Let's Get Started
        </button>
      </div>
    </div>
  );
}
