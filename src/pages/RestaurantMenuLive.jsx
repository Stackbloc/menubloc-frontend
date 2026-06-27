import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import { useOperator } from "../context/OperatorContext.jsx";
import {
  resolveRestaurantOnboardingState,
  syncRestaurantOnboardingProgress,
} from "../lib/restaurantOnboardingState.js";

const FONT = '"Instrument Sans", "Avenir Next", system-ui, sans-serif';

export default function RestaurantMenuLive() {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurants } = useOperator();
  const { state: onboarding } = resolveRestaurantOnboardingState({
    routeState: location.state,
    search: location.search,
  });

  const restaurantName =
    onboarding?.restaurant_name ||
    restaurants?.[0]?.restaurant_name ||
    "your restaurant";

  const restaurantId =
    onboarding?.restaurant_id ||
    restaurants?.[0]?.id;

  const menuUrl = restaurantId ? `/public/restaurants/${restaurantId}/menu` : null;

  useEffect(() => {
    if (!onboarding?.restaurant_id) return;
    syncRestaurantOnboardingProgress(onboarding, {
      current_step_key: "menu_live",
      completed_step_keys: [
        "account_created", "email_verified", "import_menu",
        "process_menu", "review_menu", "publish_menu",
      ],
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px" }}>
        <BrandLogo
          height={44}
          radius={12}
          matchPageBackground={false}
          linkStyle={{ display: "block", marginBottom: 48 }}
        />

        <div style={{
          width: 52, height: 52,
          borderRadius: "50%",
          background: "#1F4E3D",
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 900,
          marginBottom: 24,
        }}>
          &#10003;
        </div>

        <h1 style={{
          fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          color: "#0B0F0C",
          lineHeight: 1.1,
          marginBottom: 12,
        }}>
          Your menu is now live!
        </h1>

        <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.65, marginBottom: 40 }}>
          {restaurantName} is published on Menuply. Diners can now find your menu.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          {menuUrl && (
            <a
              href={menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                height: 50, borderRadius: 12,
                background: "#1F4E3D", color: "#fff",
                fontSize: 15, fontWeight: 800,
                textDecoration: "none", fontFamily: FONT,
              }}
            >
              View Menu
            </a>
          )}

          {menuUrl && (
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}${menuUrl}`;
                if (navigator.share) {
                  navigator.share({ title: restaurantName, url: shareUrl }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(shareUrl).catch(() => {});
                }
              }}
              style={outlineBtn}
            >
              Share Menu
            </button>
          )}

          <button
            onClick={() => navigate("/operator/qr-stickers")}
            style={outlineBtn}
          >
            Download QR Code
          </button>

          <button
            onClick={() => navigate("/restaurant/design-select", { state: location.state })}
            style={outlineBtn}
          >
            Customize Menu
          </button>

          <button
            onClick={() => navigate("/operator")}
            style={outlineBtn}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

const outlineBtn = {
  width: "100%", height: 50, borderRadius: 12,
  border: "1px solid #E5E7EB",
  background: "#fff", color: "#0B0F0C",
  fontSize: 15, fontWeight: 800,
  cursor: "pointer", fontFamily: FONT,
};
