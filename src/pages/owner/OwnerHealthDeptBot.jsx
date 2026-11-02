/**
 * Owner → Bots → HealthDeptBot (Andre 2026-11-02): add a health department's inspection data
 * (open-data dataset, ArcGIS layer, CSV or a page with a table), check how its columns were read,
 * then read it in the background and see which restaurants are on Menuply and which aren't.
 * Inspection results are stored only; nothing is shown to diners.
 */

import React, { useCallback, useEffect, useState } from "react";
import OwnerLayout, { OWNER_COLORS } from "./OwnerLayout.jsx";
import {
  Pill,
  Step,
  errorStyle,
  inputStyle,
  labelStyle,
  mutedStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  tdStyle,
  thStyle,
} from "./OwnerFranchiseBot.jsx";
import {
  addHealthDeptSource,
  healthDeptSourceAction,
  listHealthDeptFacilities,
  listHealthDeptSources,
  previewHealthDeptSource,
} from "../../lib/ownerApi.js";

const smallButton = { ...secondaryButtonStyle, padding: "5px 12px", fontSize: 13 };
const KIND_LABELS = { socrata: "Open-data dataset", arcgis: "ArcGIS layer", csv: "CSV file", html_table: "Page with a table" };
const FIELD_LABELS = { name: "Name", address: "Address", city: "City", postal_code: "ZIP", inspected_on: "Inspection date", score: "Score", grade: "Grade", violation: "Violations", facility_type: "Type", facility_id: "Facility ID", lat: "Latitude", lng: "Longitude" };
const STATUS_TONES = { ready: "grey", running: "blue", paused: "amber", done: "green", failed: "red" };
const STATUS_LABELS = { ready: "Not read yet", running: "Reading", paused: "Paused", done: "Done", failed: "Stopped" };
const FILTERS = [["not_on_menuply", "Not on Menuply"], ["on_menuply", "On Menuply"], ["all", "Everything"]];

function AddSource({ onAdded }) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState("");
  const [county, setCounty] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function check(e, target = url) {
    e?.preventDefault();
    setBusy("check");
    setError("");
    setPreview(null);
    try {
      const out = await previewHealthDeptSource(target);
      setUrl(target);
      setPreview(out.preview);
    } catch (err) {
      setError(err?.message || "Couldn't read that address");
    } finally {
      setBusy("");
    }
  }

  async function add() {
    setBusy("add");
    setError("");
    try {
      const out = await addHealthDeptSource({ url: preview.url, state: state || null, county: county || null, field_map: preview.field_map, run: true });
      setPreview(null);
      setUrl("");
      onAdded(out.source);
    } catch (err) {
      setError(err?.message || "Couldn't add it");
    } finally {
      setBusy("");
    }
  }

  return (
    <Step number={1} title="Add a health department" subtitle="Paste the address of its inspection data: an open-data dataset, an ArcGIS layer, a CSV download, or a page with a results table.">
      <form onSubmit={check} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle} htmlFor="hd-url">Web address</label>
            <input id="hd-url" style={{ ...inputStyle, width: "100%" }} value={url} onChange={(e) => { setUrl(e.target.value); setPreview(null); }} placeholder="https://data.cityofnewyork.us/…/43nn-pn8j" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="hd-county">County (optional)</label>
            <input id="hd-county" style={{ ...inputStyle, width: "100%" }} value={county} onChange={(e) => setCounty(e.target.value)} placeholder="Orange" />
          </div>
          <div>
            <label style={labelStyle} htmlFor="hd-state">State</label>
            <input id="hd-state" style={{ ...inputStyle, width: 90 }} maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="CA" />
          </div>
        </div>
        <div>
          <button type="submit" style={primaryButtonStyle({ busy: busy === "check", disabled: !url.trim() })} disabled={Boolean(busy) || !url.trim()}>
            {busy === "check" ? "Reading…" : "Check"}
          </button>
        </div>
      </form>
      {error ? <div style={errorStyle}>{error}</div> : null}
      {preview ? (
        <div style={{ marginTop: 16, padding: 14, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, display: "grid", gap: 10 }}>
          <div style={{ fontWeight: 700 }}>{KIND_LABELS[preview.kind] || preview.kind}</div>
          <div style={mutedStyle}>
            Columns found:{" "}
            {Object.keys(FIELD_LABELS).filter((f) => preview.field_map[f]).map((f) => `${FIELD_LABELS[f]} (${preview.field_map[f]})`).join(", ") || "none"}
            {preview.food_service_share != null ? ` · ${preview.food_service_share}% of the sample are food service` : ""}
          </div>
          {preview.missing.length ? (
            <div style={{ ...mutedStyle, color: "#93370d" }}>Not found: {preview.missing.map((f) => FIELD_LABELS[f] || f).join(", ")}.</div>
          ) : null}
          {preview.data_links.length ? (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={mutedStyle}>This page links to data the bot reads more reliably:</div>
              {preview.data_links.slice(0, 6).map((l) => (
                <div key={l.url} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <button type="button" style={smallButton} disabled={Boolean(busy)} onClick={() => check(null, l.url)}>Use this</button>
                  <span style={{ fontSize: 13 }}>{KIND_LABELS[l.kind]}: {l.text || l.url}</span>
                </div>
              ))}
            </div>
          ) : null}
          {preview.sample.length ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>{["Name", "Address", "Type", "Last inspection", "Score / grade"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preview.sample.map(({ facility: f, inspection: i }, n) => (
                    <tr key={n}>
                      <td style={tdStyle}>{f.name}</td>
                      <td style={tdStyle}>{[f.address_line1, f.city, f.postal_code].filter(Boolean).join(", ")}</td>
                      <td style={tdStyle}>{f.facility_type || "—"}{f.is_food_service ? "" : " (not food service)"}</td>
                      <td style={tdStyle}>{i?.inspected_on || "—"}</td>
                      <td style={tdStyle}>{[i?.score, i?.grade].filter((x) => x != null && x !== "").join(" / ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={mutedStyle}>No rows read from this address.</div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" style={primaryButtonStyle({ busy: busy === "add", disabled: !preview.field_map.name })} disabled={Boolean(busy) || !preview.field_map.name} onClick={add}>
              {busy === "add" ? "Adding…" : "Add and read it"}
            </button>
            <button type="button" style={smallButton} disabled={Boolean(busy)} onClick={() => setPreview(null)}>Not this one</button>
          </div>
        </div>
      ) : null}
    </Step>
  );
}

function Facilities({ sourceId }) {
  const [filter, setFilter] = useState("not_on_menuply");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    listHealthDeptFacilities(sourceId, filter)
      .then((out) => { if (alive) { setRows(out.facilities || []); setError(""); } })
      .catch((err) => { if (alive) setError(err?.message || "Couldn't load"); });
    return () => { alive = false; };
  }, [sourceId, filter]);

  return (
    <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {FILTERS.map(([k, label]) => (
          <button key={k} type="button" onClick={() => { setRows(null); setFilter(k); }}
            style={{ ...smallButton, borderColor: filter === k ? OWNER_COLORS.accent : OWNER_COLORS.line, color: filter === k ? OWNER_COLORS.accent : OWNER_COLORS.ink }}>
            {label}
          </button>
        ))}
      </div>
      {error ? <div style={errorStyle}>{error}</div> : null}
      {rows === null ? <div style={mutedStyle}>Loading…</div> : rows.length === 0 ? <div style={mutedStyle}>Nothing here yet.</div> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>{["Name", "Address", "Last inspection", "On Menuply"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id}>
                  <td style={tdStyle}>{f.name}{f.is_food_service ? "" : <span style={mutedStyle}> · {f.facility_type || "not food service"}</span>}</td>
                  <td style={tdStyle}>{[f.address_line1, f.city, f.postal_code].filter(Boolean).join(", ") || "—"}</td>
                  <td style={tdStyle}>{f.last_inspected_on ? String(f.last_inspected_on).slice(0, 10) : "—"}{f.last_score != null || f.last_grade ? ` · ${[f.last_score, f.last_grade].filter((x) => x != null && x !== "").join(" / ")}` : ""}</td>
                  <td style={tdStyle}>
                    {f.matched_restaurant_id ? (
                      <a href={`/owner/menu-manager?restaurant=${f.matched_restaurant_id}`} style={{ color: OWNER_COLORS.ink }}>{f.restaurant_name || `#${f.matched_restaurant_id}`}</a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length >= 200 ? <div style={mutedStyle}>Showing the 200 most recently inspected.</div> : null}
        </div>
      )}
    </div>
  );
}

function SourceRow({ source, onChanged }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const c = source.counts || {};
  const status = source.running_now ? "running" : source.status;

  async function act(action) {
    setBusy(true);
    setError("");
    try {
      await healthDeptSourceAction(source.id, action);
      onChanged();
    } catch (err) {
      setError(err?.message || "Didn't work");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 14, border: `1px solid ${OWNER_COLORS.line}`, borderRadius: 12, display: "grid", gap: 6 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, wordBreak: "break-all" }}>{source.label || [source.county, source.state].filter(Boolean).join(", ") || new URL(source.url).hostname}</div>
        <Pill tone={STATUS_TONES[status] || "grey"}>{STATUS_LABELS[status] || status}</Pill>
      </div>
      <div style={{ ...mutedStyle, wordBreak: "break-all" }}>{KIND_LABELS[source.kind]} · {source.url}</div>
      <div style={{ fontSize: 13 }}>
        {(c.rows_read || 0).toLocaleString()} rows read · {(c.food_service || 0).toLocaleString()} food service places · {(c.on_menuply || 0).toLocaleString()} on Menuply · {(c.not_on_menuply || 0).toLocaleString()} not on Menuply · {(c.inspections || 0).toLocaleString()} inspections
      </div>
      {source.last_error && status !== "running" ? <div style={errorStyle}>{source.last_error}</div> : null}
      {error ? <div style={errorStyle}>{error}</div> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {status === "running" ? (
          <button type="button" style={smallButton} disabled={busy} onClick={() => act("pause")}>Pause</button>
        ) : (
          <button type="button" style={smallButton} disabled={busy} onClick={() => act("run")}>{status === "done" ? "Read again" : status === "ready" ? "Read" : "Continue"}</button>
        )}
        <button type="button" style={smallButton} onClick={() => setOpen((o) => !o)}>{open ? "Hide places" : "Places"}</button>
      </div>
      {open ? <Facilities sourceId={source.id} /> : null}
    </div>
  );
}

export default function OwnerHealthDeptBot() {
  const [sources, setSources] = useState(null);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let alive = true;
    listHealthDeptSources()
      .then((out) => { if (alive) { setSources(out.sources || []); setError(""); } })
      .catch((err) => { if (alive) { setSources([]); setError(err?.message || "Couldn't load sources"); } });
    return () => { alive = false; };
  }, [tick]);

  // While anything is reading, refresh every 10 s.
  useEffect(() => {
    if (!sources?.some((s) => s.running_now || s.status === "running")) return undefined;
    const id = setTimeout(refresh, 10000);
    return () => clearTimeout(id);
  }, [sources, refresh]);

  return (
    <OwnerLayout title="HealthDeptBot">
      <div style={{ display: "grid", gap: 16 }}>
        <AddSource onAdded={refresh} />
        <Step number={2} title="Health departments" subtitle="Each one is read page by page in the background. Inspection results are kept for Menuply only; diners don't see them.">
          {error ? <div style={errorStyle}>{error}</div> : null}
          {sources === null ? <div style={mutedStyle}>Loading…</div> : sources.length === 0 ? <div style={mutedStyle}>None added yet.</div> : (
            <div style={{ display: "grid", gap: 12 }}>
              {sources.map((s) => <SourceRow key={s.id} source={s} onChanged={refresh} />)}
            </div>
          )}
        </Step>
      </div>
    </OwnerLayout>
  );
}
