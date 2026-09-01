/**
 * View / respond to a Make Me This request (owner or eligible responder).
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  closeMakeMeThisRequest,
  getMakeMeThisRequest,
  respondToMakeMeThisRequest,
} from "../../../lib/makeMeThisApi.js";
import * as s from "./myMenuplyStyles.js";

export default function MmtDetailSheet({ open, requestId, viewerUserId, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!open || !requestId) {
      setRequest(null);
      setDraft("");
      setError("");
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMakeMeThisRequest(requestId);
        if (cancelled) return;
        const req = data?.request || null;
        setRequest(req);
        const mine = (req?.responses || []).find(
          (row) => !row.responder || Number(row.responder?.id) === Number(viewerUserId)
        );
        setDraft(mine?.body || "");
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load request");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, requestId, viewerUserId]);

  if (!open || !requestId || typeof document === "undefined") return null;

  const isOwner = Number(request?.requester_user_id) === Number(viewerUserId);
  const food = String(request?.food_name || request?.item_name || "This dish").trim();
  const place = String(request?.restaurant_name || "").trim();

  async function handleRespond() {
    setBusy(true);
    setError("");
    try {
      await respondToMakeMeThisRequest(requestId, draft);
      const data = await getMakeMeThisRequest(requestId);
      setRequest(data?.request || null);
      onUpdated?.();
    } catch (err) {
      setError(err?.message || "Unable to send response");
    } finally {
      setBusy(false);
    }
  }

  async function handleClose() {
    setBusy(true);
    setError("");
    try {
      await closeMakeMeThisRequest(requestId);
      onUpdated?.();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Unable to close request");
    } finally {
      setBusy(false);
    }
  }

  return createPortal(
    <div
      role="presentation"
      data-testid="mmt-detail-sheet"
      style={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div role="dialog" aria-modal="true" style={styles.sheet}>
        <h2 style={styles.title}>Make Me This</h2>
        {loading ? (
          <p style={s.muted}>Loading…</p>
        ) : request ? (
          <>
            <p style={styles.lead}>
              <strong>{food}</strong>
              {place ? ` · ${place}` : ""}
            </p>
            {isOwner ? (
              <>
                <p style={s.muted}>
                  {Number(request.response_count) || 0} response
                  {(Number(request.response_count) || 0) === 1 ? "" : "s"}
                  {request.status !== "open" ? " · Closed" : ""}
                </p>
                {(request.responses || []).length === 0 ? (
                  <p style={s.muted}>Waiting for someone to share how to make this.</p>
                ) : (
                  <ul style={styles.responses}>
                    {(request.responses || []).map((row) => (
                      <li key={row.id} style={styles.responseItem}>
                        <div style={styles.responder}>
                          {row.responder?.display_name || "Diner"}
                        </div>
                        <div style={styles.body}>{row.body}</div>
                      </li>
                    ))}
                  </ul>
                )}
                {request.status === "open" ? (
                  <button
                    type="button"
                    style={s.chipBtn}
                    disabled={busy}
                    onClick={handleClose}
                    data-testid="mmt-close-request"
                  >
                    Close request
                  </button>
                ) : null}
              </>
            ) : (
              <>
                <p style={styles.lead}>
                  {request.requester?.display_name || "Someone"} asked how to make this. Share
                  your recipe or steps — only they can see it.
                </p>
                <label style={styles.label}>
                  How to make it
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={6}
                    style={styles.textarea}
                    disabled={busy || request.status !== "open"}
                    data-testid="mmt-response-input"
                  />
                </label>
                {request.status !== "open" ? (
                  <p style={s.muted}>This request is closed.</p>
                ) : (
                  <button
                    type="button"
                    style={s.primaryBtn}
                    disabled={busy || !draft.trim()}
                    onClick={handleRespond}
                    data-testid="mmt-response-submit"
                  >
                    {busy ? "Sending…" : "Send response"}
                  </button>
                )}
              </>
            )}
          </>
        ) : null}
        {error ? (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        ) : null}
        <div style={{ marginTop: 12 }}>
          <button type="button" style={s.chipBtn} disabled={busy} onClick={() => onClose?.()}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 370,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 16,
  },
  sheet: {
    width: "min(420px, 100%)",
    maxHeight: "85vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 16,
    padding: 18,
    fontFamily: "Inter, Arial, sans-serif",
    boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
  },
  title: { margin: "0 0 8px", fontSize: 18, fontWeight: 900, color: "#0f172a" },
  lead: { margin: "0 0 12px", fontSize: 14, lineHeight: 1.45, color: "#475569" },
  label: { display: "grid", gap: 6, fontSize: 13, fontWeight: 700, color: "#0f172a" },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: 10,
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
  },
  responses: { listStyle: "none", margin: "0 0 12px", padding: 0, display: "grid", gap: 10 },
  responseItem: {
    padding: 10,
    borderRadius: 10,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  responder: { fontWeight: 800, fontSize: 13, marginBottom: 4, color: "#0f172a" },
  body: { fontSize: 14, lineHeight: 1.45, color: "#334155", whiteSpace: "pre-wrap" },
  error: { margin: "10px 0 0", color: "#b91c1c", fontSize: 13, fontWeight: 600 },
};
