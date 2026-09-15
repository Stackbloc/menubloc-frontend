/**
 * Search result video strip — evidence on the ranked card, not a video catalog.
 * Reads `row.videos` from Search. Does not fetch restaurant-wide profile videos.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { resolveConsumerMediaUrl } from "../../lib/consumerApi.js";

const MOBILE_VISIBLE = 2;
const DESKTOP_VISIBLE = 3;

function useVisibleCount() {
  const [count, setCount] = useState(MOBILE_VISIBLE);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setCount(mq.matches ? DESKTOP_VISIBLE : MOBILE_VISIBLE);
    apply();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
    mq.addListener(apply);
    return () => mq.removeListener(apply);
  }, []);
  return count;
}

function PlayGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.55)" />
      <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#fff" />
    </svg>
  );
}

function SearchResultVideoOverlay({ video, onClose }) {
  const src = video?.video_url ? resolveConsumerMediaUrl(video.video_url) : "";
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!src || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-testid="search-result-video-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={video.context_line || "Video"}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(0,0,0,0.78)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(360px, 92vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <video
          src={src}
          poster={video.photo_url ? resolveConsumerMediaUrl(video.photo_url) : undefined}
          controls
          autoPlay
          playsInline
          muted={video.play_muted === true}
          style={{
            width: "100%",
            aspectRatio: "9 / 16",
            objectFit: "cover",
            borderRadius: 12,
            background: "#111",
          }}
        />
        <button
          type="button"
          onClick={onClose}
          style={{
            alignSelf: "center",
            border: 0,
            background: "transparent",
            color: "#E5E7EB",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}

export function SearchResultVideoCard({
  video,
  omitRestaurantContext = false,
  onPlay,
}) {
  if (!video?.video_url) return null;
  const thumb = video.photo_url ? resolveConsumerMediaUrl(video.photo_url) : "";
  const avatar = video.creator_avatar_url
    ? resolveConsumerMediaUrl(video.creator_avatar_url)
    : "";
  const context =
    omitRestaurantContext && video.menu_item_name
      ? video.menu_item_name
      : video.context_line || video.menu_item_name || "Video";

  return (
    <button
      type="button"
      data-testid="search-result-video-card"
      onClick={() => onPlay?.(video)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: 86,
        flex: "0 0 auto",
        padding: 0,
        border: 0,
        background: "transparent",
        textAlign: "left",
        cursor: "pointer",
        color: "inherit",
      }}
    >
      <span
        style={{
          position: "relative",
          display: "block",
          width: "100%",
          aspectRatio: "9 / 16",
          borderRadius: 10,
          overflow: "hidden",
          background: "#111827",
        }}
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            aria-hidden="true"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg,#1f2937,#111827)",
            }}
          />
        )}
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PlayGlyph />
        </span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {avatar ? (
          <img
            src={avatar}
            alt=""
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              objectFit: "cover",
              flex: "0 0 auto",
            }}
          />
        ) : (
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#374151",
              flex: "0 0 auto",
            }}
          />
        )}
        <span
          style={{
            fontSize: 11,
            lineHeight: 1.3,
            fontWeight: 650,
            color: "#C0C8D5",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {context}
        </span>
      </span>
    </button>
  );
}

export default function SearchResultVideoStrip({
  videos,
  seeAllHref = null,
  omitRestaurantContext = false,
}) {
  const visibleCount = useVisibleCount();
  const [playing, setPlaying] = useState(null);
  const list = Array.isArray(videos) ? videos.filter((video) => video?.video_url) : [];
  if (!list.length) return null;

  const shown = list.slice(0, visibleCount);
  const total = list.length;

  return (
    <div data-testid="search-result-video-strip" style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
        {shown.map((video) => (
          <SearchResultVideoCard
            key={video.video_id || `${video.video_kind}:${video.video_source_id}`}
            video={video}
            omitRestaurantContext={omitRestaurantContext}
            onPlay={setPlaying}
          />
        ))}
      </div>
      {seeAllHref && total > shown.length ? (
        <Link
          to={seeAllHref}
          data-testid="search-result-video-see-all"
          style={{
            display: "inline-block",
            marginTop: 8,
            fontSize: 13,
            fontWeight: 750,
            color: "#22C55E",
            textDecoration: "none",
          }}
        >
          {`See all ${total} ›`}
        </Link>
      ) : null}
      {playing ? (
        <SearchResultVideoOverlay video={playing} onClose={() => setPlaying(null)} />
      ) : null}
    </div>
  );
}
