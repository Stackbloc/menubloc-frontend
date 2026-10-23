/**
 * Dish video comments on the dish page (C2, Andre 2026-10-22). A row of portrait tiles; tap one
 * to play it with sound. Hidden when the dish has no video comments. Refreshes after a post
 * from DishVideoCommentSheet (DISH_VIDEO_COMMENT_POSTED_EVENT).
 */
import { useEffect, useState } from "react";
import {
  DISH_VIDEO_COMMENT_POSTED_EVENT,
  listDishVideoComments,
} from "../../lib/dishVideoCommentsApi.js";

function formatWhen(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function DishVideoComments({ menuItemId }) {
  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(0);
  const [playingId, setPlayingId] = useState(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!menuItemId) return undefined;
    let cancelled = false;
    listDishVideoComments(menuItemId, { limit: 24 })
      .then((res) => {
        if (cancelled) return;
        setComments(Array.isArray(res?.comments) ? res.comments : []);
        setTotal(Number(res?.total) || 0);
      })
      .catch(() => {
        if (cancelled) return;
        setComments([]);
        setTotal(0);
      });
    return () => {
      cancelled = true;
    };
  }, [menuItemId, reloadKey]);

  useEffect(() => {
    function onPosted(event) {
      if (String(event?.detail?.menuItemId) === String(menuItemId)) setReloadKey((k) => k + 1);
    }
    window.addEventListener(DISH_VIDEO_COMMENT_POSTED_EVENT, onPosted);
    return () => window.removeEventListener(DISH_VIDEO_COMMENT_POSTED_EVENT, onPosted);
  }, [menuItemId]);

  if (!comments.length) return null;

  return (
    <section data-testid="dish-video-comments" aria-label="Video comments" style={styles.section}>
      <div style={styles.title}>
        Video comments <span style={styles.count}>{total}</span>
      </div>
      <div style={styles.row}>
        {comments.map((c) => {
          const playing = playingId === c.id;
          return (
            <figure key={c.id} style={styles.tile} data-testid="dish-video-comment-tile">
              <video
                src={c.video_url}
                style={styles.video}
                playsInline
                preload="metadata"
                controls={playing}
                muted={!playing}
                autoPlay={playing}
                onEnded={() => setPlayingId(null)}
                onClick={() => setPlayingId(playing ? null : c.id)}
                aria-label={`Video comment by ${c.author_display_name || "a diner"}`}
              />
              {!playing ? (
                <button
                  type="button"
                  style={styles.play}
                  onClick={() => setPlayingId(c.id)}
                  aria-label={`Play video comment by ${c.author_display_name || "a diner"}`}
                >
                  ▶
                </button>
              ) : null}
              <figcaption style={styles.caption}>
                <span style={styles.author}>{c.author_display_name || "Diner"}</span>
                <span style={styles.when}>{formatWhen(c.created_at)}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}

const styles = {
  section: { marginTop: 20 },
  title: { fontSize: 15, fontWeight: 700, color: "var(--mp-ink, #111613)", marginBottom: 10 },
  count: { fontSize: 13, fontWeight: 600, color: "var(--mp-ink-muted, #5c665f)", marginLeft: 4 },
  row: { display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4, scrollSnapType: "x mandatory" },
  tile: { position: "relative", flex: "0 0 auto", width: 144, margin: 0, scrollSnapAlign: "start" },
  video: {
    display: "block",
    width: 144,
    height: 256,
    objectFit: "cover",
    borderRadius: 10,
    background: "#000",
  },
  play: {
    position: "absolute",
    top: 104,
    left: 48,
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.55)",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
  },
  caption: { display: "flex", justifyContent: "space-between", gap: 6, marginTop: 6, fontSize: 12 },
  author: { fontWeight: 600, color: "var(--mp-ink, #111613)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  when: { color: "var(--mp-ink-muted, #5c665f)", flexShrink: 0 },
};
