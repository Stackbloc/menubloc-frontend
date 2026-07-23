/**
 * Full-screen billboard entrance for claimed restaurant profiles.
 * Shows the active deal billboard graphic (or headline fallback) before the
 * editorial profile. Timed handoff / dismiss is owned by the parent.
 */
import { useEffect, useState } from "react";
import {
  CLAIMED_BILLBOARD_SPLASH_MS,
  CLAIMED_BILLBOARD_SPLASH_REDUCED_MS,
  pickClaimedBillboardSplashPost,
} from "../../lib/claimedRestaurantBillboardSplash.js";

export {
  CLAIMED_BILLBOARD_SPLASH_MS,
  CLAIMED_BILLBOARD_SPLASH_REDUCED_MS,
  pickClaimedBillboardSplashPost,
};

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
 * @param {{
 *   restaurantName?: string,
 *   post: object,
 *   onDismiss?: () => void,
 * }} props
 */
export default function ClaimedRestaurantBillboardSplash({
  restaurantName = "",
  post,
  onDismiss,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const displayName = String(restaurantName || "").trim() || "Restaurant";
  const imageUrl = String(post?.image_url || post?.photo_url || "").trim();
  const headline = String(post?.headline_override || post?.title || "").trim();
  const sub = String(post?.subheadline_override || "").trim();
  const alt = String(post?.image_alt_text || headline || displayName).trim();
  const ariaLabel = [displayName, headline].filter(Boolean).join(". ");

  return (
    <button
      type="button"
      role="presentation"
      aria-label={ariaLabel || displayName}
      onClick={() => onDismiss?.()}
      style={{
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        padding: 0,
        border: "none",
        cursor: "pointer",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
        overflow: "hidden",
        background: imageUrl
          ? "#0b0b0f"
          : "linear-gradient(160deg, #111827 0%, #0f172a 55%, #14532d 100%)",
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        textAlign: "left",
        color: "#f8fafc",
        opacity: 1,
        transition: reducedMotion ? "none" : "opacity 280ms ease",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="eager"
          decoding="async"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: post?.image_fit || "cover",
            display: "block",
            pointerEvents: "none",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: imageUrl
            ? "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0.08) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 720,
          padding: "28px 24px 40px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(248,250,252,0.72)",
            marginBottom: 10,
          }}
        >
          {displayName}
        </div>
        {headline ? (
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(1.75rem, 6vw, 3rem)",
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#f8fafc",
              wordBreak: "break-word",
            }}
          >
            {headline}
          </h1>
        ) : null}
        {sub && !imageUrl ? (
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "clamp(0.95rem, 2.2vw, 1.1rem)",
              lineHeight: 1.45,
              color: "rgba(248,250,252,0.78)",
              maxWidth: "36ch",
            }}
          >
            {sub}
          </p>
        ) : null}
        <p
          style={{
            margin: "18px 0 0",
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(248,250,252,0.55)",
          }}
        >
          Tap to continue
        </p>
      </div>
    </button>
  );
}
