import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import {
  resolveRestaurantOnboardingState,
  navigateWithRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';

const STEPS = [
  "Reading your menu...",
  "Organizing sections...",
  "Matching your prices...",
  "Putting items together...",
  "Almost ready...",
];

export default function RestaurantOnboardingProcessing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: onboarding } = resolveRestaurantOnboardingState({
    routeState: location.state,
    search: location.search,
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next >= STEPS.length) {
          clearInterval(intervalRef.current);
          setDone(true);
          return prev;
        }
        return next;
      });
    }, 900);
    return () => clearInterval(intervalRef.current);
  }, []);

  async function handleContinue() {
    if (onboarding?.restaurant_id) {
      await syncRestaurantOnboardingProgress(onboarding, {
        current_step_key: "review_menu",
        completed_step_keys: ["account_created", "email_verified", "import_menu", "process_menu"],
      }).catch(() => {});
    }
    navigateWithRestaurantOnboardingState(navigate, "/operator/menulab", onboarding);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      fontFamily: FONT,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <style>{`
        @keyframes menuply-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ maxWidth: 440, width: "100%", padding: "0 24px", textAlign: "center" }}>
        <BrandLogo
          height={40}
          radius={12}
          matchPageBackground={false}
          linkStyle={{ display: "inline-block", marginBottom: 48 }}
        />

        {!done ? (
          <>
            <div style={{
              width: 48, height: 48,
              borderRadius: "50%",
              border: "3px solid #1F4E3D",
              borderTopColor: "transparent",
              animation: "menuply-spin 0.8s linear infinite",
              margin: "0 auto 32px",
            }} />
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0B0F0C", marginBottom: 12 }}>
              Preparing Your Menu
            </h2>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.65 }}>
              {STEPS[stepIndex]}
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: 48, height: 48,
              borderRadius: "50%",
              background: "#1F4E3D",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 900,
              margin: "0 auto 32px",
            }}>
              &#10003;
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0B0F0C", marginBottom: 12 }}>
              Your menu is ready to review
            </h2>
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.65, marginBottom: 32 }}>
              We've organized your menu items. Take a look and publish when everything looks good.
            </p>
            <button
              onClick={handleContinue}
              style={{
                width: "100%", height: 50, borderRadius: 12,
                border: 0, background: "#1F4E3D", color: "#fff",
                fontSize: 15, fontWeight: 900, cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              Review Menu
            </button>
          </>
        )}
      </div>
    </div>
  );
}
