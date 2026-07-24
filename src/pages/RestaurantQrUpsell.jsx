/**
 * ============================================================
 * File:    RestaurantQrUpsell.jsx
 * Path:    menubloc-frontend/src/pages/RestaurantQrUpsell.jsx
 * Date:    2026-05-17
 * Purpose:
 *   Onboarding QR upsell step — inserted between plan selection
 *   and menu design selection.
 *
 *   Top section: free downloadable QR assets (PNG + SVG).
 *   Bottom section: optional paid printed sticker upsell.
 *
 *   If qr_token is not passed in location.state (e.g. Stripe
 *   checkout return path), the page attempts QR creation on mount.
 *   QR failure is always non-blocking — operator can skip.
 * ============================================================
 */

import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import {
  navigateWithRestaurantOnboardingState,
  persistRestaurantOnboardingState,
  resolveRestaurantOnboardingState,
} from "../lib/restaurantOnboardingState.js";

const API = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "")
).replace(/\/$/, "");

export default function RestaurantQrUpsell() {
  const { t } = useLanguage();
  const location = useLocation();
  const nav = useNavigate();
  const recovery = resolveRestaurantOnboardingState({
    routeState: location.state,
    search: location.search,
  });
  const state = recovery.state || {};
  const { restaurant_id, email, owner_token, qr_token: initialToken } = state;
  const hasOnboardingContext = Boolean(restaurant_id && email && owner_token);

  const [qrToken, setQrToken] = useState(initialToken || null);
  const [assetsReady, setAssetsReady] = useState(Boolean(initialToken));

  const imageUrl = qrToken ? `${API}/qr/${qrToken}/image` : null;
  const imageSvgUrl = qrToken ? `${API}/qr/${qrToken}/image?format=svg` : null;

  useEffect(() => {
    if (recovery.hasAnyData) {
      persistRestaurantOnboardingState(state);
    }
  }, [recovery.hasAnyData, state]);

  useEffect(() => {
    if (qrToken) {
      setAssetsReady(true);
      return;
    }
    if (!hasOnboardingContext) return;

    (async () => {
      try {
        const res = await fetch(`${API}/owner/qr/primary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurant_id, email, owner_token }),
        });
        const json = await res.json().catch(() => ({}));
        if (json.ok && json.token) {
          setQrToken(json.token);
          setAssetsReady(true);
        }
      } catch {
        // non-blocking — operator can skip regardless
      }
    })();
  }, [qrToken, hasOnboardingContext, restaurant_id, email, owner_token]);

  function goToDesign() {
    navigateWithRestaurantOnboardingState(nav, "/restaurant/design-select", {
      ...state,
      qr_token: qrToken,
    });
  }

  function goToKitOrder() {
    nav("/operator/marketplace", {
      state: {
        restaurant_id,
        qr_token: qrToken,
        from_onboarding: true,
        ...(state.city ? { shipping_city: state.city } : {}),
        ...(state.state ? { shipping_state: state.state } : {}),
      },
    });
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <div style={s.header}>
          <BrandLogo height={48} radius={14} matchPageBackground={false} />
        </div>

        {/* Free assets */}
        <section style={s.freeCard}>
          {hasOnboardingContext ? (
            <>
              <div style={s.checkRow}>
                <span style={s.checkMark}>&#10003;</span>
                <span style={s.freeLabel}>
                  {assetsReady ? "Your QR starter kit is ready." : "We are preparing your QR starter kit."}
                </span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#475467", marginBottom: 18 }}>
                QR codes are direct ordering infrastructure and customer access infrastructure for your restaurant.
              </div>
              {assetsReady ? (
                <div style={s.downloadRow}>
                  <a href={imageUrl} download="menuply-qr.png" style={s.downloadBtn}>
                    Download QR Code (.png)
                  </a>
                  <a href={imageSvgUrl} download="menuply-qr.svg" style={s.downloadBtnOutline}>
                    Download QR Code (.svg)
                  </a>
                </div>
              ) : (
                <div style={s.downloadRow}>
                  <span style={s.preparingText}>Preparing your QR materials&hellip;</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={s.checkRow}>
                <span style={{ ...s.checkMark, background: "#98a2b3" }}>!</span>
                <span style={s.freeLabel}>We could not recover your restaurant onboarding session.</span>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: "#475467", marginBottom: 18 }}>
                Restart restaurant signup or sign in to My Account before continuing with QR setup. Menuply only
                generates QR assets after the restaurant onboarding context is restored.
              </div>
              <div style={s.downloadRow}>
                <Link to="/restaurant/signup" style={s.downloadBtn}>
                  Restart restaurant signup
                </Link>
                <Link to="/operator/login" style={s.downloadBtnOutline}>
                  Sign in to My Account
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Paid upsell */}
        <section style={{ ...s.upsellCard, opacity: hasOnboardingContext ? 1 : 0.72 }}>
          <div style={s.upsellHeading}>Optional QR starter kit</div>
          <div style={s.upsellBody}>
            Use QR placement to give customers faster direct menu and ordering access. Printed materials are optional operational support, not required hardware.
          </div>
          <ul style={s.bulletList}>
            {["Doors & windows", "Counter & pickup area", "Table sets", "Takeout areas"].map(
              (item) => (
                <li key={item} style={s.bulletItem}>
                  <span style={s.bulletMark}>&#10003;</span>
                  <span>{item}</span>
                </li>
              )
            )}
          </ul>
          <button type="button" style={s.ctaBtn} onClick={goToKitOrder} disabled={!hasOnboardingContext}>
            Browse QR merchandise
          </button>
          {hasOnboardingContext ? (
            <button type="button" style={s.skipBtn} onClick={goToDesign}>
              Skip for now &rarr;
            </button>
          ) : null}
        </section>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f6f6f3 0%, #eef5f2 100%)",
    padding: "28px 18px 72px",
    color: "#101828",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  },
  shell: {
    maxWidth: 640,
    margin: "0 auto",
  },
  header: {
    marginBottom: 24,
  },
  freeCard: {
    background: "#ffffff",
    border: "1px solid #d9e0ea",
    borderRadius: 24,
    padding: "22px 24px",
    marginBottom: 18,
    boxShadow: "0 4px 16px rgba(15, 23, 32, 0.04)",
  },
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
  },
  checkMark: {
    flexShrink: 0,
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#1F4E3D",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 900,
  },
  freeLabel: {
    fontSize: 16,
    fontWeight: 700,
    color: "#101828",
  },
  downloadRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  downloadBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 20px",
    borderRadius: 14,
    background: "#1F4E3D",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  },
  downloadBtnOutline: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 20px",
    borderRadius: 14,
    background: "#ffffff",
    color: "#1F4E3D",
    border: "1.5px solid #1F4E3D",
    fontSize: 14,
    fontWeight: 800,
    textDecoration: "none",
    fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  },
  preparingText: {
    fontSize: 14,
    color: "#667085",
  },
  upsellCard: {
    background: "#ffffff",
    border: "1px solid #d9e0ea",
    borderRadius: 24,
    padding: "24px 24px 22px",
    boxShadow: "0 4px 16px rgba(15, 23, 32, 0.04)",
  },
  upsellHeading: {
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "-0.02em",
    marginBottom: 10,
    color: "#101828",
  },
  upsellBody: {
    fontSize: 15,
    lineHeight: 1.6,
    color: "#475467",
    marginBottom: 18,
  },
  bulletList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 22px",
    display: "grid",
    gap: 10,
  },
  bulletItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    fontSize: 15,
  },
  bulletMark: {
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#1F4E3D",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 900,
  },
  ctaBtn: {
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    border: "1px solid #1F4E3D",
    background: "#1F4E3D",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
    marginBottom: 12,
    boxShadow: "0 12px 24px rgba(31, 78, 61, 0.18)",
  },
  skipBtn: {
    width: "100%",
    minHeight: 44,
    borderRadius: 16,
    border: "none",
    background: "transparent",
    color: "#667085",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "center",
  },
};
