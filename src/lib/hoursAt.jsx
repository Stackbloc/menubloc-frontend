/**
 * Plan 77 (Andre 2026-11-27), web = app: when Menuply knows a place's hours, a plan at a time it's
 * closed (or within 60 minutes of closing) says so — one line under When; Add/Send on a closed time
 * asks first. Unknown hours, typed places, or no answer → nothing. Same text as the app (src/api/hoursAt.ts).
 * Server: GET /public/restaurants/:id/hours-at?date=&time= (hoursAt.js).
 */
import { useEffect, useState } from "react";

const VITE_ENV = import.meta.env || {};
const API = (VITE_ENV.VITE_API_BASE_URL || "https://menubloc-backend-production.up.railway.app").replace(/\/+$/, "");
const UNKNOWN = { status: "unknown" };

function moment(v) {
  return v && typeof v.date === "string" && typeof v.time === "string" && typeof v.label === "string"
    ? { date: v.date, time: v.time, day: typeof v.day === "string" ? v.day : "", label: v.label }
    : null;
}

export function parseHoursAt(b) {
  if (!b || typeof b !== "object") return UNKNOWN;
  if (b.status === "closed") return { status: "closed", nextOpen: moment(b.next_open) };
  if (b.status === "closing_soon") {
    const closes = moment(b.closes);
    const mins = Number(b.closes_in_minutes);
    return closes && Number.isFinite(mins) ? { status: "closing_soon", closes, closesInMinutes: mins } : { status: "open" };
  }
  return b.status === "open" ? { status: "open" } : UNKNOWN;
}

export async function fetchHoursAt(restaurantId, date, time) {
  try {
    const q = `date=${encodeURIComponent(date)}&time=${encodeURIComponent(String(time).slice(0, 5))}`;
    const res = await fetch(`${API}/public/restaurants/${encodeURIComponent(restaurantId)}/hours-at?${q}`);
    if (!res.ok) return UNKNOWN;
    return parseHoursAt(await res.json());
  } catch {
    return UNKNOWN;
  }
}

function opensText(next, date) {
  if (!next) return null;
  return (next.date === date ? `opens ${next.label}` : `opens ${next.day} ${next.label}`).replace(/\s+/g, " ");
}

/** The line under When, or null. */
export function hoursAtLine(name, r, date) {
  if (!r || !date) return null;
  if (r.status === "closed") {
    const opens = opensText(r.nextOpen, date);
    return `${name} is closed then${opens ? ` · ${opens}` : ""}`;
  }
  if (r.status === "closing_soon") {
    const m = r.closesInMinutes;
    return `${name} closes at ${r.closes.label}, ${m >= 60 ? "1 hr" : `${m} min`} after your time`;
  }
  return null;
}

export function clockLabel(time) {
  const [h, m] = String(time).split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return String(time);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** On Add/Send: a closed time asks first (OK = go ahead, Cancel = change the time). */
export function confirmIfClosed(name, r, date, time, goLabel, ask = (msg) => window.confirm(msg)) {
  if (!r || r.status !== "closed") return true;
  const day = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
  const opens = opensText(r.nextOpen, date);
  return ask(`${name} is closed then.\nIt's closed at ${clockLabel(time)} on ${day}.${opens ? ` It ${opens}.` : ""}\n\nOK = ${goLabel} · Cancel = change the time`);
}

/** The hours answer for a place + day + time (null until known, or when any is missing). */
export function useHoursAt(restaurantId, date, time) {
  const [r, setR] = useState(null);
  const key = restaurantId && date && time ? `${restaurantId}|${date}|${time}` : null;
  useEffect(() => {
    if (!key) return undefined;
    let alive = true;
    fetchHoursAt(restaurantId, date, time).then((value) => alive && setR({ key, value }));
    return () => {
      alive = false;
    };
  }, [key, restaurantId, date, time]);
  return key && r?.key === key ? r.value : null;
}

/** One quiet line under When; red when closed. */
export function HoursAtNote({ name, hours, date, testId }) {
  const line = hoursAtLine(name, hours, date);
  if (!line) return null;
  return (
    <span role="status" data-testid={testId} style={{ fontSize: 13, fontWeight: 600, color: hours?.status === "closed" ? "#b42318" : "#64748b" }}>
      {line}
    </span>
  );
}
