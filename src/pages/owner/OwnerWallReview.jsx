import React, { useCallback, useEffect, useState } from "react";
import { PageCard } from "./OwnerLayout.jsx";
import { actOnOwnerWallBlock, getOwnerWallQueue } from "../../lib/ownerContentReportsApi.js";
import { formatApiErrorForDisplay } from "../../lib/apiErrorDisplay.js";
import { WALL_THEMES, wallStyle } from "../../lib/clusterWallStyles.js";

const REVIEW_REASON = {
  clip: "New clip — needs a look before it shows",
  copy_paste: "Same text from several accounts — held",
};

const btn = (bg, fg, border = "transparent") => ({
  borderRadius: 4, padding: "7px 14px", fontSize: 14, fontWeight: 700, cursor: "pointer",
  background: bg, color: fg, border: `1px solid ${border}`,
});

/**
 * Owner → Reports → Wall review (Cluster Wall, plan 24). Clips always wait here (Andre decision 2);
 * text lands here only when held as copy-paste spam or hidden by 3 reports.
 * Approve = shows on the Wall. Remove = gone, link dark, files deleted.
 */
export default function OwnerWallReview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    getOwnerWallQueue()
      .then((d) => {
        setError("");
        setData(d);
      })
      .catch((err) => setError(formatApiErrorForDisplay(err)));
  }, []);
  useEffect(load, [load]);

  async function act(block, action) {
    setBusyId(block.id);
    setError("");
    try {
      await actOnOwnerWallBlock(block.id, action);
      load();
    } catch (err) {
      setError(formatApiErrorForDisplay(err));
    } finally {
      setBusyId(null);
    }
  }

  const blocks = data?.blocks || [];
  if (data?.migration_pending) return null;
  return (
    <section data-testid="owner-wall-review" style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 18, margin: "0 0 10px" }}>Wall review {blocks.length ? `(${blocks.length})` : ""}</h2>
      {error ? <p role="alert" style={{ color: "#b42318" }}>{error}</p> : null}
      {data && !blocks.length ? <p style={{ color: "#5c665f", margin: 0 }}>Nothing waiting on the Wall.</p> : null}
      {blocks.map((b) => {
        const theme = WALL_THEMES[wallStyle(b.style).theme];
        const why = b.status === "hidden" ? `Hidden after ${b.report_count} reports` : REVIEW_REASON[b.moderation?.review] || "Waiting for review";
        return (
          <PageCard key={b.id} style={{ padding: 16, marginBottom: 10 }} data-testid="owner-wall-review-item">
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
              {b.kind === "video" ? (
                b.review_video_url ? (
                  <video src={b.review_video_url} controls muted playsInline preload="metadata" style={{ width: 180, maxHeight: 320, borderRadius: 4, background: "#000" }} />
                ) : null
              ) : (
                <div style={{ width: 180, minHeight: 90, padding: 10, borderRadius: 3, background: theme.paper, color: theme.ink, fontWeight: 700, whiteSpace: "pre-wrap", boxSizing: "border-box" }}>
                  {b.body}
                </div>
              )}
              <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 6 }}>
                <strong>{why}</strong>
                {b.kind === "video" && b.body ? <span>Caption: “{b.body}”</span> : null}
                <span style={{ color: "#5c665f", fontSize: 14 }}>
                  {b.cluster_label} Wall · {b.size} · by {b.author?.first_name || "a diner"} (#{b.poster_user_id}) · {new Date(b.created_at).toLocaleString()}
                </span>
                {b.kind === "video" && b.media_status !== "ready" ? (
                  <span style={{ fontSize: 14, color: b.media_status === "failed" ? "#b42318" : "#92400e" }}>
                    {b.media_status === "failed" ? b.media_error || "Processing failed" : "Still processing — approve once it's ready."}
                  </span>
                ) : null}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  <button
                    type="button"
                    disabled={busyId === b.id || (b.kind === "video" && b.media_status !== "ready")}
                    style={btn("#111827", "#fff")}
                    onClick={() => act(b, "approve")}
                  >
                    {b.status === "hidden" ? "Put back" : "Approve"}
                  </button>
                  <button type="button" disabled={busyId === b.id} style={btn("#b42318", "#fff")} onClick={() => act(b, "remove")}>
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </PageCard>
        );
      })}
    </section>
  );
}
