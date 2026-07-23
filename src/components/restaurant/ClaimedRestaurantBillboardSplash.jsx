/**
 * Full-screen billboard entrance for restaurant profiles.
 * Carousel of up to 6 ordered slides; each holds for its display_duration_ms
 * after the image is visible. Mobile-safe contain fit by default.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CLAIMED_BILLBOARD_SPLASH_MS,
  CLAIMED_BILLBOARD_SPLASH_REDUCED_MS,
  CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS,
  CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES,
  pickClaimedBillboardSplashPost,
  pickClaimedBillboardSplashPosts,
  resolveSplashDurationMs,
} from "../../lib/claimedRestaurantBillboardSplash.js";

export {
  CLAIMED_BILLBOARD_SPLASH_MS,
  CLAIMED_BILLBOARD_SPLASH_REDUCED_MS,
  CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS,
  CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES,
  pickClaimedBillboardSplashPost,
  pickClaimedBillboardSplashPosts,
  resolveSplashDurationMs,
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

function useIsNarrow(breakpoint = 640) {
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const apply = () => setNarrow(Boolean(mq.matches));
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, [breakpoint]);
  return narrow;
}

/**
 * @param {{
 *   restaurantName?: string,
 *   post?: object,
 *   posts?: object[],
 *   onDismiss?: () => void,
 * }} props
 */
export default function ClaimedRestaurantBillboardSplash({
  restaurantName = "",
  post,
  posts,
  onDismiss,
}) {
  const reducedMotion = usePrefersReducedMotion();
  const isNarrow = useIsNarrow();
  const displayName = String(restaurantName || "").trim() || "Restaurant";
  const slideList = (() => {
    if (Array.isArray(posts) && posts.length) {
      return pickClaimedBillboardSplashPosts(posts, { limit: CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES });
    }
    if (post) return [post];
    return [];
  })();
  const [index, setIndex] = useState(0);
  const current = slideList[Math.min(index, Math.max(0, slideList.length - 1))] || null;
  const imageUrl = String(current?.image_url || current?.photo_url || "").trim();
  const headline = String(current?.headline_override || current?.title || "").trim();
  const sub = String(current?.subheadline_override || "").trim();
  const alt = String(current?.image_alt_text || headline || displayName).trim();
  const ctaLabel = String(current?.cta_label || "").trim();
  const ctaUrl = String(current?.cta_url || "").trim();
  const imageFitRaw = String(current?.image_fit || "").trim().toLowerCase();
  const imageFit = ["cover", "contain", "fill"].includes(imageFitRaw)
    ? imageFitRaw
    : (isNarrow ? "contain" : "contain");
  const ariaLabel = [displayName, headline].filter(Boolean).join(". ");
  const [imageReady, setImageReady] = useState(!imageUrl);
  const dismissedRef = useRef(false);

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onDismiss?.();
  }

  useEffect(() => {
    setIndex(0);
  }, [slideList.map((p) => p?.id).join("|")]);

  useEffect(() => {
    if (!imageUrl) {
      setImageReady(true);
      return undefined;
    }
    setImageReady(false);
    const maxWait = window.setTimeout(() => setImageReady(true), CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS);
    return () => window.clearTimeout(maxWait);
  }, [imageUrl, index]);

  useEffect(() => {
    if (!imageReady || !current) return undefined;
    const holdMs = resolveSplashDurationMs(current, { reducedMotion });
    const timer = window.setTimeout(() => {
      if (index < slideList.length - 1) {
        setIndex((i) => i + 1);
        return;
      }
      dismiss();
    }, holdMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageReady, reducedMotion, index, current, slideList.length]);

  if (!current) return null;

  return (
    <div
      role="presentation"
      aria-label={ariaLabel || displayName}
      onClick={() => dismiss()}
      style={{
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
        overflow: "hidden",
        background: "#0b0b0f",
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        textAlign: "left",
        color: "#f8fafc",
        cursor: "pointer",
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={() => setImageReady(true)}
          onError={() => setImageReady(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: imageFit,
            objectPosition: "center",
            display: "block",
            pointerEvents: "none",
            opacity: imageReady ? 1 : 0.12,
            transition: reducedMotion ? "none" : "opacity 220ms ease",
            background: "#0b0b0f",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(160deg, #111827 0%, #0f172a 55%, #14532d 100%)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: imageUrl
            ? "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.22) 42%, rgba(0,0,0,0.06) 100%)"
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
          padding: isNarrow ? "20px 16px 28px" : "28px 24px 40px",
          boxSizing: "border-box",
        }}
      >
        {slideList.length > 1 ? (
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 14,
              alignItems: "center",
            }}
            aria-hidden
          >
            {slideList.map((p, i) => (
              <span
                key={p.id || i}
                style={{
                  width: i === index ? 18 : 8,
                  height: 8,
                  borderRadius: 999,
                  background: i === index ? "#86efac" : "rgba(248,250,252,0.35)",
                  transition: reducedMotion ? "none" : "width 180ms ease",
                }}
              />
            ))}
          </div>
        ) : null}

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
              fontSize: isNarrow ? "clamp(1.45rem, 7vw, 2.25rem)" : "clamp(1.75rem, 6vw, 3rem)",
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

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18, alignItems: "center" }}>
          {ctaUrl ? (
            <Link
              to={ctaUrl}
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 40,
                padding: "0 14px",
                borderRadius: 10,
                background: "#86efac",
                color: "#052e16",
                fontWeight: 800,
                fontSize: 13,
                textDecoration: "none",
              }}
            >
              {ctaLabel || "View offer"}
            </Link>
          ) : null}
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(248,250,252,0.55)",
            }}
          >
            Tap to continue
          </p>
        </div>
      </div>
    </div>
  );
}
