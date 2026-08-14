/**
 * Compact in-page Windows section below the hero (formerly Billboard).
 * Shows up to 4 active creatives as a single-photo carousel with ‹ › arrows
 * (same page-turn pattern as the Yellow Browser / BrowseMenus overlay).
 * Entrance splash remains separate (ClaimedRestaurantBillboardSplash).
 */
import { useEffect, useState } from "react";
import { isActiveBillboardSplashPost } from "../../../lib/claimedRestaurantBillboardSplash.js";
import {
  PROFILE_INK,
  PROFILE_MUTED,
  profileCardBorderVar,
  ProfileSectionBlank,
} from "./profilePrimitives.jsx";

const WINDOWS_MAX_SLIDES = 4;

function postImage(post) {
  return String(post?.image_url || post?.photo_url || "").trim();
}

function postTitle(post) {
  return String(post?.title || post?.headline || post?.cta_text || "").trim();
}

function postBody(post) {
  return String(post?.body || post?.description || post?.message || "").trim();
}

function arrowButtonStyle(side, disabled) {
  return {
    position: "absolute",
    [side]: 4,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    width: 36,
    height: 56,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.35)",
    background: disabled ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 22,
    fontWeight: 900,
    cursor: disabled ? "default" : "pointer",
    lineHeight: 1,
    padding: 0,
    opacity: disabled ? 0.45 : 1,
  };
}

export default function ProfileBillboardBlock({
  billboardPreview = [],
  isMobile = false,
  showClaimInvites = false,
}) {
  const posts = (Array.isArray(billboardPreview) ? billboardPreview : [])
    .filter((p) => isActiveBillboardSplashPost(p) && (postImage(p) || postTitle(p) || postBody(p)))
    .slice(0, WINDOWS_MAX_SLIDES);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [posts.map((p) => p?.id || postImage(p)).join("|")]);

  if (!posts.length && !showClaimInvites) return null;

  const safeIndex = posts.length ? Math.min(index, posts.length - 1) : 0;
  const current = posts[safeIndex] || null;
  const img = current ? postImage(current) : "";
  const title = current ? postTitle(current) : "";
  const body = current ? postBody(current) : "";
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < posts.length - 1;
  const showArrows = posts.length > 1;

  return (
    <section
      data-testid="profile-billboard-block"
      data-section="windows"
      aria-label="Windows"
      style={{ marginBottom: isMobile ? 20 : 28 }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 0.4,
          color: PROFILE_INK,
          marginBottom: 12,
        }}
      >
        Windows
      </div>
      {!posts.length ? (
        <ProfileSectionBlank
          testId="profile-billboard-blank"
          message="No Windows yet."
        />
      ) : (
        <article
          data-testid="profile-billboard-card"
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${profileCardBorderVar}`,
            background: "#fff",
          }}
        >
          <div style={{ position: "relative" }}>
            {img ? (
              <img
                key={current?.id || img || safeIndex}
                src={img}
                alt={title || `Window ${safeIndex + 1}`}
                loading="eager"
                style={{
                  width: "100%",
                  height: isMobile ? 160 : 200,
                  objectFit: "cover",
                  display: "block",
                  background: "#e7e5e4",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: isMobile ? 160 : 200,
                  background: "linear-gradient(160deg, #f5f5f4 0%, #e7e5e4 100%)",
                }}
                aria-hidden
              />
            )}

            {showArrows ? (
              <>
                <button
                  type="button"
                  aria-label="Previous window"
                  disabled={!hasPrev}
                  onClick={() => {
                    if (!hasPrev) return;
                    setIndex((i) => Math.max(0, i - 1));
                  }}
                  style={arrowButtonStyle("left", !hasPrev)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next window"
                  disabled={!hasNext}
                  onClick={() => {
                    if (!hasNext) return;
                    setIndex((i) => Math.min(posts.length - 1, i + 1));
                  }}
                  style={arrowButtonStyle("right", !hasNext)}
                >
                  ›
                </button>
                <div
                  aria-live="polite"
                  style={{
                    position: "absolute",
                    right: 10,
                    bottom: 8,
                    zIndex: 2,
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "rgba(0,0,0,0.45)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.02,
                  }}
                >
                  {safeIndex + 1} / {posts.length}
                </div>
              </>
            ) : null}
          </div>

          {(title || body) && (
            <div style={{ padding: isMobile ? "12px 14px" : "14px 16px" }}>
              {title ? (
                <div style={{ fontSize: 16, fontWeight: 800, color: PROFILE_INK, lineHeight: 1.3 }}>
                  {title}
                </div>
              ) : null}
              {body ? (
                <div
                  style={{
                    marginTop: title ? 6 : 0,
                    fontSize: 14,
                    color: PROFILE_MUTED,
                    lineHeight: 1.45,
                  }}
                >
                  {body}
                </div>
              ) : null}
            </div>
          )}
        </article>
      )}
    </section>
  );
}
