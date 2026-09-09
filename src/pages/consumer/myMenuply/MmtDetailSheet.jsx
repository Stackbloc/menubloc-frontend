/**
 * View / respond to a Make Me This request (owner or eligible responder).
 * Peer: one-tap "Make this for {name}?" — no Accept step for owner.
 * Owner: after an offer, specify time + place.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  closeMakeMeThisRequest,
  getMakeMeThisRequest,
  respondToMakeMeThisRequest,
  scheduleMakeMeThisMeetup,
} from "../../../lib/makeMeThisApi.js";
import * as s from "./myMenuplyStyles.js";

function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MmtDetailSheet({ open, requestId, viewerUserId, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [request, setRequest] = useState(null);
  const [scheduleForId, setScheduleForId] = useState(null);
  const [meetupAt, setMeetupAt] = useState("");
  const [meetupPlace, setMeetupPlace] = useState("");

  useEffect(() => {
    if (!open || !requestId) {
      setRequest(null);
      setError("");
      setScheduleForId(null);
      setMeetupAt("");
      setMeetupPlace("");
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMakeMeThisRequest(requestId);
        if (cancelled) return;
        setRequest(data?.request || null);
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
  const ownerName = String(request?.requester?.display_name || "them").trim() || "them";
  const viewerAlreadyOffered = Boolean(request?.viewer_has_responded);

  async function reload() {
    const data = await getMakeMeThisRequest(requestId);
    setRequest(data?.request || null);
    onUpdated?.();
  }

  async function handleOffer() {
    setBusy(true);
    setError("");
    try {
      await respondToMakeMeThisRequest(requestId, "");
      await reload();
    } catch (err) {
      setError(err?.message || "Unable to send offer");
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

  function openSchedule(row) {
    setScheduleForId(Number(row.id));
    setMeetupAt(toDatetimeLocalValue(row.meetup_at) || "");
    setMeetupPlace(String(row.meetup_place_text || "").trim());
    setError("");
  }

  async function handleSaveSchedule() {
    if (!scheduleForId) return;
    setBusy(true);
    setError("");
    try {
      await scheduleMakeMeThisMeetup(requestId, scheduleForId, {
        meetupAt: meetupAt ? new Date(meetupAt).toISOString() : "",
        meetupPlaceText: meetupPlace,
      });
      setScheduleForId(null);
      await reload();
    } catch (err) {
      setError(err?.message || "Unable to save time and place");
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
                  {Number(request.response_count) || 0} offer
                  {(Number(request.response_count) || 0) === 1 ? "" : "s"}
                  {request.status !== "open" ? " · Closed" : ""}
                </p>
                {(request.responses || []).length === 0 ? (
                  <p style={s.muted}>Waiting for someone to offer to make this.</p>
                ) : (
                  <ul style={styles.responses}>
                    {(request.responses || []).map((row) => {
                      const who = row.responder?.display_name || "Diner";
                      const scheduled = Boolean(row.meetup_at && row.meetup_place_text);
                      const editing = Number(scheduleForId) === Number(row.id);
                      return (
                        <li key={row.id} style={styles.responseItem} data-testid="mmt-owner-offer">
                          <p style={styles.offerPrompt}>
                            {who} offered to make {food} for you. Specify a time and place.
                          </p>
                          {scheduled && !editing ? (
                            <p style={styles.body} data-testid="mmt-owner-schedule-summary">
                              {new Date(row.meetup_at).toLocaleString()} · {row.meetup_place_text}
                            </p>
                          ) : null}
                          {editing ? (
                            <div style={styles.scheduleForm} data-testid="mmt-owner-schedule-form">
                              <label style={styles.label}>
                                When
                                <input
                                  type="datetime-local"
                                  value={meetupAt}
                                  onChange={(e) => setMeetupAt(e.target.value)}
                                  disabled={busy}
                                  data-testid="mmt-schedule-when"
                                  style={styles.input}
                                />
                              </label>
                              <label style={styles.label}>
                                Place
                                <input
                                  type="text"
                                  value={meetupPlace}
                                  onChange={(e) => setMeetupPlace(e.target.value)}
                                  placeholder="Home, restaurant, address…"
                                  disabled={busy}
                                  data-testid="mmt-schedule-place"
                                  style={styles.input}
                                />
                              </label>
                              <div style={styles.offerActions}>
                                <button
                                  type="button"
                                  style={s.primaryBtn}
                                  disabled={busy || !meetupAt || !meetupPlace.trim()}
                                  data-testid="mmt-schedule-save"
                                  onClick={handleSaveSchedule}
                                >
                                  {busy ? "Saving…" : "Save time & place"}
                                </button>
                                <button
                                  type="button"
                                  style={s.chipBtn}
                                  disabled={busy}
                                  onClick={() => setScheduleForId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={styles.offerActions}>
                              <button
                                type="button"
                                style={s.primaryBtn}
                                disabled={busy}
                                data-testid="mmt-offer-schedule"
                                onClick={() => openSchedule(row)}
                              >
                                {scheduled ? "Edit time & place" : "Specify time & place"}
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
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
                  {ownerName} opened <strong>{food}</strong>
                  {place ? ` from ${place}` : ""} for Make Me This.
                </p>
                {viewerAlreadyOffered ? (
                  <p style={s.muted} data-testid="mmt-peer-offered">
                    You offered to make this. They’ll send a time and place.
                  </p>
                ) : request.status !== "open" ? (
                  <p style={s.muted}>This request is closed.</p>
                ) : (
                  <button
                    type="button"
                    style={s.primaryBtn}
                    disabled={busy}
                    onClick={handleOffer}
                    data-testid="mmt-response-submit"
                  >
                    {busy ? "Sending…" : `Make this for ${ownerName}?`}
                  </button>
                )}
                {(request.responses || []).map((row) =>
                  row.meetup_at && row.meetup_place_text ? (
                    <p key={row.id} style={styles.body} data-testid="mmt-peer-schedule">
                      Time & place: {new Date(row.meetup_at).toLocaleString()} ·{" "}
                      {row.meetup_place_text}
                    </p>
                  ) : null
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
  input: {
    width: "100%",
    boxSizing: "border-box",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: 10,
    fontSize: 14,
    fontFamily: "inherit",
  },
  scheduleForm: { display: "grid", gap: 10, marginTop: 8 },
  responses: { listStyle: "none", margin: "0 0 12px", padding: 0, display: "grid", gap: 10 },
  responseItem: {
    padding: 10,
    borderRadius: 10,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  offerPrompt: {
    margin: "0 0 8px",
    fontWeight: 800,
    fontSize: 14,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  offerActions: { display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" },
  body: { fontSize: 14, lineHeight: 1.45, color: "#334155", whiteSpace: "pre-wrap" },
  error: { margin: "10px 0 0", color: "#b91c1c", fontSize: 13, fontWeight: 600 },
};
