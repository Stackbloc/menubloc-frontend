/**
 * Search result video strip — evidence on the ranked card, not a video catalog.
 * Reads `row.videos` from Search. Does not fetch restaurant-wide profile videos.
 *
 * Play: thumbnail shell → tap grows into the larger in-card player (same card).
 * The empty/thumbnail shell is not kept on screen while playing.
 * No fullscreen control — Collapse returns to the strip.
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { resolveConsumerMediaUrl } from "../../lib/consumerApi.js";

const MOBILE_VISIBLE = 2;
const DESKTOP_VISIBLE = 3;
const THUMB_WIDTH = 86;
const EXPANDED_WIDTH = "min(220px, 56vw)";

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

function videoKey(video) {
  return video?.video_id || `${video?.video_kind}:${video?.video_source_id}`;
}

function PlayGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="rgba(0,0,0,0.55)" />
      <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#fff" />
    </svg>
  );
}

function contextLabel(video, omitRestaurantContext) {
  if (omitRestaurantContext && video.menu_item_name) return video.menu_item_name;
  return video.context_line || video.menu_item_name || "Video";
}

export function SearchResultVideoCard({
  video,
  omitRestaurantContext = false,
  onPlay,
}) {
  if (!video?.video_url) return null;
  const rawThumb = video.thumbnail_url || video.photo_url || null;
  const thumb = rawThumb ? resolveConsumerMediaUrl(rawThumb) : "";
  const avatar = video.creator_avatar_url
    ? resolveConsumerMediaUrl(video.creator_avatar_url)
    : "";
  const context = contextLabel(video, omitRestaurantContext);

  return (
    <button
      type="button"
      data-testid="search-result-video-card"
      onClick={() => onPlay?.(video)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: THUMB_WIDTH,
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
          background: "#E5E7EB",
        }}
      >
        {thumb ? (
          <img
            src={thumb}
            alt=""
            data-testid="search-result-video-thumb"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            aria-hidden="true"
            data-testid="search-result-video-thumb-placeholder"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg,#F3F4F6,#E5E7EB 55%,#D1D5DB)",
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

/** Larger in-card player — replaces the thumbnail strip while open (no empty shell, no fullscreen). */
function SearchResultVideoInlineExpanded({
  video,
  omitRestaurantContext = false,
  onCollapse,
}) {
  const videoElRef = useRef(null);
  const src = video?.video_url ? resolveConsumerMediaUrl(video.video_url) : "";
  const posterRaw = video?.thumbnail_url || video?.photo_url || null;
  const poster = posterRaw ? resolveConsumerMediaUrl(posterRaw) : undefined;
  const context = contextLabel(video, omitRestaurantContext);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onCollapse?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCollapse]);

  if (!src) return null;

  return (
    <div
      data-testid="search-result-video-inline-expanded"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
      }}
    >
      <div
        style={{
          position: "relative",
          width: EXPANDED_WIDTH,
          maxWidth: "100%",
          borderRadius: 12,
          overflow: "hidden",
          background: "#111",
        }}
      >
        <video
          ref={videoElRef}
          data-testid="search-result-video-inline-player"
          src={src}
          poster={poster}
          controls
          autoPlay
          playsInline
          muted={video.play_muted === true}
          style={{
            display: "block",
            width: "100%",
            aspectRatio: "9 / 16",
            objectFit: "cover",
            background: "#111",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          maxWidth: 220,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 650,
            color: "#C0C8D5",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
          }}
        >
          {context}
        </span>
        <button
          type="button"
          data-testid="search-result-video-collapse"
          onClick={onCollapse}
          style={{
            flex: "0 0 auto",
            border: 0,
            background: "transparent",
            color: "#22C55E",
            fontWeight: 750,
            fontSize: 13,
            cursor: "pointer",
            padding: 0,
          }}
        >
          Collapse
        </button>
      </div>
    </div>
  );
}

export default function SearchResultVideoStrip({
  videos,
  seeAllHref = null,
  omitRestaurantContext = false,
}) {
  const visibleCount = useVisibleCount();
  const [expanded, setExpanded] = useState(null);
  const list = Array.isArray(videos) ? videos.filter((video) => video?.video_url) : [];
  if (!list.length) return null;

  const shown = list.slice(0, visibleCount);
  const total = list.length;
  const expandedKey = expanded ? videoKey(expanded) : null;
  const isExpanded = Boolean(expanded && expandedKey);

  return (
    <div data-testid="search-result-video-strip" style={{ marginTop: 10 }}>
      {/* While playing: only the larger player — thumbnail/empty shell is not kept on screen. */}
      {isExpanded ? (
        <SearchResultVideoInlineExpanded
          key={expandedKey}
          video={expanded}
          omitRestaurantContext={omitRestaurantContext}
          onCollapse={() => setExpanded(null)}
        />
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {shown.map((video) => (
              <SearchResultVideoCard
                key={videoKey(video)}
                video={video}
                omitRestaurantContext={omitRestaurantContext}
                onPlay={setExpanded}
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
        </>
      )}
    </div>
  );
}
