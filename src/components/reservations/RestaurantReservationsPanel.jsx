/**
 * Reservations, restaurant side (Social Dining build doc Phase 4, BE mig 0443).
 * Menuply passes a table request from a group's plan; the restaurant taps Accept and the group gets
 * a code (MP-1234). No booking-system integration: staff copy accepted bookings into their own
 * system and tick "Entered in our booking system".
 *
 * Shared by the restaurant's own portal (/operator/reservations) and the owner Restaurant Manager
 * (section=reservations). `api` = { list, setEnabled, accept, decline, markEntered }.
 */
import React, { useCallback, useEffect, useState } from "react";

const C = {
  ink: "#111827",
  muted: "#6b7280",
  line: "#e5e7eb",
  surface: "#ffffff",
  surfaceAlt: "#f9fafb",
  accent: "#0f7a24",
  danger: "#b91c1c",
};

const REFRESH_MS = 30 * 1000;

function timeText(t) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t || ""));
  if (!m) return "";
  const h = Number(m[1]);
  return `${h % 12 || 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

function dayText(d, today) {
  if (!d) return "";
  if (d === today) return "Today";
  const dt = new Date(`${d}T12:00:00Z`);
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

function agoText(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "";
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return `${h} hr ago`;
}

const STATUS_TEXT = {
  declined: "Declined",
  expired: "No answer in time",
  cancelled: "Cancelled",
};

const CANCEL_TEXT = {
  plan_cancelled: "the group cancelled the plan",
  plan_changed: "the group changed the time or place",
  party_changed: "replaced by a new request",
  diner: "the group took it back",
};

const box = { border: `1px solid ${C.line}`, borderRadius: 12, background: C.surface, padding: 16, marginBottom: 16 };
const h3 = { margin: "0 0 12px", fontSize: 16, fontWeight: 600, color: C.ink };
const row = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 0",
  borderTop: `1px solid ${C.line}`,
  flexWrap: "wrap",
};
const btn = (primary) => ({
  minHeight: 44,
  padding: "0 18px",
  borderRadius: 10,
  border: primary ? `1px solid ${C.accent}` : `1px solid ${C.line}`,
  background: primary ? C.accent : C.surface,
  color: primary ? "#fff" : C.ink,
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
});

export default function RestaurantReservationsPanel({ api, restaurantName = "", canChangeSwitch = true }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);
  const [justAccepted, setJustAccepted] = useState(null);

  const load = useCallback(async () => {
    try {
      const out = await api.list();
      setData(out);
      setError("");
    } catch (err) {
      setError(err?.message || "Couldn't load reservations");
    }
  }, [api]);

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const run = async (key, fn) => {
    setBusy(key);
    setError("");
    try {
      const out = await fn();
      await load();
      return out;
    } catch (err) {
      setError(err?.message || "Something went wrong");
      await load();
      return null;
    } finally {
      setBusy(null);
    }
  };

  if (!data && !error) return <div style={{ color: C.muted, padding: 16 }}>Loading reservations…</div>;
  if (data && data.available === false) {
    return <div style={box}>Reservations aren't switched on for Menuply yet.</div>;
  }

  const enabled = data?.enabled === true;
  const today = data?.today;
  const name = restaurantName || "your restaurant";

  return (
    <div data-testid="restaurant-reservations">
      <div style={box}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.ink }}>Reservations?</div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>
              {enabled
                ? "Groups planning a meal here can ask for a table. You accept with one tap."
                : "Reservations are off. Groups still arrive as walk-ins."}
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, cursor: canChangeSwitch ? "pointer" : "default" }}>
            <input
              type="checkbox"
              role="switch"
              aria-label="Take reservations"
              checked={enabled}
              disabled={!canChangeSwitch || busy === "switch"}
              onChange={(e) => run("switch", () => api.setEnabled(e.target.checked))}
              style={{ width: 22, height: 22 }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{enabled ? "On" : "Off"}</span>
          </label>
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 10 }}>
          Menuply doesn't connect to your booking system. When you accept, copy the booking into your own system.
        </div>
      </div>

      {error ? (
        <div role="alert" style={{ ...box, borderColor: C.danger, color: C.danger }}>
          {error}
        </div>
      ) : null}

      {justAccepted ? (
        <div style={{ ...box, background: C.surfaceAlt }} data-testid="reservation-accepted">
          <div style={{ fontSize: 14, color: C.muted }}>Accepted. The group has this code:</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.ink, margin: "6px 0" }}>{justAccepted.code}</div>
          <div style={{ fontSize: 14, color: C.ink }}>
            {dayText(justAccepted.date, today)} · {timeText(justAccepted.time)} · {justAccepted.first_name} · party of {justAccepted.party_size}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, marginTop: 8 }}>
            <input
              type="checkbox"
              checked={justAccepted.entered_by_restaurant === true}
              onChange={async (e) => {
                const out = await run(`entered:${justAccepted.id}`, () => api.markEntered(justAccepted.id, e.target.checked));
                if (out?.reservation) setJustAccepted(out.reservation);
              }}
            />
            <span style={{ fontSize: 14 }}>Entered in our booking system</span>
          </label>
          <button type="button" style={{ ...btn(false), marginTop: 4 }} onClick={() => setJustAccepted(null)}>
            Done
          </button>
        </div>
      ) : null}

      <div style={box}>
        <h3 style={h3}>New requests</h3>
        {(data?.requests || []).length === 0 ? (
          <div style={{ fontSize: 14, color: C.muted }}>
            {enabled ? "No requests right now. New ones show up here." : `Turn on reservations to get table requests for ${name}.`}
          </div>
        ) : (
          data.requests.map((r) => (
            <div key={r.id} style={row} data-testid="reservation-request">
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>
                  {dayText(r.date, today)} · {timeText(r.time)} · {r.first_name} · party of {r.party_size}
                </div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>Asked {agoText(r.created_at)}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  style={btn(false)}
                  disabled={busy != null}
                  onClick={() => run(`decline:${r.id}`, () => api.decline(r.id))}
                >
                  Decline
                </button>
                <button
                  type="button"
                  style={btn(true)}
                  disabled={busy != null}
                  onClick={async () => {
                    const out = await run(`accept:${r.id}`, () => api.accept(r.id));
                    if (out?.reservation) setJustAccepted(out.reservation);
                  }}
                >
                  Accept
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmedList title="Confirmed today" list={data?.confirmed_today || []} today={today} api={api} run={run} />
      {(data?.confirmed_later || []).length ? (
        <ConfirmedList title="Confirmed, coming up" list={data.confirmed_later} today={today} api={api} run={run} />
      ) : null}

      {(data?.other_today || []).length ? (
        <div style={box}>
          <h3 style={h3}>Not happening</h3>
          {data.other_today.map((r) => (
            <div key={r.id} style={row}>
              <div style={{ fontSize: 14, color: C.ink }}>
                {dayText(r.date, today)} · {timeText(r.time)} · {r.first_name} · party of {r.party_size}
                {r.code ? ` · ${r.code}` : ""}
              </div>
              <div style={{ fontSize: 13, color: C.muted }}>
                {STATUS_TEXT[r.status] || r.status}
                {r.status === "cancelled" && CANCEL_TEXT[r.cancelled_reason] ? `: ${CANCEL_TEXT[r.cancelled_reason]}` : ""}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ConfirmedList({ title, list, today, api, run }) {
  return (
    <div style={box}>
      <h3 style={h3}>{title}</h3>
      {list.length === 0 ? (
        <div style={{ fontSize: 14, color: C.muted }}>Nothing confirmed yet.</div>
      ) : (
        list.map((r) => (
          <div key={r.id} style={row} data-testid="reservation-confirmed">
            <div style={{ fontSize: 15, color: C.ink }}>
              <span style={{ fontWeight: 600 }}>{timeText(r.time)}</span>
              {r.date !== today ? ` · ${dayText(r.date, today)}` : ""} · {r.first_name} · party of {r.party_size} ·{" "}
              <span style={{ fontWeight: 700 }}>{r.code}</span>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
              <input
                type="checkbox"
                checked={r.entered_by_restaurant === true}
                onChange={(e) => run(`entered:${r.id}`, () => api.markEntered(r.id, e.target.checked))}
              />
              <span style={{ fontSize: 13, color: C.muted }}>Entered in our booking system</span>
            </label>
          </div>
        ))
      )}
    </div>
  );
}
