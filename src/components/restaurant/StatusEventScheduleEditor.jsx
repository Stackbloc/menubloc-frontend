/**
 * Owner editor for Happy Hour / Live Music status events + live preview.
 */
import { useMemo, useState } from "react";
import * as operatorApi from "../../lib/operatorApi.js";
import {
  WEEKDAY_OPTIONS,
  emptyHappyHourEvent,
  emptyLiveMusicEvent,
} from "../../lib/restaurantStatusBanners.js";
import RestaurantStatusBannerStrip from "./RestaurantStatusBannerStrip.jsx";

const INPUT = {
  width: "100%",
  padding: "8px 10px",
  fontSize: 13,
  border: "1.5px solid #e4e9f0",
  borderRadius: 8,
  outline: "none",
  color: "#0f1720",
  background: "#fff",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

function toEditorEvent(ev, statusType) {
  return {
    schedule_kind: ev.schedule_kind || (statusType === "live_music" ? "one_time" : "recurring"),
    weekdays: Array.isArray(ev.weekdays) ? ev.weekdays.map(Number) : [],
    local_start_time: String(ev.local_start_time || "16:00").slice(0, 5),
    local_end_time: ev.local_end_time ? String(ev.local_end_time).slice(0, 5) : "",
    event_date: ev.event_date ? String(ev.event_date).slice(0, 10) : "",
    title: ev.title || "",
    description: ev.description || "",
    external_url: ev.external_url || "",
    enabled: ev.enabled !== false,
  };
}

export default function StatusEventScheduleEditor({
  restaurantId,
  statusType,
  initialEvents = [],
  timezoneLabel,
  timezoneValid,
  onSaved,
}) {
  const [events, setEvents] = useState(() =>
    (initialEvents || []).map((e) => toEditorEvent(e, statusType))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(null);

  const title = statusType === "happy_hour" ? "Happy Hour schedules" : "Live Music events";

  const localPreview = useMemo(() => {
    if (preview?.status_event_presentations) return preview.status_event_presentations;
    return [];
  }, [preview]);

  function addEvent() {
    setEvents((prev) => [
      ...prev,
      statusType === "happy_hour" ? emptyHappyHourEvent() : emptyLiveMusicEvent(),
    ]);
  }

  function updateEvent(index, patch) {
    setEvents((prev) => prev.map((ev, i) => (i === index ? { ...ev, ...patch } : ev)));
  }

  function removeEvent(index) {
    setEvents((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleWeekday(index, day) {
    setEvents((prev) =>
      prev.map((ev, i) => {
        if (i !== index) return ev;
        const set = new Set(ev.weekdays || []);
        if (set.has(day)) set.delete(day);
        else set.add(day);
        return { ...ev, weekdays: [...set].sort((a, b) => a - b) };
      })
    );
  }

  async function handleSave() {
    if (!restaurantId) return;
    setSaving(true);
    setError("");
    try {
      const payload = events.map((ev) => ({
        ...ev,
        schedule_kind: statusType === "happy_hour" ? "recurring" : ev.schedule_kind,
        local_end_time: ev.local_end_time || null,
        event_date: ev.event_date || null,
        weekdays:
          statusType === "happy_hour" || ev.schedule_kind === "recurring" ? ev.weekdays : [],
        external_url: ev.external_url || null,
        title: ev.title || null,
        description: ev.description || null,
      }));
      const result = await operatorApi.replaceStatusEvents(restaurantId, statusType, payload);
      setEvents((result.events || []).map((e) => toEditorEvent(e, statusType)));
      setPreview(result.preview || null);
      if (typeof onSaved === "function") await onSaved(result);
    } catch (e) {
      setError(e.message || "Could not save schedules.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        marginTop: 10,
        padding: 12,
        borderRadius: 12,
        border: "1px solid #d1d5db",
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, lineHeight: 1.45 }}>
        Times use the restaurant location timezone
        {timezoneLabel ? ` (${timezoneLabel})` : ""}.
        {!timezoneValid
          ? " Time zone is missing or invalid — public banners will show the schedule without “Now” / “Tonight” labels."
          : " “Now” and “Tonight” labels are calculated in this timezone, not the visitor’s device clock."}
      </div>

      {events.map((ev, index) => (
        <div
          key={index}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: 10,
            marginBottom: 10,
            background: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <strong style={{ fontSize: 12, color: "#334155" }}>
              {statusType === "happy_hour" ? `Schedule ${index + 1}` : `Event ${index + 1}`}
            </strong>
            <button
              type="button"
              onClick={() => removeEvent(index)}
              style={{
                border: "none",
                background: "transparent",
                color: "#b91c1c",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>

          {statusType === "live_music" ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                Musical act
              </div>
              <input
                style={INPUT}
                value={ev.title}
                onChange={(e) => updateEvent(index, { title: e.target.value })}
                placeholder="The Jordan Lee Trio"
              />
            </div>
          ) : null}

          {statusType === "live_music" ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                Schedule type
              </div>
              <select
                style={{ ...INPUT, appearance: "auto" }}
                value={ev.schedule_kind}
                onChange={(e) => updateEvent(index, { schedule_kind: e.target.value })}
              >
                <option value="one_time">One-time date</option>
                <option value="recurring">Recurring weekly</option>
              </select>
            </div>
          ) : null}

          {ev.schedule_kind === "recurring" || statusType === "happy_hour" ? (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                Days of the week
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {WEEKDAY_OPTIONS.map((d) => {
                  const on = (ev.weekdays || []).includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleWeekday(index, d.value)}
                      style={{
                        height: 30,
                        padding: "0 10px",
                        borderRadius: 8,
                        border: on ? "1px solid #1F4E3D" : "1px solid #d1d5db",
                        background: on ? "#ecfdf5" : "#fff",
                        color: "#0f172a",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                Date
              </div>
              <input
                type="date"
                style={INPUT}
                value={ev.event_date}
                onChange={(e) => updateEvent(index, { event_date: e.target.value })}
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                Start time
              </div>
              <input
                type="time"
                style={INPUT}
                value={ev.local_start_time}
                onChange={(e) => updateEvent(index, { local_start_time: e.target.value })}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                End time{statusType === "live_music" ? " (optional)" : ""}
              </div>
              <input
                type="time"
                style={INPUT}
                value={ev.local_end_time}
                onChange={(e) => updateEvent(index, { local_end_time: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
              Short description (optional)
            </div>
            <input
              style={INPUT}
              value={ev.description}
              onChange={(e) => updateEvent(index, { description: e.target.value })}
              placeholder={
                statusType === "happy_hour" ? "$5 cocktails" : "Jazz night on the patio"
              }
            />
          </div>

          {statusType === "live_music" ? (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 4 }}>
                Info / tickets URL (optional)
              </div>
              <input
                style={INPUT}
                value={ev.external_url}
                onChange={(e) => updateEvent(index, { external_url: e.target.value })}
                placeholder="https://…"
              />
            </div>
          ) : null}
        </div>
      ))}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <button
          type="button"
          onClick={addEvent}
          style={{
            height: 34,
            padding: "0 12px",
            borderRadius: 8,
            border: "1px solid #cbd5e1",
            background: "#fff",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          {statusType === "happy_hour" ? "Add schedule" : "Add event"}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            height: 34,
            padding: "0 12px",
            borderRadius: 8,
            border: "none",
            background: "#1F4E3D",
            color: "#fff",
            fontWeight: 800,
            fontSize: 12,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save schedules"}
        </button>
      </div>

      {error ? (
        <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600, marginBottom: 8 }}>
          {error}
        </div>
      ) : null}

      {localPreview.length ? (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", marginBottom: 6 }}>
            Public banner preview
          </div>
          <RestaurantStatusBannerStrip
            statusBanners={[]}
            statusEventPresentations={localPreview.filter((p) => p.status_type === statusType)}
          />
        </div>
      ) : null}
    </div>
  );
}
