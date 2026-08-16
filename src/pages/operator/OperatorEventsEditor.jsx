/**
 * Operator Venue Events editor (Phase 4).
 * CRUD + ticket type config. Purchase checkout is intentionally stubbed.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OperatorLayout from "./OperatorLayout.jsx";
import { useOperator } from "../../context/OperatorContext.jsx";
import * as api from "../../lib/operatorApi.js";

const CARD = {
  padding: 16,
  borderRadius: 12,
  border: "1px solid #e4e9f0",
  background: "#fff",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  event_date: "",
  starts_at: "",
  ends_at: "",
  venue_label: "",
  age_requirement_min: "",
  capacity: "",
  rules: "",
  refund_policy: "",
  sales_starts_at: "",
  sales_ends_at: "",
};

const EMPTY_TICKET = {
  ticket_kind: "ga",
  name: "",
  description: "",
  price: "",
  quantity_total: "",
};

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatCents(cents) {
  if (!Number.isFinite(Number(cents))) return "$0.00";
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

export default function OperatorEventsEditor() {
  const { selectedRestaurant } = useOperator();
  const rid = selectedRestaurant?.id || null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [venueOn, setVenueOn] = useState(false);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ticketForm, setTicketForm] = useState(EMPTY_TICKET);
  const [ticketEventId, setTicketEventId] = useState(null);

  const load = useCallback(async () => {
    if (!rid) return;
    setLoading(true);
    setError("");
    try {
      const caps = await api.getRestaurantCapabilities(rid);
      const enabled = caps?.venue_capability_enabled === true;
      setVenueOn(enabled);
      if (!enabled) {
        setEvents([]);
        return;
      }
      const data = await api.listVenueEvents(rid);
      setEvents(Array.isArray(data?.events) ? data.events : []);
    } catch (err) {
      setError(err?.message || "Could not load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [rid]);

  useEffect(() => {
    load();
  }, [load]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setTicketEventId(null);
  }

  function startEdit(ev) {
    setEditingId(ev.id);
    setForm({
      name: ev.name || "",
      description: ev.description || "",
      event_date: ev.event_date || ev.date || "",
      starts_at: toLocalInput(ev.starts_at),
      ends_at: toLocalInput(ev.ends_at),
      venue_label: ev.venue_label || "",
      age_requirement_min:
        ev.age_requirement_min == null ? "" : String(ev.age_requirement_min),
      capacity: ev.capacity == null ? "" : String(ev.capacity),
      rules: ev.rules || "",
      refund_policy: ev.refund_policy || "",
      sales_starts_at: toLocalInput(ev.sales_starts_at),
      sales_ends_at: toLocalInput(ev.sales_ends_at),
    });
    setTicketEventId(ev.id);
    setTicketForm(EMPTY_TICKET);
  }

  function buildPayload() {
    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      event_date: form.event_date || null,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
      venue_label: form.venue_label.trim() || null,
      age_requirement_min: form.age_requirement_min === "" ? null : Number(form.age_requirement_min),
      capacity: form.capacity === "" ? null : Number(form.capacity),
      rules: form.rules.trim() || null,
      refund_policy: form.refund_policy.trim() || null,
      sales_starts_at: fromLocalInput(form.sales_starts_at),
      sales_ends_at: fromLocalInput(form.sales_ends_at),
    };
  }

  async function saveEvent(e) {
    e.preventDefault();
    if (!rid || busy) return;
    setBusy(true);
    setError("");
    try {
      const payload = buildPayload();
      if (!payload.name) throw new Error("Event name is required");
      if (editingId) {
        await api.updateVenueEvent(rid, editingId, payload);
      } else {
        const created = await api.createVenueEvent(rid, payload);
        setEditingId(created?.event?.id || null);
        setTicketEventId(created?.event?.id || null);
      }
      await load();
    } catch (err) {
      setError(err?.message || "Could not save event");
    } finally {
      setBusy(false);
    }
  }

  async function publish(id) {
    if (!rid || busy) return;
    setBusy(true);
    try {
      await api.publishVenueEvent(rid, id);
      await load();
    } catch (err) {
      setError(err?.message || "Could not publish");
    } finally {
      setBusy(false);
    }
  }

  async function pause(id) {
    if (!rid || busy) return;
    setBusy(true);
    try {
      await api.pauseVenueEvent(rid, id);
      await load();
    } catch (err) {
      setError(err?.message || "Could not pause");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!rid || busy) return;
    if (!window.confirm("Delete this event?")) return;
    setBusy(true);
    try {
      await api.deleteVenueEvent(rid, id);
      if (editingId === id) startCreate();
      await load();
    } catch (err) {
      setError(err?.message || "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  async function addTicket(e) {
    e.preventDefault();
    if (!rid || !ticketEventId || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.createVenueEventTicketType(rid, ticketEventId, {
        ticket_kind: ticketForm.ticket_kind,
        name: ticketForm.name.trim(),
        description: ticketForm.description.trim() || null,
        price: ticketForm.price === "" ? 0 : Number(ticketForm.price),
        quantity_total: ticketForm.quantity_total === "" ? null : Number(ticketForm.quantity_total),
      });
      setTicketForm(EMPTY_TICKET);
      await load();
    } catch (err) {
      setError(err?.message || "Could not add ticket type");
    } finally {
      setBusy(false);
    }
  }

  async function removeTicket(eventId, ticketId) {
    if (!rid || busy) return;
    setBusy(true);
    try {
      await api.deleteVenueEventTicketType(rid, eventId, ticketId);
      await load();
    } catch (err) {
      setError(err?.message || "Could not remove ticket type");
    } finally {
      setBusy(false);
    }
  }

  const selected = events.find((ev) => ev.id === ticketEventId) || null;

  return (
    <OperatorLayout title="Manage Events">
      <div data-testid="operator-events-editor" style={{ maxWidth: 920, display: "grid", gap: 16 }}>
        <div style={{ fontSize: 14, color: "#5b6675", lineHeight: 1.5 }}>
          Create reusable Event objects for this Venue. Ticket types are configuration only —
          purchase checkout uses existing commerce later and is not enabled here.
        </div>

        <div style={{ fontSize: 13 }}>
          <Link to="/operator/events" style={{ color: "#166534", fontWeight: 700 }}>
            ← Events / Venue package
          </Link>
        </div>

        {loading ? <div style={{ color: "#5b6675" }}>Loading…</div> : null}
        {error ? (
          <div role="alert" style={{ color: "#b91c1c", fontSize: 13 }}>
            {error}
          </div>
        ) : null}

        {!loading && !venueOn ? (
          <div style={CARD}>
            Enable Venue capability on the{" "}
            <Link to="/operator/events" style={{ color: "#166534", fontWeight: 700 }}>
              Events / Venue
            </Link>{" "}
            page before creating events.
          </div>
        ) : null}

        {venueOn ? (
          <>
            <div style={{ ...CARD, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ fontWeight: 800 }}>Events</div>
                <button type="button" onClick={startCreate} style={{ fontWeight: 700 }}>
                  New event
                </button>
              </div>
              {!events.length ? (
                <div style={{ color: "#5b6675", fontSize: 13 }}>No events yet.</div>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
                  {events.map((ev) => (
                    <li
                      key={ev.id}
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderRadius: 10,
                        border: "1px solid #e7e5e4",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700 }}>{ev.name}</div>
                        <div style={{ fontSize: 12, color: "#78716c" }}>
                          {ev.status}
                          {ev.age_requirement_label ? ` · ${ev.age_requirement_label}` : ""}
                          {ev.date ? ` · ${ev.date}` : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => startEdit(ev)}>
                          Edit
                        </button>
                        {ev.status !== "published" ? (
                          <button type="button" onClick={() => publish(ev.id)}>
                            Publish
                          </button>
                        ) : (
                          <button type="button" onClick={() => pause(ev.id)}>
                            Pause
                          </button>
                        )}
                        <button type="button" onClick={() => remove(ev.id)}>
                          Delete
                        </button>
                        {ev.status === "published" && ev.slug ? (
                          <a href={`/events/${ev.slug}`} target="_blank" rel="noreferrer">
                            View
                          </a>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={saveEvent} style={{ ...CARD, display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 800 }}>
                {editingId ? `Edit event #${editingId}` : "Create event"}
              </div>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Name *
                <input
                  required
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  data-testid="venue-event-name"
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </label>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))" }}>
                <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  Date
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setField("event_date", e.target.value)}
                  />
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  Starts
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setField("starts_at", e.target.value)}
                  />
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  Ends
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setField("ends_at", e.target.value)}
                  />
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  Age requirement (min)
                  <input
                    type="number"
                    min={0}
                    max={120}
                    placeholder="e.g. 21"
                    value={form.age_requirement_min}
                    onChange={(e) => setField("age_requirement_min", e.target.value)}
                    data-testid="venue-event-age"
                  />
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  Capacity
                  <input
                    type="number"
                    min={0}
                    value={form.capacity}
                    onChange={(e) => setField("capacity", e.target.value)}
                  />
                </label>
              </div>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Venue label
                <input
                  value={form.venue_label}
                  onChange={(e) => setField("venue_label", e.target.value)}
                  placeholder="Defaults to this restaurant"
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Event rules
                <textarea
                  rows={2}
                  value={form.rules}
                  onChange={(e) => setField("rules", e.target.value)}
                />
              </label>
              <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                Refund policy
                <textarea
                  rows={2}
                  value={form.refund_policy}
                  onChange={(e) => setField("refund_policy", e.target.value)}
                />
              </label>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  Sales start
                  <input
                    type="datetime-local"
                    value={form.sales_starts_at}
                    onChange={(e) => setField("sales_starts_at", e.target.value)}
                  />
                </label>
                <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  Sales end
                  <input
                    type="datetime-local"
                    value={form.sales_ends_at}
                    onChange={(e) => setField("sales_ends_at", e.target.value)}
                  />
                </label>
              </div>
              <button type="submit" disabled={busy} data-testid="venue-event-save" style={{ fontWeight: 700 }}>
                {editingId ? "Save changes" : "Create event"}
              </button>
            </form>

            {ticketEventId ? (
              <div style={{ ...CARD, display: "grid", gap: 12 }}>
                <div style={{ fontWeight: 800 }}>
                  Ticket types {selected ? `— ${selected.name}` : ""}
                </div>
                <div style={{ fontSize: 12, color: "#78716c" }}>
                  Config only. Purchase remains disabled until commerce attach.
                </div>
                {(selected?.ticket_types || []).length ? (
                  <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                    {selected.ticket_types.map((t) => (
                      <li
                        key={t.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                          fontSize: 13,
                          padding: "8px 10px",
                          border: "1px solid #e7e5e4",
                          borderRadius: 8,
                        }}
                      >
                        <span>
                          <strong>{t.name}</strong> ({t.ticket_kind}) · {formatCents(t.price_cents)}
                          {t.quantity_total != null ? ` · qty ${t.quantity_total}` : ""}
                        </span>
                        <button type="button" onClick={() => removeTicket(ticketEventId, t.id)}>
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontSize: 13, color: "#5b6675" }}>No ticket types yet.</div>
                )}
                <form onSubmit={addTicket} style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
                    <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                      Kind
                      <select
                        value={ticketForm.ticket_kind}
                        onChange={(e) =>
                          setTicketForm((p) => ({ ...p, ticket_kind: e.target.value }))
                        }
                      >
                        <option value="ga">GA</option>
                        <option value="vip">VIP</option>
                        <option value="table">Table</option>
                        <option value="custom">Custom</option>
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                      Name *
                      <input
                        required
                        value={ticketForm.name}
                        onChange={(e) => setTicketForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </label>
                    <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                      Price ($)
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={ticketForm.price}
                        onChange={(e) => setTicketForm((p) => ({ ...p, price: e.target.value }))}
                      />
                    </label>
                    <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                      Quantity
                      <input
                        type="number"
                        min={0}
                        value={ticketForm.quantity_total}
                        onChange={(e) =>
                          setTicketForm((p) => ({ ...p, quantity_total: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                    Description
                    <input
                      value={ticketForm.description}
                      onChange={(e) =>
                        setTicketForm((p) => ({ ...p, description: e.target.value }))
                      }
                    />
                  </label>
                  <button type="submit" disabled={busy} style={{ fontWeight: 700 }}>
                    Add ticket type
                  </button>
                </form>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </OperatorLayout>
  );
}
