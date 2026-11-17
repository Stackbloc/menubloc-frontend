/**
 * Mini Hours window — /owner/hours-mini (Andre 2026-11-16).
 *
 * A small always-available Hours tool: pick a restaurant, then
 *   · paste a screenshot (e.g. Google's hours panel) or hours text → Hours Bot reads it and fills
 *     the form (POST /api/owner/bots/hours_bot/read-hours, never saves), or
 *   · type hours in the same manual Hours form as Profile Manager (WeeklyHoursForm),
 * then Save hours (PUT /api/owner/restaurants/:id/hours/locations; provenance platform_owner).
 *
 * Every location (Andre 2026-11-16): a franchise (brand or any store) lists every store in the
 * chain, an MLE lists every kitchen. Pick one to load and save its hours, or "Save to all
 * locations" (optionally only the ones that have no hours yet).
 *
 * "Pop out" opens the tool in Chrome's Document Picture-in-Picture window, which stays on top of
 * every other app. Chrome closes that window when this tab closes; the last restaurant is
 * remembered (localStorage) so reopening takes one click.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { OWNER_COLORS } from "./OwnerLayout.jsx";
import { inputStyle } from "./ownerMenuEditorComponents.jsx";
import WeeklyHoursForm, { emptyWeek, scheduleForSave, weekFromRows } from "../../components/hours/WeeklyHoursForm.jsx";
import {
  OWNER_API_BASE,
  getOwnerHoursLocations,
  getOwnerLocationHours,
  getOwnerRestaurantHours,
  saveOwnerLocationHours,
  searchMenuConsoleRestaurants,
  updateOwnerRestaurantHours,
} from "../../lib/ownerApi.js";

const LAST_KEY = "menuply.hoursMini.restaurant";
const DAY_WORD = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b/i;

function readLast() {
  try {
    const v = JSON.parse(window.localStorage.getItem(LAST_KEY) || "null");
    return v && Number(v.id) > 0 ? v : null;
  } catch {
    return null;
  }
}

function writeLast(r) {
  try {
    window.localStorage.setItem(LAST_KEY, JSON.stringify(r));
  } catch {
    /* private window: not remembered */
  }
}

async function readHoursRequest({ file = null, text = null }) {
  const fd = new FormData();
  if (file) fd.append("file", file, file.name || "screenshot.png");
  if (text) fd.append("text", text);
  const res = await fetch(`${OWNER_API_BASE}/api/owner/bots/hours_bot/read-hours`, {
    method: "POST",
    credentials: "include",
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok && res.status !== 422) throw new Error(json.error || `Could not read hours (${res.status})`);
  return json;
}

const btn = (primary, enabled = true) => ({
  padding: "7px 12px",
  borderRadius: 8,
  border: primary ? "none" : `1px solid ${OWNER_COLORS.line}`,
  background: primary ? (enabled ? OWNER_COLORS.accent : "#d6d3d1") : "#fff",
  color: primary ? "#fff" : OWNER_COLORS.ink,
  fontSize: 12,
  fontWeight: 800,
  cursor: enabled ? "pointer" : "default",
  fontFamily: "inherit",
});

/** All state lives here so popping out / back in keeps the restaurant and unsaved edits. */
function useHoursMini() {
  const [restaurant, setRestaurant] = useState(null);
  const [hours, setHours] = useState(emptyWeek);
  const [baseline, setBaseline] = useState(emptyWeek);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reading, setReading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // { kind: 'franchise'|'mle'|'single', locations: [{ key, label, has_hours, ... }] } or null (older API).
  const [places, setPlaces] = useState(null);
  const [locKey, setLocKey] = useState(null);

  const loadHours = useCallback(async (restaurantId, key) => {
    setLoading(true);
    try {
      const res = key ? await getOwnerLocationHours(restaurantId, key) : await getOwnerRestaurantHours(restaurantId);
      const week = weekFromRows(res?.schedule);
      setHours(week);
      setBaseline(week);
    } catch (err) {
      setError(err?.message || "Could not load hours.");
      setHours(emptyWeek());
      setBaseline(emptyWeek());
    } finally {
      setLoading(false);
    }
  }, []);

  const select = useCallback(async (r) => {
    const pick = {
      id: Number(r.id || r.restaurant_id),
      name: r.name || r.restaurant_name || `Restaurant #${r.id || r.restaurant_id}`,
      city: r.city || "",
      state: r.state || "",
    };
    setRestaurant(pick);
    setMessage("");
    setError("");
    setPlaces(null);
    setLocKey(null);
    let list = null;
    try {
      list = await getOwnerHoursLocations(pick.id);
    } catch {
      list = null; // older backend: whole-restaurant hours only
    }
    const locations = Array.isArray(list?.locations) ? list.locations : [];
    let key = null;
    if (locations.length) {
      const remembered = r.locKey && locations.find((l) => l.key === r.locKey);
      const self = locations.find((l) => l.key === `r:${pick.id}` && !l.is_brand_record);
      const stores = locations.filter((l) => !l.is_brand_record);
      key = (remembered || self || stores.find((l) => !l.has_hours) || stores[0] || locations[0]).key;
      setPlaces({ kind: list.kind, locations });
      setLocKey(key);
    }
    writeLast({ ...pick, locKey: key });
    await loadHours(pick.id, key);
  }, [loadHours]);

  const chooseLocation = useCallback(
    async (key) => {
      if (!restaurant || key === locKey) return;
      setLocKey(key);
      setMessage("");
      setError("");
      writeLast({ ...restaurant, locKey: key });
      await loadHours(restaurant.id, key);
    },
    [restaurant, locKey, loadHours]
  );

  useEffect(() => {
    const last = readLast();
    if (last) select(last);
  }, [select]);

  const read = useCallback(async ({ file = null, text = null }) => {
    setMessage("");
    setError("");
    setReading(true);
    try {
      const out = await readHoursRequest({ file, text });
      if (!out.ok) {
        setError(out.error || "No hours found.");
        return;
      }
      // Days the paste didn't mention keep what the form had.
      setHours((prev) => {
        const found = weekFromRows(out.rows);
        return prev.map((d) => (out.rows.some((r) => Number(r.day_of_week) === d.day_of_week) ? found[d.day_of_week] : d));
      });
      const n = out.days_found;
      setMessage(`Read ${n} day${n === 1 ? "" : "s"} from the ${out.source === "screenshot" ? "screenshot" : "text"}. Check them, then Save hours.`);
    } catch (err) {
      setError(err?.message || "Could not read hours.");
    } finally {
      setReading(false);
    }
  }, []);

  const markSaved = useCallback((keys) => {
    const done = new Set(keys || []);
    setPlaces((p) => (p ? { ...p, locations: p.locations.map((l) => (done.has(l.key) ? { ...l, has_hours: true } : l)) } : p));
  }, []);

  const save = useCallback(async () => {
    if (!restaurant) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      if (locKey) {
        const out = await saveOwnerLocationHours(restaurant.id, { schedule: scheduleForSave(hours), keys: [locKey] });
        markSaved(out?.saved);
      } else {
        await updateOwnerRestaurantHours(restaurant.id, scheduleForSave(hours));
      }
      setBaseline(hours);
      const many = places && places.locations.length > 1;
      setMessage(many ? "Hours saved for this location. They're live on its profile." : "Hours saved. They're live on the restaurant profile.");
    } catch (err) {
      setError(err?.message || "Could not save hours.");
    } finally {
      setSaving(false);
    }
  }, [restaurant, hours, locKey, places, markSaved]);

  /** Same hours to every store / kitchen (the brand record is never included). */
  const saveAll = useCallback(
    async ({ onlyMissing, confirmIn }) => {
      if (!restaurant || !places) return;
      const targets = places.locations.filter((l) => !l.is_brand_record && (!onlyMissing || !l.has_hours));
      if (!targets.length) {
        setMessage("Every location already has hours.");
        return;
      }
      const what = onlyMissing ? `${targets.length} location${targets.length === 1 ? "" : "s"} with no hours` : `all ${targets.length} locations`;
      const ask = confirmIn?.confirm ? confirmIn.confirm.bind(confirmIn) : window.confirm.bind(window);
      if (!ask(`Save these hours to ${what}?${onlyMissing ? "" : " This replaces hours they already have."}`)) return;
      setSaving(true);
      setMessage("");
      setError("");
      try {
        const out = await saveOwnerLocationHours(restaurant.id, { schedule: scheduleForSave(hours), keys: "all", onlyMissing });
        markSaved(out?.saved);
        setBaseline(hours);
        const n = out?.saved?.length || 0;
        const k = out?.skipped?.length || 0;
        setMessage(`Hours saved to ${n} location${n === 1 ? "" : "s"}.${k ? ` ${k} already had hours and ${k === 1 ? "was" : "were"} left alone.` : ""}`);
      } catch (err) {
        setError(err?.message || "Could not save hours.");
      } finally {
        setSaving(false);
      }
    },
    [restaurant, places, hours, markSaved]
  );

  const dirty = JSON.stringify(hours) !== JSON.stringify(baseline);
  return {
    restaurant, select, hours, setHours, loading, saving, reading, message, error, read, save, saveAll, dirty, setRestaurant,
    places, locKey, chooseLocation,
  };
}

function RestaurantPicker({ state }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  // Closed when a restaurant is picked or remembered from last time (it loads a moment later).
  const [open, setOpen] = useState(() => !state.restaurant && !readLast());
  const seq = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return undefined;
    }
    const n = ++seq.current;
    const t = setTimeout(() => {
      searchMenuConsoleRestaurants({ q: term, limit: 8 })
        .then((res) => {
          if (n === seq.current) setResults(Array.isArray(res?.restaurants) ? res.restaurants : []);
        })
        .catch(() => {
          if (n === seq.current) setResults([]);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  if (state.restaurant && !open) {
    const r = state.restaurant;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: OWNER_COLORS.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.name}
          </div>
          {r.city ? <div style={{ fontSize: 12, color: OWNER_COLORS.muted }}>{[r.city, r.state].filter(Boolean).join(", ")}</div> : null}
        </div>
        <button type="button" onClick={() => setOpen(true)} style={btn(false)}>Change</button>
      </div>
    );
  }

  return (
    <div>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Restaurant name"
        aria-label="Find a restaurant"
        style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
      />
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {results.map((r) => {
          const id = r.id || r.restaurant_id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                state.select(r);
                setOpen(false);
                setQ("");
              }}
              style={{ textAlign: "left", padding: "8px 10px", borderRadius: 8, border: `1px solid ${OWNER_COLORS.line}`, background: "#fff", cursor: "pointer", fontFamily: "inherit" }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: OWNER_COLORS.ink }}>{r.name || r.restaurant_name}</div>
              <div style={{ fontSize: 11, color: OWNER_COLORS.muted }}>{[r.address_line1, r.city, r.state].filter(Boolean).join(", ")} · #{id}</div>
            </button>
          );
        })}
      </div>
      {state.restaurant ? (
        <button type="button" onClick={() => setOpen(false)} style={{ ...btn(false), marginTop: 8 }}>Cancel</button>
      ) : null}
    </div>
  );
}

/** Which store (franchise) or kitchen (MLE) the form edits. Hidden for one-location restaurants. */
function LocationPicker({ state }) {
  const [q, setQ] = useState("");
  const places = state.places;
  if (!places || places.locations.length < 2) return null;

  const all = places.locations;
  const stores = all.filter((l) => !l.is_brand_record);
  const withHours = stores.filter((l) => l.has_hours).length;
  const term = q.trim().toLowerCase();
  const shown = all.filter(
    (l) => l.key === state.locKey || !term || String(l.label).toLowerCase().includes(term)
  );
  const noun = places.kind === "franchise" ? "stores" : "locations";
  const busy = state.loading || state.saving || state.reading;

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 800 }}>Location</div>
        <div style={{ fontSize: 11, color: OWNER_COLORS.muted }}>
          {withHours} of {stores.length} {noun} have hours
        </div>
      </div>
      {all.length > 8 ? (
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by street, city or ZIP"
          aria-label="Filter locations"
          style={{ ...inputStyle, width: "100%", boxSizing: "border-box", fontSize: 12 }}
        />
      ) : null}
      <select
        value={state.locKey || ""}
        onChange={(e) => state.chooseLocation(e.target.value)}
        disabled={busy}
        aria-label="Location"
        style={{ ...inputStyle, width: "100%", boxSizing: "border-box", fontSize: 13 }}
      >
        {shown.map((l) => (
          <option key={l.key} value={l.key}>
            {l.label}
            {l.has_hours ? "" : " · no hours"}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Save the form's hours to every store / kitchen, or only the ones with none yet. */
function SaveAllLocations({ state, doc }) {
  const [onlyMissing, setOnlyMissing] = useState(true);
  const places = state.places;
  if (!places || places.locations.filter((l) => !l.is_brand_record).length < 2) return null;
  const stores = places.locations.filter((l) => !l.is_brand_record);
  const missing = stores.filter((l) => !l.has_hours).length;
  const noun = places.kind === "franchise" ? "stores" : "locations";
  const busy = state.loading || state.saving || state.reading;
  const n = onlyMissing ? missing : stores.length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: OWNER_COLORS.muted }}>
        <input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />
        Only {noun} with no hours
      </label>
      <button
        type="button"
        disabled={busy || n === 0}
        onClick={() => state.saveAll({ onlyMissing, confirmIn: doc?.defaultView })}
        style={btn(false, !busy && n > 0)}
      >
        {onlyMissing ? `Save to ${n} with no hours` : `Save to all ${n} ${noun}`}
      </button>
    </div>
  );
}

/** The tool itself. `doc` = the document it lives in (this page, or the pop-out window). */
function HoursMiniPanel({ state, doc, popOut, poppedOut }) {
  const fileRef = useRef(null);

  useEffect(() => {
    function onPaste(e) {
      if (!state.restaurant) return;
      const items = Array.from(e.clipboardData?.items || []);
      const image = items.find((i) => i.kind === "file" && String(i.type).startsWith("image/"));
      if (image) {
        e.preventDefault();
        state.read({ file: image.getAsFile() });
        return;
      }
      const target = e.target;
      const inField = target && /^(INPUT|TEXTAREA)$/.test(target.tagName);
      const text = e.clipboardData?.getData("text/plain") || "";
      if (!inField && DAY_WORD.test(text)) {
        e.preventDefault();
        state.read({ text });
      }
    }
    doc.addEventListener("paste", onPaste);
    return () => doc.removeEventListener("paste", onPaste);
  }, [doc, state]);

  const busy = state.loading || state.reading || state.saving;
  return (
    <div style={{ padding: 14, display: "grid", gap: 12, fontFamily: "inherit", color: OWNER_COLORS.ink }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.2 }}>Hours</div>
        {popOut && !poppedOut ? (
          <button type="button" onClick={popOut} style={btn(false)} title="Keeps this window on top of other apps">
            Pop out
          </button>
        ) : null}
      </div>

      <RestaurantPicker state={state} />

      {state.restaurant ? <LocationPicker state={state} /> : null}

      {state.restaurant ? (
        <>
          <div
            style={{
              border: `1px dashed ${OWNER_COLORS.line}`,
              borderRadius: 10,
              padding: "10px 12px",
              fontSize: 12,
              color: OWNER_COLORS.muted,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <span>{state.reading ? "Reading hours…" : "Paste a screenshot or hours text here (⌘V)."}</span>
            <button type="button" onClick={() => fileRef.current?.click()} style={btn(false)} disabled={busy}>
              Choose file
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) state.read({ file: f });
              }}
            />
          </div>

          {state.message ? <div style={{ fontSize: 12, color: OWNER_COLORS.ink }}>{state.message}</div> : null}
          {state.error ? <div style={{ fontSize: 12, color: "#b91c1c" }}>{state.error}</div> : null}

          <div style={{ opacity: state.loading ? 0.5 : 1 }}>
            <WeeklyHoursForm hours={state.hours} setHours={state.setHours} accent={OWNER_COLORS.accent} inputStyle={inputStyle} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={state.save} disabled={!state.dirty || busy} style={btn(true, state.dirty && !busy)}>
              {state.saving ? "Saving hours…" : "Save hours"}
            </button>
          </div>

          <SaveAllLocations state={state} doc={doc} />
        </>
      ) : null}
    </div>
  );
}

function copyStyles(target) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const css = Array.from(sheet.cssRules).map((r) => r.cssText).join("\n");
      const el = target.document.createElement("style");
      el.textContent = css;
      target.document.head.appendChild(el);
    } catch {
      if (sheet.href) {
        const link = target.document.createElement("link");
        link.rel = "stylesheet";
        link.href = sheet.href;
        target.document.head.appendChild(link);
      }
    }
  }
  const body = target.document.body;
  body.style.margin = "0";
  body.style.background = "#fff";
  body.style.fontFamily = getComputedStyle(document.body).fontFamily;
  target.document.title = "Hours";
}

export default function OwnerHoursMini() {
  const state = useHoursMini();
  const [pip, setPip] = useState(null);
  const [popError, setPopError] = useState("");
  const supported = typeof window !== "undefined" && "documentPictureInPicture" in window;

  const popOut = useCallback(async () => {
    setPopError("");
    try {
      const w = await window.documentPictureInPicture.requestWindow({ width: 600, height: 780 });
      copyStyles(w);
      w.addEventListener("pagehide", () => setPip(null));
      setPip(w);
    } catch (err) {
      console.warn("[hours-mini] pop out failed", err?.message || err);
      setPopError("This browser couldn't open the floating window. Open this page in Chrome on a computer.");
    }
  }, []);

  useEffect(() => () => pip?.close(), [pip]);

  return (
    <div style={{ minHeight: "100vh", background: OWNER_COLORS.page || "#f7f1ea", padding: 16, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", background: "#fff", borderRadius: 14, border: `1px solid ${OWNER_COLORS.line}` }}>
        {pip ? (
          <div style={{ padding: 16, fontSize: 13, color: OWNER_COLORS.muted, display: "grid", gap: 10 }}>
            <div>The Hours window is popped out and stays on top of other apps. Keep this tab open.</div>
            <div>
              <button type="button" onClick={() => pip.close()} style={btn(false)}>Bring it back here</button>
            </div>
          </div>
        ) : (
          <HoursMiniPanel state={state} doc={document} popOut={supported ? popOut : null} poppedOut={false} />
        )}
      </div>
      {popError ? (
        <div style={{ maxWidth: 600, margin: "10px auto 0", fontSize: 12, color: "#b91c1c" }}>{popError}</div>
      ) : null}
      {!supported ? (
        <div style={{ maxWidth: 600, margin: "10px auto 0", fontSize: 12, color: OWNER_COLORS.muted }}>
          To keep this window on top of other apps, open it in Chrome on a computer.
        </div>
      ) : null}
      <div style={{ maxWidth: 600, margin: "10px auto 0", fontSize: 12 }}>
        <Link to="/owner/bots/hours-bot" style={{ color: OWNER_COLORS.muted }}>Hours Bot</Link>
      </div>
      {pip ? createPortal(<HoursMiniPanel state={state} doc={pip.document} popOut={null} poppedOut />, pip.document.body) : null}
    </div>
  );
}
