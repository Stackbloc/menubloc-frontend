/**
 * New plan, from the calendar (Andre 2026-10-28, "think an Apple product"): What (Meal / Event) ·
 * Where (a restaurant, or any place you type) · When (the day you clicked, a time) · Who can come
 * (two plain choices). "Add to calendar" puts it on that day; then Invite people.
 */

import { useEffect, useMemo, useState } from "react";
import { createSocialPlan } from "../../../lib/consumerApi.js";
import { searchReportPlaces } from "../../../lib/foodActivityApi.js";
import { dayChoices } from "../../../lib/socialPlanTags.js";
import { WhoCanCome } from "./SocialPlanSharing.jsx";

const TIMES = Array.from({ length: 31 }, (_, i) => {
  const m = 7 * 60 + i * 30;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return { time: `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`, label: `${h % 12 || 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}` };
});

function Chip({ label, on, onClick, testId }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} data-testid={testId} style={{ ...styles.chip, ...(on ? styles.chipOn : null) }}>
      {label}
    </button>
  );
}

export default function NewPlanPanel({ day, initialKind = "meal", onClose, onAdded }) {
  const days = useMemo(() => {
    const week = dayChoices();
    return day && !week.some((d) => d.date === day)
      ? [{ date: day, label: new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) }, ...week]
      : week;
  }, [day]);
  const [kind, setKind] = useState(initialKind === "event" ? "event" : "meal");
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState(null);
  const [results, setResults] = useState([]);
  const [picked, setPicked] = useState(null);
  const date = picked || day;
  const [time, setTime] = useState(null);
  const [who, setWho] = useState("ask");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (place || q.length < 2) return undefined;
    let alive = true;
    const t = setTimeout(() => {
      searchReportPlaces({ type: "restaurant", q, limit: 5 })
        .then((r) => alive && setResults(r.results || []))
        .catch(() => alive && setResults([]));
    }, 220);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, place]);

  const typed = query.trim().replace(/\s+/g, " ").slice(0, 120);
  const ready = Boolean(date) && (kind === "meal" || title.trim());

  async function add() {
    setBusy(true);
    setError("");
    try {
      const res = await createSocialPlan({
        kind,
        date,
        time,
        restaurant_id: place?.restaurant_id || null,
        place_name: place?.restaurant_id ? null : place?.name || typed || null,
        title: kind === "event" ? title.trim() : null,
        who,
      });
      setAdded(res.plan);
      onAdded?.(res.plan);
    } catch (err) {
      setError(err.message || "Couldn’t add the plan");
    } finally {
      setBusy(false);
    }
  }

  if (added) {
    const link = added.share_path ? `${window.location.origin}${added.share_path}` : null;
    return (
      <div style={styles.card} data-testid="new-plan-added">
        <strong style={{ fontSize: 17 }}>Added to your calendar</strong>
        <span style={styles.muted}>{added.title}</span>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {link ? (
            <button
              type="button"
              style={styles.primary}
              onClick={async () => {
                try {
                  if (navigator.share) await navigator.share({ title: added.title, text: `${added.title} — want to come?`, url: link });
                  else {
                    await navigator.clipboard.writeText(link);
                    setCopied(true);
                  }
                } catch {
                  /* closed the share sheet */
                }
              }}
              data-testid="new-plan-invite"
            >
              {copied ? "Link copied" : "Invite people"}
            </button>
          ) : null}
          <button type="button" onClick={onClose} style={styles.link} data-testid="new-plan-done">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card} data-testid="new-plan">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong style={{ fontSize: 17 }}>New plan</strong>
        <button type="button" onClick={onClose} style={styles.link} aria-label="Close">
          Cancel
        </button>
      </div>
      <div style={styles.chips}>
        <Chip label="🍽 Meal" on={kind === "meal"} onClick={() => setKind("meal")} testId="new-plan-meal" />
        <Chip label="🎉 Event" on={kind === "event"} onClick={() => setKind("event")} testId="new-plan-event" />
      </div>
      {kind === "event" ? (
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What’s the event?" maxLength={80} style={styles.input} data-testid="new-plan-title" />
      ) : null}

      <span style={styles.label}>Where</span>
      {place ? (
        <button type="button" onClick={() => setPlace(null)} style={styles.picked} data-testid="new-plan-place-picked">
          <strong>{place.restaurant_name || place.name}</strong>
          <span style={styles.muted}>Change</span>
        </button>
      ) : (
        <>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="A restaurant or any place" style={styles.input} data-testid="new-plan-place" />
          {typed.length >= 2
            ? [...results, { restaurant_id: null, name: typed }].map((r) => (
                <button
                  key={`${r.restaurant_id || "typed"}-${r.restaurant_name || r.name}`}
                  type="button"
                  onClick={() => setPlace(r)}
                  style={styles.result}
                  data-testid={`new-plan-place-${r.restaurant_id || "typed"}`}
                >
                  {r.restaurant_id ? `${r.restaurant_name}${r.city ? ` · ${r.city}` : ""}` : `Use “${r.name}”`}
                </button>
              ))
            : null}
        </>
      )}

      <span style={styles.label}>When</span>
      <div style={styles.chips}>
        {days.map((d) => (
          <Chip key={d.date} label={d.label} on={date === d.date} onClick={() => setPicked(d.date)} testId={`new-plan-day-${d.date}`} />
        ))}
      </div>
      <div style={styles.chips}>
        {TIMES.map((t) => (
          <Chip key={t.time} label={t.label} on={time === t.time} onClick={() => setTime(time === t.time ? null : t.time)} testId={`new-plan-time-${t.time}`} />
        ))}
      </div>

      <span style={styles.label}>Who can come</span>
      <WhoCanCome value={who} onChange={setWho} testId="new-plan-who" />

      {error ? <span style={{ color: "#b91c1c", fontSize: 13, fontWeight: 600 }}>{error}</span> : null}
      <button type="button" disabled={!ready || busy} onClick={add} style={{ ...styles.primary, opacity: !ready || busy ? 0.5 : 1 }} data-testid="new-plan-add">
        {busy ? "…" : "Add to calendar"}
      </button>
    </div>
  );
}

const styles = {
  card: { border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "#fff", display: "grid", gap: 8, marginTop: 12 },
  label: { fontSize: 12, fontWeight: 800, color: "#475569", marginTop: 4 },
  chips: { display: "flex", flexWrap: "wrap", gap: 6 },
  chip: { padding: "5px 11px", borderRadius: 999, border: "1px solid #cbd5e1", background: "#fff", color: "#0f172a", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  chipOn: { background: "#15803d", borderColor: "#15803d", color: "#fff" },
  input: { fontSize: 15, padding: "10px 12px", borderRadius: 10, border: "1px solid #cbd5e1" },
  result: { textAlign: "left", background: "none", border: "none", borderBottom: "1px solid #f1f5f9", padding: "8px 2px", fontSize: 14, cursor: "pointer", color: "#0f172a" },
  picked: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ecfdf3", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer", color: "#0f172a" },
  primary: { padding: "11px 16px", borderRadius: 10, border: "none", background: "#0f172a", color: "#fff", fontWeight: 700, cursor: "pointer" },
  link: { background: "none", border: "none", color: "#15803d", fontWeight: 700, fontSize: 14, cursor: "pointer", padding: 0 },
  muted: { fontSize: 13, color: "#64748b" },
};
