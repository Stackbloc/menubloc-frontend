/**
 * Diner deal report box on the Deals reel (plan 78, Andre 2026-11-27).
 * Informational use only: a report is never a deal (no discount, no checkout, never Sponsored).
 * Shows "User Reported" + "Subject to restaurant confirmation · Reported Nov 27".
 * Marks (signed-in, verified email; not on your own report): Deal still on · Mark deal as expired ·
 * Wrong deal info. 3 "expired" marks from different people turn it off (server side).
 */

import { useEffect, useState } from "react";
import { apiPost } from "../../../lib/api.js";
import { useConsumer } from "../../../context/ConsumerContext.jsx";

export const DEAL_REPORT_MARKS = Object.freeze([
  { vote: "still_on", label: "Deal still on", done: "Thanks! Marked as still on." },
  { vote: "expired", label: "Mark deal as expired", done: "Thanks! When 3 people mark it, it comes down." },
  { vote: "wrong_info", label: "Wrong deal info", done: "Thanks! The restaurant can check it." },
]);

export function dealReportMarkError(err) {
  if (err?.status === 401) return "Sign in to mark this deal.";
  if (err?.code === "email_not_verified") return "Verify your email to mark deals.";
  return String(err?.error || err?.message || "").trim() || "That didn't go through. Try again.";
}

export default function DealReportBox({ item }) {
  const { consumer, isAuthenticated } = useConsumer();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const reportId = item?.deal_report_id;

  useEffect(() => {
    setOpen(false);
    setNote("");
  }, [reportId]);

  if (!item?.is_deal_report) return null;
  const ownReport = consumer?.id != null && item.reported_by != null && String(consumer.id) === String(item.reported_by);
  const canMark = !ownReport;

  async function mark(m) {
    if (busy) return;
    if (!isAuthenticated) {
      setNote("Sign in to mark this deal.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      await apiPost(`/api/consumer/deal-reports/${encodeURIComponent(String(reportId))}/marks`, { vote: m.vote });
      setNote(m.done);
      setOpen(false);
    } catch (err) {
      setNote(dealReportMarkError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.box} data-testid="feed-deals-report-box" onClick={(e) => e.stopPropagation()}>
      <div style={styles.topRow}>
        <span style={styles.label}>{item.report_label || "User Reported"}</span>
        {canMark ? (
          <button
            type="button"
            style={styles.more}
            aria-label="Deal report options"
            aria-expanded={open}
            data-testid="feed-deals-report-more"
            onClick={() => setOpen((v) => !v)}
          >
            ⋯
          </button>
        ) : null}
      </div>
      <span style={styles.disclaimer}>
        {item.report_disclaimer || "Subject to restaurant confirmation"}
        {item.reported_on ? ` · ${item.reported_on}` : ""}
      </span>
      {open ? (
        <div style={styles.marks} role="menu">
          {DEAL_REPORT_MARKS.map((m) => (
            <button
              key={m.vote}
              type="button"
              role="menuitem"
              style={styles.markBtn}
              disabled={busy}
              data-testid={`feed-deals-report-mark-${m.vote}`}
              onClick={() => mark(m)}
            >
              {m.label}
            </button>
          ))}
        </div>
      ) : null}
      {note ? (
        <span style={styles.note} role="status" data-testid="feed-deals-report-note">
          {note}
        </span>
      ) : null}
    </div>
  );
}

const styles = {
  box: {
    display: "block",
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: 10,
    padding: "6px 10px",
    margin: "4px 0 6px",
    pointerEvents: "auto",
    maxWidth: 320,
  },
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 },
  label: { fontSize: 13, fontWeight: 800, color: "#fff" },
  more: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 18,
    lineHeight: 1,
    padding: "0 4px",
    cursor: "pointer",
  },
  disclaimer: { display: "block", fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  marks: { display: "flex", flexDirection: "column", gap: 4, marginTop: 6 },
  markBtn: {
    textAlign: "left",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 8,
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    padding: "6px 10px",
    cursor: "pointer",
  },
  note: { display: "block", fontSize: 12, color: "#fff", marginTop: 6 },
};
