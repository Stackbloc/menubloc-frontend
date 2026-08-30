/**
 * Compact in-page Windows section below the hero.
 * Food-offer photos only (not brand splash/hero billboard art), unless the
 * temporary In-N-Out exception applies. Section is omitted when empty.
 * Photos only — no title/body caption under the frame.
 * All window photos shown in a row; click opens fullscreen lightbox.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { pickWindowsPosts } from "../../../lib/profileWindows.js";
import {
  resolveBillboardDisplayImageUrl,
  resolveBillboardImageObjectPosition,
} from "../../../lib/billboardImageObjectPosition.js";
import { resolveBillboardMediaUrl } from "../../../lib/billboardMediaUrl.js";
import {
  normalizeWindowsPhotoOrientation,
  windowsFrameAspectRatio,
} from "../../../lib/windowsPhotoOrientation.js";
import { PROFILE_INK, profileCardBorderVar, profileReadableSurfaceStyle } from "./profilePrimitives.jsx";

function postImage(post, { narrow = false } = {}) {
  const raw = String(post?.image_url || post?.photo_url || "").trim();
  return resolveBillboardMediaUrl(
    resolveBillboardDisplayImageUrl(raw || post, { narrow })
  );
}

export default function ProfileBillboardBlock({
  billboardPreview = [],
  profile = null,
  isMobile = false,
  windowsPhotoOrientation = "portrait",
}) {
  const posts = pickWindowsPosts(billboardPreview, profile);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const orientation = normalizeWindowsPhotoOrientation(windowsPhotoOrientation);
  const frameAspect = windowsFrameAspectRatio(orientation);
  // Compact thumb so Windows is visible without scrolling past the hero.
  const frameMaxWidth = isMobile ? 88 : 104;

  useEffect(() => {
    setLightboxIndex(null);
  }, [posts.map((p) => p?.id || postImage(p, { narrow: isMobile })).join("|"), isMobile]);

  useEffect(() => {
    if (lightboxIndex == null) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxIndex]);

  // No empty state — Windows only exists after owner/operator adds a window offer.
  if (!posts.length) return null;

  const lightboxPost =
    lightboxIndex != null && lightboxIndex >= 0 && lightboxIndex < posts.length
      ? posts[lightboxIndex]
      : null;
  const lightboxImg = lightboxPost ? postImage(lightboxPost, { narrow: isMobile }) : "";
  const lightboxObjectPosition = lightboxPost
    ? resolveBillboardImageObjectPosition(lightboxPost, { narrow: isMobile })
    : "center";

  const lightbox =
    lightboxPost && typeof document !== "undefined"
      ? createPortal(
          <div
            data-testid="profile-windows-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Window photo"
            onClick={() => setLightboxIndex(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              boxSizing: "border-box",
              cursor: "zoom-out",
            }}
          >
            <button
              type="button"
              aria-label="Close"
              data-testid="profile-windows-lightbox-close"
              onClick={() => setLightboxIndex(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 2,
                width: 40,
                height: 40,
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                fontSize: 22,
                fontWeight: 700,
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ×
            </button>
            {lightboxImg ? (
              <img
                src={lightboxImg}
                alt={`Window ${(lightboxIndex ?? 0) + 1} enlarged`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
                  objectFit: "contain",
                  objectPosition: lightboxObjectPosition,
                  display: "block",
                  cursor: "default",
                }}
              />
            ) : null}
          </div>,
          document.body
        )
      : null;

  return (
    <section
      data-testid="profile-billboard-block"
      data-section="windows"
      data-windows-orientation={orientation}
      data-profile-surface="card"
      aria-label="Windows"
      style={profileReadableSurfaceStyle({
        marginBottom: isMobile ? 14 : 18,
        padding: isMobile ? "12px 12px" : "14px 14px",
      })}
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
      <div
        data-testid="profile-windows-row"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: isMobile ? 8 : 10,
          alignItems: "flex-start",
        }}
      >
        {posts.map((post, i) => {
          const img = postImage(post, { narrow: isMobile });
          const imageObjectPosition = resolveBillboardImageObjectPosition(post, {
            narrow: isMobile,
          });
          return (
            <button
              key={post?.id || img || i}
              type="button"
              data-testid="profile-billboard-card"
              aria-label={`Enlarge window photo ${i + 1}`}
              onClick={() => setLightboxIndex(i)}
              style={{
                width: frameMaxWidth,
                maxWidth: frameMaxWidth,
                padding: 0,
                margin: 0,
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${profileCardBorderVar}`,
                background: "#fff",
                cursor: "zoom-in",
                display: "block",
              }}
            >
              {img ? (
                <img
                  src={img}
                  alt={`Window ${i + 1}`}
                  loading={i === 0 ? "eager" : "lazy"}
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
            </button>
          );
        })}
      </div>
      {lightbox}
    </section>
  );
}
