/**
 * Diner avatar: photo when present, otherwise initials on the brand gradient.
 * Shared by Connection social proof and search social lines.
 * Motion profile photos (Andre, 2026-10-25; menuply-mobile docs/12): when the diner has a motion
 * clip it plays muted and looping, only while on screen, with the still shown first. Reduced-motion
 * users see the still.
 */
import React, { useEffect, useRef, useState } from "react";
import { resolveConsumerMediaUrl } from "../../lib/consumerApi.js";

export function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

function prefersReducedMotion() {
  try {
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  } catch {
    return false;
  }
}

/** True while the element is on screen (always true where IntersectionObserver is missing). */
function useOnScreen(ref, enabled) {
  const [onScreen, setOnScreen] = useState(false);
  const noObserver = typeof IntersectionObserver === "undefined";
  useEffect(() => {
    if (!enabled || noObserver || !ref.current) return undefined;
    const io = new IntersectionObserver(([entry]) => setOnScreen(Boolean(entry?.isIntersecting)), { rootMargin: "100px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, enabled, noObserver]);
  return noObserver || onScreen;
}

export default function DinerAvatar({ avatarUrl, avatarMotionUrl, displayName, size = 32, title }) {
  const url = avatarUrl ? resolveConsumerMediaUrl(avatarUrl) : "";
  const motionUrl = avatarMotionUrl && !prefersReducedMotion() ? resolveConsumerMediaUrl(avatarMotionUrl) : "";
  const boxRef = useRef(null);
  const onScreen = useOnScreen(boxRef, Boolean(motionUrl));
  return (
    <div
      ref={boxRef}
      title={title === undefined ? displayName || "Connection" : title || undefined}
      style={{ ...styles.avatar, width: size, height: size }}
    >
      {motionUrl && onScreen ? (
        <video
          src={motionUrl}
          poster={url || undefined}
          muted
          loop
          autoPlay
          playsInline
          preload="metadata"
          aria-hidden="true"
          data-testid="diner-avatar-motion"
          style={styles.avatarImg}
        />
      ) : url ? (
        <img src={url} alt="" style={styles.avatarImg} loading="lazy" />
      ) : (
        <span style={{ ...styles.avatarInitials, fontSize: Math.round(size * 0.34) }}>
          {initials(displayName)}
        </span>
      )}
    </div>
  );
}

const styles = {
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    overflow: "hidden",
    background: "linear-gradient(135deg, #1d4ed8, #0f766e)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "2px solid #fff",
    boxShadow: "0 0 0 1px rgba(0,0,0,0.06)",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
  },
};
