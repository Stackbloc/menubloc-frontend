/**
 * Public restaurant profile Videos — tagged clips (incl. deals) with franchise fan-out.
 */
import { useEffect, useState } from "react";
import { listRestaurantProfileVideos } from "../../../lib/restaurantProfileVideosApi.js";
import { resolveConsumerMediaUrl } from "../../../lib/consumerApi.js";
import {
  PROFILE_INK,
  PROFILE_MUTED,
  profileReadableSurfaceStyle,
} from "./profilePrimitives.jsx";

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
      <video src={src} style={styles.video} controls playsInline preload="metadata" />
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

  useEffect(() => {
    let cancelled = false;
    if (!restaurantId) {
      setVideos([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    listRestaurantProfileVideos(restaurantId, { limit: 24 })
      .then((data) => {
        if (cancelled) return;
        setVideos(Array.isArray(data.videos) ? data.videos : []);
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

  return (
    <section
      data-testid="profile-videos-section"
      data-profile-surface="card"
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
      <div style={styles.grid}>
        {videos.map((video) => (
          <VideoCard key={video.video_key || `${video.kind}:${video.video_id}`} video={video} />
        ))}
      </div>
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
    margin: "0 0 12px",
    fontSize: 12,
    color: PROFILE_MUTED,
    lineHeight: 1.4,
  },
  grid: {
    display: "grid",
    gap: 12,
  },
  card: {
    borderRadius: 12,
    border: "1px solid #e7e5e4",
    background: "#fff",
    overflow: "hidden",
  },
  video: {
    display: "block",
    width: "100%",
    maxHeight: 320,
    background: "#0f172a",
    objectFit: "contain",
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
    fontSize: 15,
    fontWeight: 700,
    color: PROFILE_INK,
  },
  comment: {
    margin: 0,
    fontSize: 13,
    color: "#57534e",
    lineHeight: 1.4,
  },
};
