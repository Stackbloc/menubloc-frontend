/**
 * Operator list + remove for videos visible on this restaurant profile
 * (franchise fan-out). Remove clears Feed + all profiles.
 */

import { useCallback, useEffect, useState } from "react";
import {
  listOperatorProfileVideos,
  removeOperatorProfileVideo,
} from "../../lib/operatorApi.js";
import { resolveConsumerMediaUrl } from "../../lib/consumerApi.js";

function kindLabel(kind) {
  const k = String(kind || "").toLowerCase();
  if (k === "deal") return "Deal";
  if (k === "managed") return "Platform";
  if (k === "food_activity") return "I'm Eating";
  if (k === "ate") return "Food diary / Feed";
  if (k === "want") return "Want";
  if (k === "plan") return "Plan";
  return kind || "Video";
}

export default function OperatorProfileVideosPanel({ restaurantId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [removingKey, setRemovingKey] = useState("");

  const load = useCallback(async () => {
    if (!restaurantId) {
      setVideos([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await listOperatorProfileVideos(restaurantId, { limit: 40 });
      setVideos(Array.isArray(data?.videos) ? data.videos : []);
    } catch (err) {
      setVideos([]);
      setError(err?.message || "Unable to load profile videos");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRemove(video) {
    if (!restaurantId || !video?.kind || video.video_id == null) return;
    const label = video.title || kindLabel(video.kind);
    const ok = window.confirm(
      `Remove “${label}” from the Feed and all restaurant profiles for this franchise? This cannot be undone from the public site.`
    );
    if (!ok) return;
    const key = video.video_key || `${video.kind}:${video.video_id}`;
    setRemovingKey(key);
    setError("");
    try {
      await removeOperatorProfileVideo(restaurantId, video.kind, video.video_id);
      setVideos((prev) => prev.filter((row) => (row.video_key || `${row.kind}:${row.video_id}`) !== key));
    } catch (err) {
      setError(err?.message || "Unable to remove video");
    } finally {
      setRemovingKey("");
    }
  }

  if (!restaurantId) return null;

  return (
    <section
      data-testid="operator-profile-videos"
      style={{
        marginTop: 36,
        paddingTop: 24,
        borderTop: "1px solid #e2e8f0",
        maxWidth: 640,
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
        Videos on your profile
      </h2>
      <p style={{ margin: "0 0 16px", fontSize: 14, lineHeight: 1.5, color: "#64748b" }}>
        Includes diner, platform, and deal videos tagged to this location
        {videos.some((v) => v.chain_id) ? " or elsewhere in your franchise" : ""}.{" "}
        <strong>Remove</strong> clears the video from the Feed and every location profile.
      </p>

      {loading ? <p style={{ color: "#64748b" }}>Loading…</p> : null}
      {error ? (
        <p role="alert" style={{ color: "#b91c1c", fontWeight: 600 }}>
          {error}
        </p>
      ) : null}
      {!loading && videos.length === 0 ? (
        <p style={{ color: "#64748b" }} data-testid="operator-profile-videos-empty">
          No tagged videos on this profile right now.
        </p>
      ) : null}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12 }}>
        {videos.map((video) => {
          const key = video.video_key || `${video.kind}:${video.video_id}`;
          const src = video.video_url ? resolveConsumerMediaUrl(video.video_url) : "";
          const busy = removingKey === key;
          return (
            <li
              key={key}
              data-testid="operator-profile-video-row"
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr auto",
                gap: 12,
                alignItems: "center",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                background: "#fff",
              }}
            >
              {src ? (
                <video
                  src={src}
                  style={{ width: 120, height: 72, objectFit: "cover", borderRadius: 8, background: "#0f172a" }}
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <div style={{ width: 120, height: 72, borderRadius: 8, background: "#f1f5f9" }} />
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
                  {kindLabel(video.kind)}
                </div>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{video.title || "Video"}</div>
                {video.creator_label ? (
                  <div style={{ fontSize: 12, color: "#64748b" }}>{video.creator_label}</div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => onRemove(video)}
                disabled={busy}
                data-testid="operator-profile-video-remove"
                style={{
                  appearance: "none",
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontWeight: 700,
                  borderRadius: 8,
                  padding: "8px 12px",
                  cursor: busy ? "wait" : "pointer",
                  opacity: busy ? 0.65 : 1,
                }}
              >
                {busy ? "Removing…" : "Remove"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
