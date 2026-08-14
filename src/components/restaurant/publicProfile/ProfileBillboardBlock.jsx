/**
 * Compact in-page Windows section below the hero.
 * Food-offer photos only (not brand splash/hero billboard art), unless the
 * temporary In-N-Out exception applies. Section is omitted when empty.
 * Photos only — no title/body caption under the frame.
 * Up to 4 slides with Yellow Browser–style ‹ › arrows.
 */
import { useEffect, useState } from "react";
import { pickWindowsPosts } from "../../../lib/profileWindows.js";
import { resolveBillboardImageObjectPosition } from "../../../lib/billboardImageObjectPosition.js";
import {
  normalizeWindowsPhotoOrientation,
  windowsFrameAspectRatio,
} from "../../../lib/windowsPhotoOrientation.js";
import { PROFILE_INK, profileCardBorderVar } from "./profilePrimitives.jsx";

function postImage(post) {
  return String(post?.image_url || post?.photo_url || "").trim();
}

function arrowButtonStyle(side, disabled) {
  return {
    position: "absolute",
    [side]: 2,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    width: 22,
    height: 32,
    borderRadius: 6,
    border: "1px solid rgba(255,255,255,0.35)",
    background: disabled ? "rgba(0,0,0,0.28)" : "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: disabled ? "default" : "pointer",
    lineHeight: 1,
    padding: 0,
    opacity: disabled ? 0.45 : 1,
  };
}

export default function ProfileBillboardBlock({
  billboardPreview = [],
  profile = null,
  isMobile = false,
  windowsPhotoOrientation = "portrait",
}) {
  const posts = pickWindowsPosts(billboardPreview, profile);
  const [index, setIndex] = useState(0);
  const orientation = normalizeWindowsPhotoOrientation(windowsPhotoOrientation);
  const frameAspect = windowsFrameAspectRatio(orientation);

  useEffect(() => {
    setIndex(0);
  }, [posts.map((p) => p?.id || postImage(p)).join("|")]);

  // No empty state — Windows only exists after owner/operator adds a window offer.
  if (!posts.length) return null;

  const safeIndex = Math.min(index, posts.length - 1);
  const current = posts[safeIndex] || null;
  const img = current ? postImage(current) : "";
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < posts.length - 1;
  const showArrows = posts.length > 1;
  // Compact thumb so Windows is visible without scrolling past the hero.
  const frameMaxWidth = isMobile ? 88 : 104;
  const imageObjectPosition = resolveBillboardImageObjectPosition(current);

  return (
    <section
      data-testid="profile-billboard-block"
      data-section="windows"
      data-windows-orientation={orientation}
      aria-label="Windows"
      style={{ marginBottom: isMobile ? 14 : 18 }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.4,
          color: PROFILE_INK,
          marginBottom: 6,
        }}
      >
        Windows
      </div>
      <article
        data-testid="profile-billboard-card"
        style={{
          maxWidth: frameMaxWidth,
          borderRadius: 8,
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
              alt={`Window ${safeIndex + 1}`}
              loading="eager"
              style={{
                width: "100%",
                aspectRatio: frameAspect,
                height: "auto",
                objectFit: "cover",
                objectPosition: imageObjectPosition,
                display: "block",
                background: "#e7e5e4",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: frameAspect,
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
                  right: 4,
                  bottom: 4,
                  zIndex: 2,
                  padding: "1px 5px",
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.45)",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 0.02,
                }}
              >
                {safeIndex + 1} / {posts.length}
              </div>
            </>
          ) : null}
        </div>
      </article>
    </section>
  );
}
