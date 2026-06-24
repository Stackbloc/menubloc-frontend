/**
 * RestaurantFoundersSignup.jsx
 * Lightweight 3-step signup flow for out-of-market restaurants arriving
 * from the national rollout landing page.
 *
 * Route: /restaurant/join
 *
 * Step 1 — Philosophy: brief value alignment + checkbox
 * Step 2 — FAQ:        collapsible answers before account creation
 * Step 3 — Account:    minimal form → email verification → plan selection
 *
 * ── Market detection (priority order) ────────────────────────────────────────
 * 1. Backend lookup via GET /api/markets/signup-flow (authoritative)
 *    — called with query params if present, otherwise with geo coords after reverse geocode
 * 2. Browser geolocation (async, non-blocking)
 *    — reverse-geocoded and fed into the backend lookup
 * 3. Local config fallback (activeMarkets.js)
 *    — used when backend is unreachable
 * 4. Default to founders flow when uncertain
 *
 * Redirect to /restaurant/signup fires only if:
 *   - Backend (or fallback) returns flow = "full"
 *   - User is still on Step 1 (never interrupts mid-flow)
 *
 * Signup is never blocked regardless of detection result.
 * See docs/onboarding-architecture.md for full rules.
 */

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo.jsx";
import FoundersProgressBar from "../components/founders/FoundersProgressBar.jsx";
import FoundersIntroStep from "../components/founders/FoundersIntroStep.jsx";
import FoundersFaqStep from "../components/founders/FoundersFaqStep.jsx";
import FoundersAccountStep from "../components/founders/FoundersAccountStep.jsx";
import { fetchSignupFlow } from "../config/activeMarkets.js";
import { reverseGeocode } from "../lib/locationUtils.js";
import { useFoundersSignupFlow } from "../hooks/useFoundersSignupFlow.js";

const FULL_SIGNUP_ROUTE = "/restaurant/signup";

export default function RestaurantFoundersSignup() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Optional location hints from the landing page CTA.
  // Passed to the backend lookup — not used as standalone decision criteria.
  const urlCity  = searchParams.get("city")  || "";
  const urlState = searchParams.get("state") || "";

  const [step, setStep] = useState(1);
  const marketChecked = useRef(false);

  const flow = useFoundersSignupFlow({ urlCity, urlState });

  /**
   * Redirect to the full signup flow if the market lookup says "full".
   * Only fires while the user is on Step 1. Step 2+ is never interrupted.
   */
  function maybeRedirect(signupFlow, currentStep) {
    if (signupFlow === "full") {
      setStep((s) => {
        if (s === 1) navigate(FULL_SIGNUP_ROUTE, { replace: true });
        return s;
      });
    }
  }

  // ── Primary market check: backend lookup with URL params ──────────────────
  // Fires once on mount. Uses the backend as authoritative source; falls back
  // to local config if the backend is unreachable.
  useEffect(() => {
    if (marketChecked.current) return;
    marketChecked.current = true;

    let cancelled = false;

    async function checkMarket() {
      // If we have explicit city+state from the URL, run the backend lookup now.
      // If not, we rely on geolocation (below) to provide the location.
      if (urlCity || urlState) {
        const result = await fetchSignupFlow({ city: urlCity, state: urlState });
        if (!cancelled) maybeRedirect(result.flow, step);
        return;
      }

      // No URL params — try geolocation as the location source.
      if (!navigator?.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          if (cancelled) return;
          try {
            const { city, state } = await reverseGeocode(coords.latitude, coords.longitude);
            if (cancelled || !city || !state) return;
            const result = await fetchSignupFlow({ city, state });
            if (!cancelled) maybeRedirect(result.flow, step);
          } catch {
            // Reverse geocode failure — stay in founders flow.
          }
        },
        () => {
          // Geolocation permission denied or timed out — stay in founders flow.
        },
        { timeout: 6000, maximumAge: 300000 }
      );
    }

    checkMarket();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <BrandLogo height={48} radius={14} matchPageBackground={false} />

        <FoundersProgressBar step={step} />

        {step === 1 ? (
          <FoundersIntroStep onContinue={() => setStep(2)} />
        ) : null}

        {step === 2 ? (
          <FoundersFaqStep
            onContinue={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        ) : null}

        {step === 3 ? (
          <FoundersAccountStep
            onBack={() => setStep(2)}
            form={flow.form}
            agreements={flow.agreements}
            fieldErrors={flow.fieldErrors}
            serverError={flow.serverError}
            serverErrorDetail={flow.serverErrorDetail}
            submitting={flow.submitting}
            onChange={flow.handleChange}
            onAgreementChange={flow.handleAgreementChange}
            onSubmit={flow.handleSubmit}
          />
        ) : null}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f9f9f7 0%, #eef5f2 100%)",
  padding: "40px 20px 80px",
  fontFamily: '"Instrument Sans", "Avenir Next", system-ui, sans-serif',
  color: "#101828",
};

const shellStyle = {
  maxWidth: 660,
  margin: "0 auto",
};
