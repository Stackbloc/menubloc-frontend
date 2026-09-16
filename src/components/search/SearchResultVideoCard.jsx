/**
 * Search result video strip — evidence on the ranked card, not a video catalog.
 * Reads `row.videos` from Search. Does not fetch restaurant-wide profile videos.
 *
 * Play: thumbnail strip → tap replaces strip with larger in-card player (no empty shell).
 * 2+ videos: next/prev arrows on the player (Part 4) — thumbnails to choose, arrows to continue.
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

function ChevronGlyph({ direction }) {
  const d =
    direction === "prev"
      ? "M14.5 6.5 9 12l5.5 5.5"
      : "M9.5 6.5 15 12l-5.5 5.5";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <path d={d} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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
        {video.from_connect ? (
          <span
            data-testid="search-result-video-connect-badge"
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.2,
              color: "#166534",
              background: "#dcfce7",
              borderRadius: 999,
              padding: "1px 6px",
              flex: "0 0 auto",
            }}
          >
            Connect
          </span>
        ) : null}
      </span>
    </button>
  );
}

function navButtonStyle(side) {
  return {
    position: "absolute",
    top: "50%",
    [side]: 6,
    transform: "translateY(-50%)",
    zIndex: 3,
    width: 34,
    height: 34,
    border: 0,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  };
}

/** Larger in-card player — replaces the thumbnail strip while open (no empty shell, no fullscreen). */
function SearchResultVideoInlineExpanded({
  video,
  playlist = [],
  omitRestaurantContext = false,
  onCollapse,
  onSelect,
}) {
  const videoElRef = useRef(null);
  const src = video?.video_url ? resolveConsumerMediaUrl(video.video_url) : "";
  const posterRaw = video?.thumbnail_url || video?.photo_url || null;
  const poster = posterRaw ? resolveConsumerMediaUrl(posterRaw) : undefined;
  const context = contextLabel(video, omitRestaurantContext);
  const multi = Array.isArray(playlist) && playlist.length > 1;
  const index = multi
    ? Math.max(
        0,
        playlist.findIndex((item) => videoKey(item) === videoKey(video))
      )
    : 0;
  const hasPrev = multi && index > 0;
  const hasNext = multi && index < playlist.length - 1;

  function go(delta) {
    if (!multi) return;
    const next = playlist[index + delta];
    if (next) onSelect?.(next);
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        onCollapse?.();
        return;
      }
      if (!multi) return;
      if (event.key === "ArrowLeft" && index > 0) {
        event.preventDefault();
        const prev = playlist[index - 1];
        if (prev) onSelect?.(prev);
      } else if (event.key === "ArrowRight" && index < playlist.length - 1) {
        event.preventDefault();
        const next = playlist[index + 1];
        if (next) onSelect?.(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [multi, index, playlist, onCollapse, onSelect]);

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
          key={videoKey(video)}
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
        {hasPrev ? (
          <button
            type="button"
            data-testid="search-result-video-prev"
            aria-label="Previous video"
            onClick={(event) => {
              event.stopPropagation();
              go(-1);
            }}
            style={navButtonStyle("left")}
          >
            <ChevronGlyph direction="prev" />
          </button>
        ) : null}
        {hasNext ? (
          <button
            type="button"
            data-testid="search-result-video-next"
            aria-label="Next video"
            onClick={(event) => {
              event.stopPropagation();
              go(1);
            }}
            style={navButtonStyle("right")}
          >
            <ChevronGlyph direction="next" />
          </button>
        ) : null}
        {multi ? (
          <span
            data-testid="search-result-video-position"
            style={{
              position: "absolute",
              top: 8,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 3,
              padding: "2px 8px",
              borderRadius: 999,
              background: "rgba(0,0,0,0.55)",
              color: "#E5E7EB",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {`${index + 1} / ${playlist.length}`}
          </span>
        ) : null}
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
  const hasConnect = shown.some((video) => video?.from_connect === true);
  const total = list.length;
  const expandedKey = expanded ? videoKey(expanded) : null;
  const isExpanded = Boolean(expanded && expandedKey);
  // Playlist = all videos on this card (not only the visible strip slice).
  const playlist = list;

  return (
    <div data-testid="search-result-video-strip" style={{ marginTop: 10 }}>
      {/* While playing: larger player only — strip hidden; arrows continue when 2+. */}
      {isExpanded ? (
        <SearchResultVideoInlineExpanded
          key={expandedKey}
          video={expanded}
          playlist={playlist}
          omitRestaurantContext={omitRestaurantContext}
          onCollapse={() => setExpanded(null)}
          onSelect={setExpanded}
        />
      ) : (
        <>
          {hasConnect ? (
            <p
              data-testid="search-result-video-connects-label"
              style={{
                margin: "0 0 6px",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                color: "#166534",
              }}
            >
              Your Connects
            </p>
          ) : null}
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
