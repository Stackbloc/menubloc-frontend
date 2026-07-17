/**
 * Full-screen brand entrance for unclaimed restaurant profiles.
 * Name dominates; secondary line previews billboard real estate after claim.
 * Timed handoff to UnclaimedRestaurantPage is owned by the parent.
 */
import { useEffect, useState } from "react";

export const UNCLAIMED_BRAND_SPLASH_MS = 2000;
export const UNCLAIMED_BRAND_SPLASH_MESSAGE = "Your Billboard Goes Here";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(Boolean(mq.matches));
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);
  return reduced;
}

/**
 * @param {{ name: string, isDark?: boolean }} props
 */
export default function UnclaimedRestaurantBrandSplash({ name, isDark = false }) {
  const reducedMotion = usePrefersReducedMotion();
  const displayName = String(name || "").trim() || "Restaurant";
  const pageBg = isDark ? "#0b0b0f" : "#ffffff";
  const nameColor = isDark ? "#f8fafc" : "#0f172a";
  const messageColor = isDark ? "rgba(255,255,255,0.62)" : "#64748b";

  return (
    <div
      role="presentation"
      aria-label={`${displayName}. ${UNCLAIMED_BRAND_SPLASH_MESSAGE}`}
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        background: pageBg,
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        textAlign: "center",
        opacity: 1,
        transition: reducedMotion ? "none" : "opacity 280ms ease",
      }}
    >
      <h1
        style={{
          margin: 0,
          maxWidth: "18ch",
          width: "100%",
          fontSize: "clamp(2.4rem, 9vw, 4.75rem)",
          lineHeight: 1.05,
          fontWeight: 900,
          letterSpacing: "-0.03em",
          color: nameColor,
          wordBreak: "break-word",
        }}
      >
        {displayName}
      </h1>
      <p
        style={{
          margin: "22px 0 0",
          maxWidth: "28ch",
          fontSize: "clamp(0.95rem, 2.4vw, 1.125rem)",
          lineHeight: 1.45,
          fontWeight: 500,
          letterSpacing: "0.01em",
          color: messageColor,
        }}
      >
        {UNCLAIMED_BRAND_SPLASH_MESSAGE}
      </p>
    </div>
  );
}
