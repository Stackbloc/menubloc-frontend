import React, { useCallback, useEffect, useState } from "react";
import { OWNER_COLORS, PageCard, SectionTitle, EmptyState } from "./OwnerLayout.jsx";
import {
  createOwnerRestaurantEvent,
  deleteOwnerRestaurantEvent,
  listOwnerRestaurantEventRsvps,
  listOwnerRestaurantEvents,
  setOwnerRestaurantEventsEnabled,
  setOwnerRestaurantEventStatus,
  updateOwnerRestaurantEvent,
} from "../../lib/ownerApi.js";

/**
 * Restaurant Manager → Events (Events restore, Andre 2026-11-15). Venues make Events too: turn
 * Events on for this restaurant, then create (always a draft), edit, publish, pause, cancel or
 * delete its events, see who RSVP'd and copy the event link. Published events show on menuply.com
 * and in the app (cluster Events, the restaurant's profile). Same rules as the restaurant's own
 * Owner portal at /operator/events (ticket types live there).
 */

const SITE = "https://menuply.com";
const STATUS_LABEL = { draft: "Draft", published: "Live", paused: "Paused", cancelled: "Cancelled", completed: "Ended" };
const EMPTY = { name: "", date: "", time: "", venue_label: "", description: "", cover_photo_url: "", age_requirement_min: "", capacity: "" };

function toLocalParts(startsAt) {
  if (!startsAt) return { date: "", time: "" };
  const d = new Date(startsAt);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n) => String(n).padStart(2, "0");
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

function whenLabel(ev) {
  if (ev.starts_at) {
    const d = new Date(ev.starts_at);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    }
  }
  return ev.event_date || "No date yet";
}

function formToBody(form) {
  const startsAt = form.date ? new Date(`${form.date}T${form.time || "19:00"}:00`).toISOString() : null;
  const num = (v) => (v === "" || v == null ? null : Number(v));
  return {
    name: form.name.trim(),
    event_date: form.date || null,
    starts_at: startsAt,
    venue_label: form.venue_label.trim() || null,
    description: form.description.trim() || null,
    cover_photo_url: form.cover_photo_url.trim() || null,
    age_requirement_min: num(form.age_requirement_min),
    capacity: num(form.capacity),
  };
}

const input = { width: "100%", padding: "9px 11px", borderRadius: 10, border: `1px solid ${OWNER_COLORS.line}`, fontSize: 14, boxSizing: "border-box" };
const label = { display: "grid", gap: 4, fontSize: 12, fontWeight: 700, color: OWNER_COLORS.muted };
const linkBtn = { background: "none", border: "none", padding: 0, color: OWNER_COLORS.accent || "#0f7a24", fontWeight: 700, fontSize: 13, cursor: "pointer" };
const dangerBtn = { ...linkBtn, color: "#b42318" };
const primaryBtn = { padding: "8px 16px", borderRadius: 999, border: "none", background: "#111613", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" };

function EventForm({ initial, busy, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <form
      data-testid="owner-event-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (form.name.trim()) onSave(formToBody(form));
      }}
      style={{ display: "grid", gap: 10, padding: 14, borderRadius: 14, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff" }}
    >
      <label style={label}>
        Name
        <input style={input} value={form.name} onChange={set("name")} maxLength={160} required data-testid="owner-event-name" />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={label}>
          Day
          <input type="date" style={input} value={form.date} onChange={set("date")} data-testid="owner-event-date" />
        </label>
        <label style={label}>
          Starts
          <input type="time" style={input} value={form.time} onChange={set("time")} data-testid="owner-event-time" />
        </label>
      </div>
      <label style={label}>
        Where in the venue (optional)
        <input style={input} value={form.venue_label} onChange={set("venue_label")} placeholder="Patio, back room…" data-testid="owner-event-venue" />
      </label>
      <label style={label}>
        About
        <textarea style={{ ...input, minHeight: 70 }} value={form.description} onChange={set("description")} data-testid="owner-event-description" />
      </label>
      <label style={label}>
        Photo link (optional)
        <input style={input} value={form.cover_photo_url} onChange={set("cover_photo_url")} placeholder="https://…" data-testid="owner-event-photo" />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={label}>
          Minimum age (optional)
          <input type="number" min="0" max="120" style={input} value={form.age_requirement_min} onChange={set("age_requirement_min")} />
        </label>
        <label style={label}>
          Capacity (optional)
          <input type="number" min="0" style={input} value={form.capacity} onChange={set("capacity")} />
        </label>
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "flex-end" }}>
        <button type="button" style={linkBtn} onClick={onCancel}>
          Close
        </button>
        <button type="submit" style={primaryBtn} disabled={busy || !form.name.trim()} data-testid="owner-event-save">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function Rsvps({ restaurantId, eventId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    listOwnerRestaurantEventRsvps(restaurantId, eventId)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message || "RSVPs didn't load"));
    return () => {
      alive = false;
    };
  }, [restaurantId, eventId]);
  if (error) return <div style={{ color: "#b42318", fontSize: 13 }}>{error}</div>;
  if (!data) return <div style={{ color: OWNER_COLORS.muted, fontSize: 13 }}>Loading RSVPs…</div>;
  const rows = data.rsvps || [];
  const c = data.rsvp_counts || {};
  return (
    <div data-testid={`owner-event-rsvps-${eventId}`} style={{ fontSize: 13, color: OWNER_COLORS.ink, display: "grid", gap: 4 }}>
      <div style={{ fontWeight: 700 }}>
        {c.going || 0} going · {c.interested || 0} interested · {c.not_going || 0} not going
      </div>
      {rows.length ? (
        rows.map((r) => (
          <div key={r.consumer_user_id}>
            {r.display_name} — {r.status === "not_going" ? "not going" : r.status}
          </div>
        ))
      ) : (
        <div style={{ color: OWNER_COLORS.muted }}>No RSVPs yet.</div>
      )}
    </div>
  );
}

export default function OwnerRestaurantEventsPanel({ restaurantId, restaurantName }) {
  const [state, setState] = useState({ loading: true, enabled: false, events: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null); // "new" | event id
  const [openRsvps, setOpenRsvps] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    try {
      const d = await listOwnerRestaurantEvents(restaurantId);
      setState({ loading: false, enabled: d.capability_enabled === true, events: d.events || [] });
    } catch (e) {
      setState((s) => ({ ...s, loading: false }));
      setError(e.message || "Events didn't load");
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await load();
      return true;
    } catch (e) {
      setError(e.message || "That didn't work");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const confirmRun = (message, fn) => {
    if (typeof window === "undefined" || window.confirm(message)) run(fn);
  };

  function copyLink(ev) {
    const url = `${SITE}/events/${encodeURIComponent(ev.slug)}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(ev.id);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const name = restaurantName || "this restaurant";
  return (
    <PageCard style={{ padding: 20 }}>
      <SectionTitle
        title="Events"
        subtitle={`Parties, live music, trivia and specials at ${name}. Nothing shows to diners until you publish it.`}
        action={
          state.enabled && editing !== "new" ? (
            <button type="button" style={primaryBtn} onClick={() => setEditing("new")} data-testid="owner-events-new">
              New event
            </button>
          ) : null
        }
      />
      {error ? (
        <div style={{ color: "#b42318", fontSize: 13, marginBottom: 10 }} data-testid="owner-events-error">
          {error}
        </div>
      ) : null}
      {state.loading ? (
        <div style={{ color: OWNER_COLORS.muted }}>Loading…</div>
      ) : !state.enabled ? (
        <EmptyState>
          <div data-testid="owner-events-off" style={{ display: "grid", gap: 10 }}>
            <div>Events are off for {name}. Turn them on to create events diners can find and RSVP to.</div>
            <div>
              <button type="button" style={primaryBtn} disabled={busy} onClick={() => run(() => setOwnerRestaurantEventsEnabled(restaurantId, true))} data-testid="owner-events-enable">
                Turn on Events
              </button>
            </div>
          </div>
        </EmptyState>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {editing === "new" ? (
            <EventForm
              initial={EMPTY}
              busy={busy}
              onCancel={() => setEditing(null)}
              onSave={async (body) => {
                if (await run(() => createOwnerRestaurantEvent(restaurantId, body))) setEditing(null);
              }}
            />
          ) : null}
          {state.events.length === 0 && editing !== "new" ? <EmptyState>No events yet.</EmptyState> : null}
          {state.events.map((ev) =>
            editing === ev.id ? (
              <EventForm
                key={ev.id}
                initial={{
                  ...EMPTY,
                  name: ev.name || "",
                  ...toLocalParts(ev.starts_at),
                  ...(ev.starts_at ? {} : { date: ev.event_date || "" }),
                  venue_label: ev.venue_label || "",
                  description: ev.description || "",
                  cover_photo_url: ev.cover_photo_url || "",
                  age_requirement_min: ev.age_requirement_min ?? "",
                  capacity: ev.capacity ?? "",
                }}
                busy={busy}
                onCancel={() => setEditing(null)}
                onSave={async (body) => {
                  if (await run(() => updateOwnerRestaurantEvent(restaurantId, ev.id, body))) setEditing(null);
                }}
              />
            ) : (
              <div key={ev.id} data-testid={`owner-event-${ev.id}`} style={{ padding: 14, borderRadius: 14, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: OWNER_COLORS.ink }}>{ev.name}</div>
                    <div style={{ fontSize: 13, color: OWNER_COLORS.muted }}>
                      {[whenLabel(ev), ev.venue_label].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: ev.status === "published" ? "#0f7a24" : ev.status === "cancelled" ? "#b42318" : OWNER_COLORS.muted }} data-testid={`owner-event-status-${ev.id}`}>
                    {STATUS_LABEL[ev.status] || ev.status}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {ev.status !== "published" && ev.status !== "cancelled" ? (
                    <button type="button" style={linkBtn} disabled={busy} onClick={() => run(() => setOwnerRestaurantEventStatus(restaurantId, ev.id, "publish"))} data-testid={`owner-event-publish-${ev.id}`}>
                      Publish
                    </button>
                  ) : null}
                  {ev.status === "published" ? (
                    <>
                      <button type="button" style={linkBtn} onClick={() => copyLink(ev)} data-testid={`owner-event-link-${ev.id}`}>
                        {copied === ev.id ? "Link copied" : "Copy link"}
                      </button>
                      <button type="button" style={linkBtn} disabled={busy} onClick={() => run(() => setOwnerRestaurantEventStatus(restaurantId, ev.id, "pause"))} data-testid={`owner-event-pause-${ev.id}`}>
                        Pause
                      </button>
                    </>
                  ) : null}
                  {ev.status !== "cancelled" ? (
                    <button type="button" style={linkBtn} onClick={() => setEditing(ev.id)} data-testid={`owner-event-edit-${ev.id}`}>
                      Edit
                    </button>
                  ) : null}
                  <button type="button" style={linkBtn} onClick={() => setOpenRsvps(openRsvps === ev.id ? null : ev.id)} data-testid={`owner-event-rsvps-toggle-${ev.id}`}>
                    {openRsvps === ev.id ? "Hide RSVPs" : "RSVPs"}
                  </button>
                  {ev.status === "published" || ev.status === "paused" ? (
                    <button
                      type="button"
                      style={dangerBtn}
                      disabled={busy}
                      onClick={() => confirmRun(`Cancel "${ev.name}"? People who RSVP'd will see it was cancelled.`, () => setOwnerRestaurantEventStatus(restaurantId, ev.id, "cancel"))}
                      data-testid={`owner-event-cancel-${ev.id}`}
                    >
                      Cancel event
                    </button>
                  ) : (
                    <button
                      type="button"
                      style={dangerBtn}
                      disabled={busy}
                      onClick={() => confirmRun(`Delete "${ev.name}" for good?`, () => deleteOwnerRestaurantEvent(restaurantId, ev.id))}
                      data-testid={`owner-event-delete-${ev.id}`}
                    >
                      Delete
                    </button>
                  )}
                </div>
                {openRsvps === ev.id ? <Rsvps restaurantId={restaurantId} eventId={ev.id} /> : null}
              </div>
            ),
          )}
          <div>
            <button
              type="button"
              style={{ ...linkBtn, color: OWNER_COLORS.muted, fontWeight: 600 }}
              disabled={busy}
              onClick={() => confirmRun(`Turn off Events for ${name}? Its events stop showing to diners.`, () => setOwnerRestaurantEventsEnabled(restaurantId, false))}
              data-testid="owner-events-disable"
            >
              Turn off Events
            </button>
          </div>
        </div>
      )}
    </PageCard>
  );
}
