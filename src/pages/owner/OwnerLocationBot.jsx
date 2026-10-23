import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import OwnerLayout, { OWNER_COLORS } from "./OwnerLayout.jsx";
import {
  ChainPicker,
  Pill,
  Step,
  errorStyle,
  inputStyle,
  labelStyle,
  mutedStyle,
  primaryButtonStyle,
  tdStyle,
  thStyle,
  useJob,
} from "./OwnerFranchiseBot.jsx";
import { parseFranchiseBotPaste, startLocationBotApply, startLocationBotPreview } from "../../lib/ownerApi.js";

/**
 * Owner → Bots → Location Bot.
 *   1. Choose the chain (and its official store locator)
 *   2. Paste its locations (Google Maps results, the brand's store list, CSV)
 *   3. Check: the locator completes each store by phone; every store we have shows the
 *      exact changes (phone, street, city, ZIP, map pin, Open 24 hours); missing stores are "New"
 *   4. Apply the ticked stores — each on its own; previous values are kept in the audit log
 */

const FIELD_LABELS = {
  phone: "Phone",
  address_line1: "Street",
  city: "City",
  postal_code: "ZIP",
  coordinates: "Map pin",
  hours: "Hours",
};

function formatValue(change, side) {
  const v = change[side];
  if (change.field === "coordinates") {
    if (!v) return "none";
    return side === "to" && change.moved_m != null ? `moved ${change.moved_m} m` : `${v.lat.toFixed(5)}, ${v.lng.toFixed(5)}`;
  }
  return v == null || v === "" ? "—" : String(v);
}

function actionPill(row) {
  if (row.action === "update") return <Pill tone="blue">Update #{row.existing?.restaurant_id}</Pill>;
  if (row.action === "no_change") return <Pill tone="grey">Up to date #{row.existing?.restaurant_id}</Pill>;
  if (row.action === "add") return <Pill tone="green">New store</Pill>;
  return <Pill tone="amber">Needs address</Pill>;
}

const MATCH_LABELS = {
  external_id: "matched earlier",
  phone: "matched by phone",
  address: "matched by address",
  street: "matched by street",
  map_pin: "matched by map pin",
  same_city_no_address: "only store in this city without an address — check",
};

function ChangesCell({ row, onToggleReplaceHours }) {
  if (!row.changes?.length) {
    return <span style={mutedStyle}>{row.action === "add" ? "Added with the chain menu" : "—"}</span>;
  }
  return (
    <div style={{ display: "grid", gap: 3 }}>
      {row.changes.map((c) => (
        <div key={c.field}>
          <strong>{FIELD_LABELS[c.field] || c.field}:</strong>{" "}
          <span style={{ color: OWNER_COLORS.muted, textDecoration: "line-through" }}>{formatValue(c, "from")}</span> →{" "}
          {formatValue(c, "to")}
          {c.field === "hours" && c.replaces_existing ? (
            <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, marginTop: 2 }}>
              <input type="checkbox" checked={row.replace_hours === true} onChange={(e) => onToggleReplaceHours(e.target.checked)} />
              Replace the hours this store already has
            </label>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function OwnerLocationBot() {
  const [chain, setChain] = useState(null);
  const [locatorUrl, setLocatorUrl] = useState("");
  const [defaultState, setDefaultState] = useState("");
  const [paste, setPaste] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [rows, setRows] = useState(null);
  const [previewJob, followPreview, setPreviewJob] = useJob();
  const [applyJob, followApply, setApplyJob] = useJob();
  const [startError, setStartError] = useState("");

  const applying = applyJob?.status === "running";

  function reset({ keepPaste = false } = {}) {
    if (!keepPaste) {
      setPaste("");
      setParsed(null);
    }
    setPreview(null);
    setRows(null);
    setPreviewJob(null);
    setApplyJob(null);
    setStartError("");
  }

  function chooseChain(c) {
    setChain(c);
    setLocatorUrl(c?.suggested_locator_url || "");
    reset();
  }

  async function readList() {
    setParsing(true);
    setParseError("");
    reset({ keepPaste: true });
    try {
      setParsed(await parseFranchiseBotPaste(paste, defaultState.trim() || null));
    } catch (err) {
      setParseError(err?.message || "Could not read the list");
    } finally {
      setParsing(false);
    }
  }

  async function check() {
    reset({ keepPaste: true });
    try {
      const data = await startLocationBotPreview({
        chain_id: chain.id,
        locations: parsed.locations,
        locator_base_url: locatorUrl.trim() || null,
        default_state: defaultState.trim() || null,
      });
      followPreview(data.job);
    } catch (err) {
      setStartError(err?.message || "Could not start the check");
    }
  }

  useEffect(() => {
    if (previewJob?.status === "done" && previewJob.result && !preview) {
      setPreview(previewJob.result);
      setRows(previewJob.result.rows.map((r) => ({ ...r, include: r.action === "update" || r.action === "add" })));
    }
  }, [previewJob, preview]);

  function patchRow(key, patch) {
    setRows((cur) => cur.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  const selected = useMemo(() => (rows || []).filter((r) => r.include && (r.action === "update" || r.action === "add")), [rows]);

  async function apply() {
    if (!selected.length) return;
    const updates = selected.filter((r) => r.action === "update").length;
    const adds = selected.length - updates;
    const ok = window.confirm(
      `Apply in production: update ${updates} ${chain.name} store${updates === 1 ? "" : "s"}` +
        (adds ? ` and add ${adds} new store${adds === 1 ? "" : "s"}` : "") +
        "?\n\nPrevious values are kept in the audit log."
    );
    if (!ok) return;
    setStartError("");
    try {
      const data = await startLocationBotApply({ chain_id: chain.id, rows: selected });
      followApply(data.job);
    } catch (err) {
      setStartError(err?.message || "Could not start the update");
    }
  }

  const result = applyJob?.status === "done" ? applyJob.result : null;
  const s = preview?.summary;

  return (
    <OwnerLayout title="Location Bot">
      <div style={{ display: "grid", gap: 16 }}>
        <div style={mutedStyle}>
          Paste a chain's locations — Google Maps results work as they are. The bot checks each one against the brand's
          official store locator, then shows exactly what would change on the stores Menuply already has (phone, street,
          city, ZIP, map pin, “Open 24 hours”). Stores we don't have yet are added like Franchise Bot does. Nothing is
          written until you press Apply. <Link to="/owner/bots">All bots</Link>
        </div>

        <Step number={1} title="Chain" subtitle="Whose locations are these?" done={Boolean(chain)}>
          <ChainPicker chain={chain} onChange={chooseChain} disabled={applying} />
          {chain ? (
            <div style={{ display: "grid", gap: 12, marginTop: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
              <div>
                <label style={labelStyle} htmlFor="location-bot-locator">Official store locator</label>
                <input
                  id="location-bot-locator"
                  style={{ ...inputStyle, width: "100%" }}
                  value={locatorUrl}
                  onChange={(e) => setLocatorUrl(e.target.value)}
                  placeholder="https://locations.example.com"
                />
                <div style={{ ...mutedStyle, marginTop: 4 }}>Fills street, ZIP and map pin by phone number. Leave empty to use the paste only.</div>
              </div>
              <div>
                <label style={labelStyle} htmlFor="location-bot-state">State (if the list doesn't say)</label>
                <input
                  id="location-bot-state"
                  style={{ ...inputStyle, width: 90 }}
                  value={defaultState}
                  maxLength={2}
                  onChange={(e) => setDefaultState(e.target.value.toUpperCase())}
                  placeholder="CA"
                />
              </div>
            </div>
          ) : null}
        </Step>

        {chain ? (
          <Step number={2} title="Paste locations" subtitle="Copy straight from Google Maps or the brand's locations page." done={Boolean(parsed)}>
            <textarea
              aria-label="Location list"
              style={{ ...inputStyle, width: "100%", minHeight: 180, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
              value={paste}
              onChange={(e) => {
                setPaste(e.target.value);
                if (parsed) reset({ keepPaste: true });
                setParsed(null);
              }}
              placeholder={"IHOP\n800 Flower St · (213) 629-1759\nOpen 24 hours\nIHOP\nInglewood, CA · (310) 844-7196"}
            />
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" style={primaryButtonStyle({ busy: parsing, disabled: !paste.trim() })} disabled={!paste.trim() || parsing} onClick={readList}>
                {parsing ? "Reading…" : "Read list"}
              </button>
              {parsed ? (
                <span style={mutedStyle}>
                  Found <strong>{parsed.locations.length}</strong> locations
                  {parsed.locations.some((l) => l.open24h) ? ` · ${parsed.locations.filter((l) => l.open24h).length} say “Open 24 hours”` : ""}
                  {parsed.duplicates.length ? ` · ${parsed.duplicates.length} listed twice (merged)` : ""}
                  {parsed.ignored_lines ? ` · ${parsed.ignored_lines} other lines skipped (reviews, buttons…)` : ""}
                </span>
              ) : null}
            </div>
            {parseError ? <div style={errorStyle}>{parseError}</div> : null}
          </Step>
        ) : null}

        {parsed?.locations?.length ? (
          <Step number={3} title="Check" subtitle="Compare with the stores Menuply has." done={Boolean(preview)}>
            <button
              type="button"
              style={primaryButtonStyle({ busy: previewJob?.status === "running" })}
              disabled={previewJob?.status === "running" || applying}
              onClick={check}
            >
              {previewJob?.status === "running" ? "Checking…" : preview ? "Check again" : "Check locations"}
            </button>
            {previewJob?.status === "running" ? <div style={{ ...mutedStyle, marginTop: 8 }}>{previewJob.progress?.message}</div> : null}
            {previewJob?.status === "failed" ? <div style={errorStyle}>{previewJob.error}</div> : null}
            {startError && !applyJob ? <div style={errorStyle}>{startError}</div> : null}

            {preview ? (
              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill tone="blue">{s.update} to update</Pill>
                  <Pill tone="green">{s.add} new</Pill>
                  <Pill tone="grey">{s.no_change} up to date</Pill>
                  {s.needs_address ? <Pill tone="amber">{s.needs_address} need an address</Pill> : null}
                  {s.hours_24h ? <Pill tone="green">{s.hours_24h} get “Open 24 hours”</Pill> : null}
                  {s.hours_flagged ? <Pill tone="amber">{s.hours_flagged} hours disagree — left alone</Pill> : null}
                </div>
                {preview.locator?.used ? (
                  <div style={mutedStyle}>
                    Store locator: {preview.locator.pages_fetched} pages read
                    {preview.locator.errors?.length ? ` · ${preview.locator.errors.length} errors (${preview.locator.errors[0]})` : ""}
                  </div>
                ) : null}
                {(preview.warnings || []).map((w) => (
                  <div key={w} style={{ ...errorStyle, color: "#93370d", marginTop: 0 }}>{w}</div>
                ))}

                <div style={{ overflowX: "auto" }}>
                  <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
                    <thead>
                      <tr>
                        <th style={thStyle}></th>
                        <th style={thStyle}>Location</th>
                        <th style={thStyle}>Menuply</th>
                        <th style={thStyle}>Changes</th>
                        <th style={thStyle}>Hours note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const actionable = r.action === "update" || r.action === "add";
                        return (
                          <tr key={r.key} style={{ opacity: actionable && !r.include ? 0.5 : 1 }}>
                            <td style={tdStyle}>
                              <input
                                type="checkbox"
                                aria-label={`Include ${r.addressLine1 || r.city}`}
                                checked={Boolean(r.include)}
                                disabled={!actionable || applying}
                                onChange={(e) => patchRow(r.key, { include: e.target.checked })}
                              />
                            </td>
                            <td style={tdStyle}>
                              <div style={{ fontWeight: 700 }}>{r.addressLine1 || <span style={mutedStyle}>no street</span>}</div>
                              <div style={mutedStyle}>
                                {[r.city, r.state].filter(Boolean).join(", ")} {r.postalCode || ""}
                              </div>
                              <div style={mutedStyle}>{r.phone || ""}</div>
                            </td>
                            <td style={tdStyle}>
                              {actionPill(r)}
                              {r.existing?.match_method ? (
                                <div
                                  style={{
                                    fontSize: 12,
                                    marginTop: 4,
                                    color: r.existing.match_method === "same_city_no_address" ? "#b45309" : OWNER_COLORS.muted,
                                    fontWeight: r.existing.match_method === "same_city_no_address" ? 600 : 400,
                                  }}
                                >
                                  {MATCH_LABELS[r.existing.match_method] || r.existing.match_method}
                                </div>
                              ) : null}
                            </td>
                            <td style={tdStyle}>
                              <ChangesCell row={r} onToggleReplaceHours={(v) => patchRow(r.key, { replace_hours: v })} />
                            </td>
                            <td style={{ ...tdStyle, ...mutedStyle, maxWidth: 220 }}>{r.hours_note || ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {preview.not_in_paste?.length ? (
                  <details>
                    <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                      {preview.not_in_paste.length} {chain.name} store{preview.not_in_paste.length === 1 ? "" : "s"} in Menuply not in this list (left as they are)
                    </summary>
                    <ul style={{ ...mutedStyle, margin: "6px 0 0", paddingLeft: 18 }}>
                      {preview.not_in_paste.map((o) => (
                        <li key={o.restaurant_id}>
                          #{o.restaurant_id} {o.address_line1 || "no street"}, {o.city || "no city"}
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            ) : null}
          </Step>
        ) : null}

        {preview ? (
          <Step number={4} title="Apply" subtitle="Each store is saved on its own." done={Boolean(result)}>
            <button
              type="button"
              style={primaryButtonStyle({ busy: applying, disabled: !selected.length })}
              disabled={!selected.length || applying}
              onClick={apply}
            >
              {applying ? "Applying…" : `Apply ${selected.length} store${selected.length === 1 ? "" : "s"}`}
            </button>
            {applying ? <div style={{ ...mutedStyle, marginTop: 8 }}>{applyJob.progress?.message}</div> : null}
            {applyJob?.status === "failed" ? <div style={errorStyle}>{applyJob.error}</div> : null}
            {startError && applyJob ? <div style={errorStyle}>{startError}</div> : null}
            {result ? (
              <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Pill tone="blue">{result.summary.updated} updated</Pill>
                  <Pill tone="green">{result.summary.added} added</Pill>
                  {result.summary.unchanged ? <Pill tone="grey">{result.summary.unchanged} unchanged</Pill> : null}
                  {result.summary.failed ? <Pill tone="red">{result.summary.failed} failed</Pill> : null}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                  {result.results.map((r) => (
                    <li key={`${r.key}-${r.restaurant_id || ""}`} style={{ color: r.ok ? OWNER_COLORS.ink : "#b42318" }}>
                      {r.label}
                      {r.restaurant_id ? ` (#${r.restaurant_id})` : ""}: {r.ok ? (r.applied?.length ? r.applied.join(", ") : "no change") : r.error}
                      {r.skipped?.length ? <span style={mutedStyle}> · skipped {r.skipped.join("; ")}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Step>
        ) : null}
      </div>
    </OwnerLayout>
  );
}
