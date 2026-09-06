/**
 * Small contextual video player for independent menu views (search / Yellow Browse / public menu).
 * Uses GET /public/restaurants/:id/videos — same pool as restaurant profile (honors removals).
 * Never used when Feed already supplies an originating PiP clip.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { listRestaurantProfileVideos } from "../../lib/restaurantProfileVideosApi.js";
import { resolveConsumerMediaUrl } from "../../lib/consumerApi.js";
import { stripMediaUrlFragment } from "../../lib/menuplyLiveFeedControl.js";

function watchPathForVideo(video) {
  const kind = String(video?.kind || "").trim().toLowerCase();
  const id = video?.video_id != null ? String(video.video_id).trim() : "";
  if (!kind || !id) return null;
  if (kind === "deal") return `/feed/deals?deal=${encodeURIComponent(id)}`;
  return `/videos/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`;
}

function pickInitialIndex(videos, preferredMenuItemId) {
  if (!Array.isArray(videos) || videos.length === 0) return 0;
  const want = preferredMenuItemId != null ? String(preferredMenuItemId).trim() : "";
  if (!want) return 0;
  const idx = videos.findIndex(
    (v) => v?.menu_item_id != null && String(v.menu_item_id) === want
  );
  return idx >= 0 ? idx : 0;
}

/**
 * @param {{
 *   restaurantId: string | number | null | undefined,
 *   preferredMenuItemId?: string | number | null,
 *   bottomInset?: number,
 * }} props
 */
export default function MenuRestaurantContextualVideo({
  restaurantId,
  preferredMenuItemId = null,
  bottomInset = 0,
}) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [videos, setVideos] = useState([]);
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(false);

  const rid = restaurantId != null ? String(restaurantId).trim() : "";

  useEffect(() => {
    let cancelled = false;
    if (!rid) {
      setVideos([]);
      setIndex(0);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    listRestaurantProfileVideos(rid, { limit: 24 })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data?.videos) ? data.videos.filter((v) => v?.video_url) : [];
        setVideos(list);
        setIndex(pickInitialIndex(list, preferredMenuItemId));
      })
      .catch(() => {
        if (!cancelled) {
          setVideos([]);
          setIndex(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rid]);

  useEffect(() => {
    if (!videos.length) return;
    setIndex(pickInitialIndex(videos, preferredMenuItemId));
  }, [preferredMenuItemId, videos]);

  const clip = videos[index] || null;
  const src = useMemo(() => {
    if (!clip?.video_url) return "";
    return stripMediaUrlFragment(resolveConsumerMediaUrl(clip.video_url) || clip.video_url);
  }, [clip?.video_url, clip?.video_key]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !src) return undefined;
    el.currentTime = 0;
    el.muted = muted;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    return undefined;
  }, [src, index, muted]);

  if (!rid || loading || !clip || !src) return null;
  if (typeof document === "undefined") return null;

  const padBottom = Math.max(0, Number(bottomInset) || 0);
  const watchPath = watchPathForVideo(clip);

  function goPrev(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setIndex((i) => (i > 0 ? i - 1 : i));
  }

  function goNext(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setIndex((i) => (i + 1 < videos.length ? i + 1 : i));
  }

  function toggleMute(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setMuted((m) => !m);
  }

  function openFull(e) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (watchPath) navigate(watchPath);
  }

  return createPortal(
    <div
      style={{
        ...styles.root,
        bottom: `calc(${padBottom}px + max(16px, env(safe-area-inset-bottom)) + 12px)`,
      }}
      data-testid="menu-restaurant-contextual-video"
      data-restaurant-id={rid}
      data-video-key={clip.video_key || `${clip.kind}:${clip.video_id}`}
    >
      <video
        key={clip.video_key || src}
        ref={videoRef}
        src={src}
        style={styles.video}
        playsInline
        muted={muted}
        loop
        autoPlay
        controls={false}
        preload="auto"
        data-testid="menu-restaurant-contextual-video-el"
        aria-label="Restaurant video — tap to expand"
        onClick={openFull}
      />
      {videos.length > 1 ? (
        <>
          <button
            type="button"
            style={{ ...styles.sideBtn, ...styles.sideLeft, ...(index <= 0 ? styles.disabled : null) }}
            disabled={index <= 0}
            data-testid="menu-restaurant-contextual-video-prev"
            aria-label="Previous restaurant video"
            onClick={goPrev}
          >
            ‹
          </button>
          <button
            type="button"
            style={{
              ...styles.sideBtn,
              ...styles.sideRight,
              ...(index >= videos.length - 1 ? styles.disabled : null),
            }}
            disabled={index >= videos.length - 1}
            data-testid="menu-restaurant-contextual-video-next"
            aria-label="Next restaurant video"
            onClick={goNext}
          >
            ›
          </button>
        </>
      ) : null}
      <button
        type="button"
        style={styles.muteBtn}
        data-testid="menu-restaurant-contextual-video-mute"
        aria-label={muted ? "Unmute video" : "Mute video"}
        onClick={toggleMute}
      >
        {muted ? "🔇" : "🔊"}
      </button>
    </div>,
    document.body
  );
}

const styles = {
  root: {
    position: "fixed",
    right: "max(12px, env(safe-area-inset-right))",
    zIndex: 40,
    width: 140,
    height: 248,
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 10px 32px rgba(0,0,0,0.55)",
    border: "2px solid rgba(255,255,255,0.4)",
    background: "#000",
    pointerEvents: "auto",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    cursor: "pointer",
    background: "#000",
  },
  sideBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    border: "1px solid rgba(255,255,255,0.45)",
    borderRadius: 999,
    width: 28,
    height: 40,
    padding: 0,
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  sideLeft: { left: 4 },
  sideRight: { right: 4 },
  muteBtn: {
    position: "absolute",
    left: "50%",
    bottom: 8,
    transform: "translateX(-50%)",
    border: "1px solid rgba(255,255,255,0.45)",
    borderRadius: 999,
    width: 32,
    height: 32,
    padding: 0,
    background: "rgba(0,0,0,0.62)",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  disabled: {
    opacity: 0.35,
    cursor: "default",
  },
};
