/**
 * Full-screen billboard entrance for restaurant profiles.
 * Carousel of up to 6 ordered slides.
 *
 * Reload-safe: never paint dark overlay / dark art until the DOM image has
 * actually decoded. Cached images used to mount the splash instantly with a
 * heavy dark scrim — reading as a black screen before the truck photo settled.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CLAIMED_BILLBOARD_SPLASH_MS,
  CLAIMED_BILLBOARD_SPLASH_REDUCED_MS,
  CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS,
  CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES,
  CLAIMED_BILLBOARD_SPLASH_SHELL_BG,
  pickClaimedBillboardSplashPost,
  pickClaimedBillboardSplashPosts,
  prefetchBillboardSplashImages,
  waitForBillboardSplashImage,
  resolveSplashDurationMs,
} from "../../lib/claimedRestaurantBillboardSplash.js";
import { resolveBillboardDisplayImageUrl, resolveBillboardImageObjectPosition } from "../../lib/billboardImageObjectPosition.js";
import { resolveBillboardMediaUrl } from "../../lib/billboardMediaUrl.js";

export {
  CLAIMED_BILLBOARD_SPLASH_MS,
  CLAIMED_BILLBOARD_SPLASH_REDUCED_MS,
  CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS,
  CLAIMED_BILLBOARD_SPLASH_MAX_SLIDES,
  CLAIMED_BILLBOARD_SPLASH_SHELL_BG,
  pickClaimedBillboardSplashPost,
  pickClaimedBillboardSplashPosts,
  prefetchBillboardSplashImages,
  waitForBillboardSplashImage,
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
  const rawImageUrl = String(current?.image_url || current?.photo_url || "").trim();
  const imageUrl = resolveBillboardMediaUrl(
    resolveBillboardDisplayImageUrl(rawImageUrl || current, { narrow: isNarrow })
  );
  const headline = String(current?.headline_override || current?.title || "").trim();
  const sub = String(current?.subheadline_override || "").trim();
  const alt = String(current?.image_alt_text || headline || displayName).trim();
  const ctaLabel = String(current?.cta_label || "").trim();
  const ctaUrl = String(current?.cta_url || "").trim();
  const imageFitRaw = String(current?.image_fit || "").trim().toLowerCase();
  // Prefer cover on entrance so letterboxed bars never dominate the viewport.
  const imageFit = ["cover", "contain", "fill"].includes(imageFitRaw)
    ? (imageFitRaw === "contain" ? "cover" : imageFitRaw)
    : "cover";
  const imageObjectPosition = resolveBillboardImageObjectPosition(current, { narrow: isNarrow });
  const ariaLabel = [displayName, headline].filter(Boolean).join(". ");
  const dismissedRef = useRef(false);
  const imageRef = useRef(null);
  // Headline-only slides are ready immediately; image slides wait for DOM decode.
  const [imagePainted, setImagePainted] = useState(!imageUrl);

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onDismiss?.();
  }

  function markImagePainted() {
    setImagePainted(true);
  }

  useEffect(() => {
    setIndex(0);
  }, [slideList.map((p) => p?.id).join("|")]);

  // Reset paint gate per slide / URL; detect already-decoded cached bitmaps.
  useEffect(() => {
    if (!imageUrl) {
      setImagePainted(true);
      return undefined;
    }
    setImagePainted(false);
    let cancelled = false;
    const raf = window.requestAnimationFrame(() => {
      const img = imageRef.current;
      if (!img) return;
      if (img.complete && img.naturalWidth > 0) {
        if (typeof img.decode === "function") {
          img
            .decode()
            .then(() => {
              if (!cancelled) markImagePainted();
            })
            .catch(() => {
              if (!cancelled) markImagePainted();
            });
        } else {
          markImagePainted();
        }
      }
    });
    // Fail-open: never leave cream forever if onLoad is swallowed.
    const failOpen = window.setTimeout(() => {
      if (!cancelled) markImagePainted();
    }, CLAIMED_BILLBOARD_SPLASH_IMAGE_WAIT_MS);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(failOpen);
    };
  }, [imageUrl, index]);

  // Hold only after the slide is actually painted (cream → art, never black void).
  useEffect(() => {
    if (!current || !imagePainted) return undefined;
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
  }, [imagePainted, reducedMotion, index, current, slideList.length]);

  if (!current) return null;

  return (
    <div
      role="presentation"
      aria-label={ariaLabel || displayName}
      onClick={() => dismiss()}
      data-testid="claimed-billboard-splash"
      data-image-painted={imagePainted ? "true" : "false"}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 12000,
        minHeight: "100vh",
        width: "100%",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        overflow: "hidden",
        background: CLAIMED_BILLBOARD_SPLASH_SHELL_BG,
        fontFamily: "var(--font-ui, ui-sans-serif, system-ui, sans-serif)",
        textAlign: "left",
        color: "#1c1917",
        cursor: "pointer",
      }}
    >
      {imageUrl ? (
        <img
          ref={imageRef}
          src={imageUrl}
          alt={alt}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          onLoad={markImagePainted}
          onError={markImagePainted}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: imageFit,
            objectPosition: imageObjectPosition,
            display: "block",
            pointerEvents: "none",
            // Stay invisible until decoded so dark truck photos never flash as a black frame.
            opacity: imagePainted ? 1 : 0,
            background: CLAIMED_BILLBOARD_SPLASH_SHELL_BG,
            transition: reducedMotion ? "none" : "opacity 160ms ease",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(160deg, #ecfdf5 0%, #f2f1ec 55%, #d1fae5 100%)",
          }}
        />
      )}

      {/* Soft scrim only after art is visible — never a full-screen dark sheet over empty cream. */}
      {imagePainted ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: imageUrl
              ? "linear-gradient(to top, rgba(28,25,23,0.55) 0%, rgba(28,25,23,0.12) 38%, rgba(28,25,23,0) 70%)"
              : "linear-gradient(to top, rgba(28,25,23,0.28) 0%, transparent 55%)",
            pointerEvents: "none",
          }}
        />
      ) : null}

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 720,
          padding: isNarrow ? "20px 16px 28px" : "28px 24px 40px",
          boxSizing: "border-box",
          // Hide chrome until art paints so reload doesn't show white text on cream then jump.
          opacity: imagePainted ? 1 : 0,
          transition: reducedMotion ? "none" : "opacity 160ms ease",
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
                  background: i === index ? "#86efac" : "rgba(250,250,249,0.45)",
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
            color: "rgba(250,250,249,0.78)",
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
              color: "#fafaf9",
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
              color: "rgba(28,25,23,0.72)",
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
              color: "rgba(250,250,249,0.7)",
            }}
          >
            Tap to continue
          </p>
        </div>
      </div>
    </div>
  );
}
