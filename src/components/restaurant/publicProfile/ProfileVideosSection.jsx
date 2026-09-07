/**
 * Public restaurant profile Videos — tagged clips (incl. deals) with franchise fan-out.
 * Initial surface shows a small grid of portrait tiles; expand in place for the rest.
 */
import { useEffect, useState } from "react";
import { listRestaurantProfileVideos } from "../../../lib/restaurantProfileVideosApi.js";
import { shuffleProfileVideos } from "../../../lib/shuffleProfileVideos.js";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import {
  PROFILE_INK,
  PROFILE_MUTED,
  profileReadableSurfaceStyle,
} from "./profilePrimitives.jsx";

/** First paint on the profile — mirrors Favorite Menu Items (≤3). */
export const PROFILE_VIDEOS_INITIAL_VISIBLE = 3;
/** Cap for expand-in-place; matches API default. */
export const PROFILE_VIDEOS_FETCH_LIMIT = 24;

function kindLabel(kind) {
  const k = String(kind || "").toLowerCase();
  if (k === "deal") return "Deal";
  if (k === "managed") return "Menuply";
  if (k === "food_activity") return "I'm Eating";
  if (k === "ate") return "Food diary";
  if (k === "want") return "Want to eat";
  if (k === "plan") return "Plan";
  return "Video";
}

function VideoCard({ video }) {
  const src = video?.video_url ? resolveConsumerMediaUrl(video.video_url) : "";
  if (!src) return null;
  return (
    <article data-testid="profile-video-card" data-video-kind={video.kind} style={styles.card}>
      <div style={styles.mediaFrame}>
        <video src={src} style={styles.video} controls playsInline preload="metadata" />
      </div>
      <div style={styles.body}>
        <div style={styles.metaRow}>
          <span style={styles.kind}>{kindLabel(video.kind)}</span>
          {video.creator_label ? <span style={styles.creator}>{video.creator_label}</span> : null}
        </div>
        {video.title ? <div style={styles.title}>{video.title}</div> : null}
        {video.comment ? <p style={styles.comment}>{video.comment}</p> : null}
      </div>
    </article>
  );
}

export default function ProfileVideosSection({ restaurantId, isMobile = false }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!restaurantId) {
      setVideos([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    setExpanded(false);
    listRestaurantProfileVideos(restaurantId, { limit: PROFILE_VIDEOS_FETCH_LIMIT })
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data.videos) ? data.videos : [];
        setVideos(shuffleProfileVideos(rows));
      })
      .catch(() => {
        if (!cancelled) setVideos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  if (!restaurantId || loading || videos.length === 0) return null;

  const hasMore = videos.length > PROFILE_VIDEOS_INITIAL_VISIBLE;
  const visible = expanded ? videos : videos.slice(0, PROFILE_VIDEOS_INITIAL_VISIBLE);
  const hiddenCount = Math.max(0, videos.length - PROFILE_VIDEOS_INITIAL_VISIBLE);

  return (
    <section
      data-testid="profile-videos-section"
      data-profile-surface="card"
      data-videos-initial={PROFILE_VIDEOS_INITIAL_VISIBLE}
      aria-label="Videos"
      style={profileReadableSurfaceStyle({
        marginBottom: isMobile ? 20 : 28,
      })}
    >
      <div style={styles.heading}>Videos</div>
      <p style={styles.disclaimer}>
        Videos tagged to this restaurant
        {videos.some((v) => v.chain_id) ? " or its franchise" : ""}. Restaurants can remove
        content from Menuply.
      </p>
      {hasMore && !expanded ? (
        <p style={styles.countHint} data-testid="profile-videos-count-hint">
          Showing {PROFILE_VIDEOS_INITIAL_VISIBLE} of {videos.length}
        </p>
      ) : null}
      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: isMobile
            ? "repeat(auto-fill, minmax(132px, 1fr))"
            : "repeat(auto-fill, minmax(160px, 1fr))",
        }}
        data-testid="profile-videos-grid"
      >
        {visible.map((video) => (
          <VideoCard key={video.video_key || `${video.kind}:${video.video_id}`} video={video} />
        ))}
      </div>
      {hasMore && !expanded ? (
        <button
          type="button"
          style={styles.viewAll}
          data-testid="profile-videos-view-all"
          onClick={() => setExpanded(true)}
        >
          View all ({hiddenCount} more)
        </button>
      ) : null}
      {hasMore && expanded ? (
        <button
          type="button"
          style={styles.viewAll}
          data-testid="profile-videos-show-less"
          onClick={() => setExpanded(false)}
        >
          Show less
        </button>
      ) : null}
    </section>
  );
}

const styles = {
  heading: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0.4,
    color: PROFILE_INK,
    marginBottom: 6,
  },
  disclaimer: {
    margin: "0 0 8px",
    fontSize: 12,
    color: PROFILE_MUTED,
    lineHeight: 1.4,
  },
  countHint: {
    margin: "0 0 10px",
    fontSize: 12,
    fontWeight: 600,
    color: PROFILE_MUTED,
  },
  grid: {
    display: "grid",
    gap: 12,
    width: "100%",
  },
  card: {
    borderRadius: 12,
    border: "1px solid #e7e5e4",
    background: "#fff",
    overflow: "hidden",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  mediaFrame: {
    position: "relative",
    width: "100%",
    aspectRatio: "9 / 16",
    background: "#0f172a",
    overflow: "hidden",
  },
  video: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    verticalAlign: "top",
  },
  body: {
    padding: "10px 12px 12px",
    display: "grid",
    gap: 4,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "baseline",
  },
  kind: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#166534",
  },
  creator: {
    fontSize: 12,
    color: PROFILE_MUTED,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: PROFILE_INK,
    lineHeight: 1.3,
  },
  comment: {
    margin: 0,
    fontSize: 13,
    color: "#57534e",
    lineHeight: 1.4,
  },
  viewAll: {
    appearance: "none",
    marginTop: 12,
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#166534",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "left",
  },
};
