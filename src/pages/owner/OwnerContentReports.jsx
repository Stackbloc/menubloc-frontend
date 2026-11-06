import React, { useCallback, useEffect, useState } from "react";
import OwnerLayout, { EmptyState, PageCard } from "./OwnerLayout.jsx";
import { getOwnerContentReports, resolveOwnerContentReport } from "../../lib/ownerContentReportsApi.js";
import { formatApiErrorForDisplay } from "../../lib/apiErrorDisplay.js";
import OwnerWallReview from "./OwnerWallReview.jsx";
import OwnerWallHouseBrick from "./OwnerWallHouseBrick.jsx";

/**
 * Owner → Reports (Play Store safety, Andre approved 2026-11-02, plan 18). Diners report a clip or a dish
 * video comment; it's hidden for them at once. Here: watch it, then Remove clip (hidden for everyone),
 * Disable account (account off + all their clips down) or Dismiss. Plans, events, Menuply and deal clips
 * are removed in Clip Manager.
 */
const pill = (bg, fg, border = "transparent") => ({
  borderRadius: 999, padding: "7px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer",
  background: bg, color: fg, border: `1px solid ${border}`,
});
const KIND_LABEL = {
  ate: "Diner clip", want: "Wish List clip", cooking: "Cooking clip", food_activity: "Food activity clip",
  video_comment: "Dish video comment", wall: "Wall post", plan: "Social plan clip", event: "Event clip", managed: "Menuply clip", deal: "Deal clip",
};

export default function OwnerContentReports() {
  const [status, setStatus] = useState("open");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setError("");
    getOwnerContentReports(status)
      .then(setData)
      .catch((err) => setError(formatApiErrorForDisplay(err)));
  }, [status]);
  useEffect(load, [load]);

  async function act(report, action) {
    if (action === "disable" && !window.confirm(`Disable ${report.poster_name || `diner #${report.poster_user_id}`}? Their account turns off and all their clips come down.`)) return;
    setBusyId(report.id);
    setError("");
    try {
      await resolveOwnerContentReport(report.id, action);
      load();
    } catch (err) {
      setError(formatApiErrorForDisplay(err));
    } finally {
      setBusyId(null);
    }
  }

  const reports = data?.reports || [];
  return (
    <OwnerLayout
      title="Reports"
      actions={(
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Show" style={{ padding: "8px 10px", borderRadius: 8 }}>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      )}
    >
      {status === "open" ? <OwnerWallReview /> : null}
      {status === "open" ? <OwnerWallHouseBrick slug="usc" /> : null}
      {error ? <p role="alert" style={{ color: "#b42318" }}>{error}</p> : null}
      {data?.migration_pending ? <p>Reports aren&apos;t set up in the database yet (migration 0382).</p> : null}
      {data && !reports.length ? (
        <PageCard style={{ padding: 22 }}>
          <EmptyState>{status === "open" ? "No open reports." : "No resolved reports yet."}</EmptyState>
        </PageCard>
      ) : null}
      {reports.map((r) => (
        <PageCard key={r.id} style={{ padding: 18, marginBottom: 12 }} data-testid="owner-content-report">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            {r.video_url ? (
              <video src={r.video_url} controls muted playsInline preload="metadata" style={{ width: 180, maxHeight: 320, borderRadius: 10, background: "#000" }} />
            ) : null}
            <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 6 }}>
              <strong>{r.reason_label}</strong>
              {r.note ? <span>“{r.note}”</span> : null}
              {r.wall?.body ? <span style={{ whiteSpace: "pre-wrap" }}>Wall post: “{r.wall.body}”</span> : null}
              <span style={{ color: "#5c665f", fontSize: 14 }}>
                {KIND_LABEL[r.content_kind] || r.content_kind} #{r.content_id}
                {r.reports_on_clip > 1 ? ` · reported ${r.reports_on_clip} times` : ""}
              </span>
              <span style={{ color: "#5c665f", fontSize: 14 }}>
                Posted by {r.poster_user_id ? `${r.poster_name || "a diner"} (#${r.poster_user_id})${r.poster_status === "disabled" ? " · disabled" : ""}` : "Menuply / a restaurant"}
                {" · "}reported by {r.reporter_name || `diner #${r.reporter_user_id}`} · {new Date(r.created_at).toLocaleString()}
              </span>
              {r.status === "resolved" ? (
                <span style={{ fontSize: 14 }}>Resolved: {r.resolution}</span>
              ) : (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {r.can_remove ? (
                    <button type="button" disabled={busyId === r.id} style={pill("#b42318", "#fff")} onClick={() => act(r, "remove")}>{r.content_kind === "wall" ? "Remove post" : "Remove clip"}</button>
                  ) : (
                    <span style={{ fontSize: 14, color: "#5c665f" }}>Remove this one in Clip Manager.</span>
                  )}
                  {r.can_disable && r.poster_status !== "disabled" ? (
                    <button type="button" disabled={busyId === r.id} style={pill("#fff", "#b42318", "#b42318")} onClick={() => act(r, "disable")}>Disable account</button>
                  ) : null}
                  <button type="button" disabled={busyId === r.id} style={pill("#fff", "#111613", "#e1e6e1")} onClick={() => act(r, "dismiss")}>Dismiss</button>
                </div>
              )}
            </div>
          </div>
        </PageCard>
      ))}
    </OwnerLayout>
  );
}
